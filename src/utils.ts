import { Functionary, DenominationStock, DistributionSummary, FunctionaryAllocation, PayoutAllocation } from './types';

/**
 * Perform Cash Distribution calculation
 * Supports two modes:
 * 1. Unlimited (Withdrawal Planner)
 * 2. Limited (Drawer Distribution)
 */
export function calculateDistribution(
  functionaries: Functionary[],
  denominations: number[],
  stock: DenominationStock,
  isUnlimited: boolean,
  manualOverrides: Record<string, PayoutAllocation | null> = {},
  isEquivalentMode: boolean = false,
  ensureAllDenominations: boolean = true
): DistributionSummary {
  const totalTargetPayout = functionaries.reduce((sum, f) => sum + f.amount, 0);
  
  // Initialize remaining stock
  const leftoverNotes: DenominationStock = {};
  denominations.forEach(denom => {
    leftoverNotes[denom] = isUnlimited ? Infinity : (stock[denom] || 0);
  });

  const allocations: { [id: string]: FunctionaryAllocation } = {};

  // 1. Process manual overrides first to reserve those notes
  const overriddenIds = new Set<string>();
  
  functionaries.forEach(f => {
    const override = manualOverrides[f.id];
    if (override) {
      overriddenIds.add(f.id);
      const notes: PayoutAllocation = {};
      let allocatedAmount = 0;

      denominations.forEach(denom => {
        const count = override[denom] || 0;
        if (count > 0) {
          // If limited, check if we have enough notes in stock
          const allowedCount = isUnlimited ? count : Math.min(count, leftoverNotes[denom] || 0);
          notes[denom] = allowedCount;
          allocatedAmount += allowedCount * denom;
          if (!isUnlimited) {
            leftoverNotes[denom] -= allowedCount;
          }
        } else {
          notes[denom] = 0;
        }
      });

      let status: FunctionaryAllocation['status'] = 'unpaid';
      if (allocatedAmount === f.amount) {
        status = 'fully_paid';
      } else if (allocatedAmount > f.amount) {
        status = 'overpaid';
      } else if (allocatedAmount > 0) {
        status = 'partially_paid';
      }

      allocations[f.id] = {
        functionaryId: f.id,
        allocatedAmount,
        notes,
        status,
      };
    }
  });

  // 2. Process automatic distributions for the remaining functionaries
  const autoFunctionaries = functionaries.filter(f => !overriddenIds.has(f.id));
  
  // Sort auto functionaries descending by target amount to prioritize larger payouts
  const sortedAutoFunctionaries = [...autoFunctionaries].sort((a, b) => b.amount - a.amount);

  const remainingPayouts: Record<string, number> = {};
  const autoNotes: Record<string, PayoutAllocation> = {};

  sortedAutoFunctionaries.forEach(f => {
    remainingPayouts[f.id] = f.amount;
    autoNotes[f.id] = {};
    denominations.forEach(d => { autoNotes[f.id][d] = 0; });

    if (f.amount <= 0) {
      allocations[f.id] = {
        functionaryId: f.id,
        allocatedAmount: 0,
        notes: autoNotes[f.id],
        status: 'unpaid',
      };
    }
  });

  const activeAutoFunctionaries = sortedAutoFunctionaries.filter(f => f.amount > 0);
  const sortedDenoms = [...denominations].sort((a, b) => b - a);

  /**
   * Helper function to distribute notes of a single denomination `denom`
   * equitably (round-robin) among all active functionaries who need payout >= denom.
   */
  const distributeDenominationEquitably = (
    denom: number,
    maxNotesPerPerson?: number
  ) => {
    while (true) {
      if (!isUnlimited && (leftoverNotes[denom] || 0) <= 0) break;

      const eligible = activeAutoFunctionaries.filter(f => {
        if (remainingPayouts[f.id] < denom) return false;
        if (maxNotesPerPerson !== undefined && (autoNotes[f.id][denom] || 0) >= maxNotesPerPerson) return false;
        return true;
      });

      if (eligible.length === 0) break;

      const countsNeeded = eligible.map(f => {
        const needed = Math.floor(remainingPayouts[f.id] / denom);
        if (maxNotesPerPerson !== undefined) {
          const alreadyHave = autoNotes[f.id][denom] || 0;
          return Math.min(needed, maxNotesPerPerson - alreadyHave);
        }
        return needed;
      });

      const minNeeded = Math.min(...countsNeeded);
      if (minNeeded <= 0) break;

      const m = eligible.length;

      if (isUnlimited) {
        eligible.forEach(f => {
          autoNotes[f.id][denom] = (autoNotes[f.id][denom] || 0) + minNeeded;
          remainingPayouts[f.id] -= minNeeded * denom;
        });
      } else {
        const avail = leftoverNotes[denom] || 0;
        const totalNeeded = minNeeded * m;

        if (avail >= totalNeeded) {
          eligible.forEach(f => {
            autoNotes[f.id][denom] = (autoNotes[f.id][denom] || 0) + minNeeded;
            remainingPayouts[f.id] -= minNeeded * denom;
          });
          leftoverNotes[denom] -= totalNeeded;
        } else {
          const k = Math.floor(avail / m);
          if (k > 0) {
            eligible.forEach(f => {
              autoNotes[f.id][denom] = (autoNotes[f.id][denom] || 0) + k;
              remainingPayouts[f.id] -= k * denom;
            });
            leftoverNotes[denom] -= k * m;
          }

          const remainder = leftoverNotes[denom] || 0;
          if (remainder > 0) {
            const sortedEligible = [...eligible].sort((a, b) => {
              const cntA = autoNotes[a.id][denom] || 0;
              const cntB = autoNotes[b.id][denom] || 0;
              if (cntA !== cntB) return cntA - cntB;
              return b.amount - a.amount;
            });

            for (let i = 0; i < remainder; i++) {
              const f = sortedEligible[i];
              if (f && remainingPayouts[f.id] >= denom) {
                autoNotes[f.id][denom] = (autoNotes[f.id][denom] || 0) + 1;
                remainingPayouts[f.id] -= denom;
                leftoverNotes[denom] -= 1;
              }
            }
          }
          break;
        }
      }
    }
  };

  // Variety mode: pre-allocate 1 note of each available denomination round-robin
  if (ensureAllDenominations) {
    const availableDenomsAsc = [...denominations]
      .filter(d => (leftoverNotes[d] || 0) > 0 || isUnlimited)
      .sort((a, b) => a - b);

    availableDenomsAsc.forEach(denom => {
      distributeDenominationEquitably(denom, 1);
    });
  }

  // Main distribution: allocate denominations round-robin from highest to lowest
  sortedDenoms.forEach(denom => {
    distributeDenominationEquitably(denom);
  });

  // Finalize allocations
  activeAutoFunctionaries.forEach(f => {
    const allocatedAmount = f.amount - remainingPayouts[f.id];
    let status: FunctionaryAllocation['status'] = 'unpaid';
    if (allocatedAmount === f.amount) {
      status = 'fully_paid';
    } else if (allocatedAmount > 0) {
      status = 'partially_paid';
    }

    allocations[f.id] = {
      functionaryId: f.id,
      allocatedAmount,
      notes: autoNotes[f.id],
      status,
    };
  });

  // 3. Compute Totals
  const totalCashAvailable = isUnlimited
    ? totalTargetPayout
    : denominations.reduce((sum, denom) => sum + (stock[denom] || 0) * denom, 0);

  const totalAllocated = functionaries.reduce(
    (sum, f) => sum + (allocations[f.id]?.allocatedAmount || 0),
    0
  );

  const unallocatedCash = isUnlimited
    ? 0
    : denominations.reduce((sum, denom) => sum + (leftoverNotes[denom] || 0) * denom, 0);

  const unpaidPayout = totalTargetPayout - totalAllocated;

  // 4. Calculate Notes Needed For Perfect Payout (only relevant for Withdrawal Planning)
  const notesNeededForPerfectPayout: DenominationStock = {};
  denominations.forEach(denom => {
    notesNeededForPerfectPayout[denom] = 0;
  });

  if (isUnlimited) {
    functionaries.forEach(f => {
      const alloc = allocations[f.id];
      if (alloc) {
        denominations.forEach(denom => {
          notesNeededForPerfectPayout[denom] += alloc.notes[denom] || 0;
        });
      }
    });
  }

  return {
    totalTargetPayout,
    totalCashAvailable,
    totalAllocated,
    unallocatedCash,
    unpaidPayout,
    allocations,
    leftoverNotes: isUnlimited ? {} : leftoverNotes,
    notesNeededForPerfectPayout,
  };
}

/**
 * Format currency amount cleanly
 */
export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generate a WhatsApp / Text shareable summary of the distribution
 */
export function generateShareableSummary(
  summary: DistributionSummary,
  functionaries: Functionary[],
  denominations: number[],
  currencySymbol: string,
  isUnlimited: boolean,
  isEquivalentMode: boolean = false,
  ensureAllDenominations: boolean = true
): string {
  const dateStr = formatDateDDMMYYYY();
  let text = `💵 *Cash Distribution Summary - ${dateStr}*\n`;
  text += `-------------------------------------------\n`;
  text += `🎯 Total Payouts: ${formatCurrency(summary.totalTargetPayout, currencySymbol)}\n`;
  text += `⚙️ Strategy: ${isEquivalentMode ? 'Equivalent (Balanced Mix)' : 'Greedy (Fewer Notes)'}${ensureAllDenominations ? ' [Ensure Variety Active]' : ''}\n`;
  
  if (isUnlimited) {
    text += `📈 Mode: Withdrawal Planner (Unlimited Drawer)\n\n`;
    text += `*🏦 Notes to Withdraw from Bank:*\n`;
    denominations.forEach(denom => {
      const count = summary.notesNeededForPerfectPayout[denom] || 0;
      if (count > 0) {
        text += `• ${currencySymbol}${denom} notes: ${count} (Value: ${formatCurrency(count * denom, currencySymbol)})\n`;
      }
    });
  } else {
    text += `💼 Mode: Cash Drawer Distribution (Limited Cash)\n`;
    text += `💰 Total Cash in Drawer: ${formatCurrency(summary.totalCashAvailable, currencySymbol)}\n`;
    text += `✅ Total Cash Distributed: ${formatCurrency(summary.totalAllocated, currencySymbol)}\n`;
    if (summary.unallocatedCash > 0) {
      text += `📥 Unallocated Leftover Cash: ${formatCurrency(summary.unallocatedCash, currencySymbol)}\n`;
    }
    if (summary.unpaidPayout > 0) {
      text += `⚠️ Unpaid/Shortfall Amount: ${formatCurrency(summary.unpaidPayout, currencySymbol)}\n`;
    }
  }

  text += `\n*👤 Functionary Breakdowns:*\n`;
  functionaries.forEach((f, idx) => {
    const alloc = summary.allocations[f.id];
    if (!alloc || f.amount <= 0) return;

    const statusIcon = alloc.status === 'fully_paid' ? '✅' : alloc.status === 'partially_paid' ? '⚠️' : '❌';
    text += `\n${idx + 1}. *${f.name}*\n`;
    text += `   • Pensions: ${f.pensions || 1}\n`;
    text += `   • Target: ${formatCurrency(f.amount, currencySymbol)}\n`;
    text += `   • Paid: ${formatCurrency(alloc.allocatedAmount, currencySymbol)} ${statusIcon}\n`;
    
    const noteParts: string[] = [];
    denominations.forEach(denom => {
      const count = alloc.notes[denom] || 0;
      if (count > 0) {
        noteParts.push(`${count} x ${currencySymbol}${denom}`);
      }
    });
    
    if (noteParts.length > 0) {
      text += `   • Notes: ${noteParts.join(', ')}\n`;
    } else {
      text += `   • Notes: None\n`;
    }
    if (f.notes) {
      text += `   • Remarks: ${f.notes}\n`;
    }
  });

  return text;
}

/**
 * Get sample data for quick start
 */
export function getSampleFunctionaries(): Functionary[] {
  return [
    { id: '1', name: 'Arjun Sharma', amount: 12500, pensions: 1, notes: 'Prefers 500s' },
    { id: '2', name: 'Priya Patel', amount: 8400, pensions: 2, notes: 'Requires clean bills for temple' },
    { id: '3', name: 'Rajesh Kumar', amount: 15000, pensions: 1, notes: 'Needs small change (10s, 20s)' },
    { id: '4', name: 'Ananya Rao', amount: 6200, pensions: 3 },
    { id: '5', name: 'Vikram Singh', amount: 11000, pensions: 1, notes: 'Include at least one 100' },
    { id: '6', name: 'Sneha Reddy', amount: 9500, pensions: 1 },
    { id: '7', name: 'Amit Verma', amount: 14300, pensions: 2 },
    { id: '8', name: 'Kiran Nair', amount: 5500, pensions: 1 },
    { id: '9', name: 'Deepa Joshi', amount: 10800, pensions: 1, notes: 'Collects on Monday' },
    { id: '10', name: 'Sanjay Gupta', amount: 13200, pensions: 2 },
    { id: '11', name: 'Neha Das', amount: 7800, pensions: 1 },
    { id: '12', name: 'Rohan Mehta', amount: 11500, pensions: 1 },
    { id: '13', name: 'Kavitha Swamy', amount: 9000, pensions: 1 },
    { id: '14', name: 'Manoj Pillai', amount: 12000, pensions: 2, notes: 'Split 50/50 in two envelopes' },
    { id: '15', name: 'Sunita Sen', amount: 6800, pensions: 1 },
  ];
}

export function getSampleStock(code: string): DenominationStock {
  if (code === 'INR') {
    return {
      500: 200,
      200: 100,
      100: 150,
      50: 100,
      20: 200,
      10: 300,
      5: 500,
    };
  }
  if (code === 'USD') {
    return {
      100: 10,
      50: 20,
      20: 50,
      10: 100,
      5: 100,
    };
  }
  return {
    500: 5,
    200: 10,
    100: 20,
    50: 40,
    20: 50,
    10: 100,
    5: 200,
  };
}

export function formatDateDDMMYYYY(date: Date = new Date()): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

