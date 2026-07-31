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
   * Distribute notes of a single denomination `denom` using Max-Min Water Filling.
   * Ensures that ALL functionaries who can accept `denom` get as close to equal
   * number of notes of `denom` as possible, capped only by their individual payout limits.
   */
  const distributeDenomWaterFilling = (denom: number, maxPerPerson?: number) => {
    let avail = isUnlimited ? Infinity : (leftoverNotes[denom] || 0);
    if (avail <= 0) return;

    let active = activeAutoFunctionaries
      .filter(f => remainingPayouts[f.id] >= denom)
      .map(f => {
        const alreadyAllocated = autoNotes[f.id][denom] || 0;
        let cap = Math.floor(remainingPayouts[f.id] / denom);
        if (maxPerPerson !== undefined) {
          cap = Math.min(cap, Math.max(0, maxPerPerson - alreadyAllocated));
        }
        return {
          id: f.id,
          amount: f.amount,
          cap,
        };
      })
      .filter(f => f.cap > 0);

    if (active.length === 0) return;

    while (active.length > 0 && avail > 0) {
      if (isUnlimited) {
        active.forEach(p => {
          const alloc = p.cap;
          autoNotes[p.id][denom] = (autoNotes[p.id][denom] || 0) + alloc;
          remainingPayouts[p.id] -= alloc * denom;
          p.cap = 0;
        });
        break;
      }

      const m = active.length;
      const target = Math.floor(avail / m);

      if (target === 0) {
        // Less available stock than number of active functionaries (e.g., avail = 7, m = 10).
        // Distribute 1 note each to the first `avail` functionaries (sorted by cap desc, amount desc).
        active.sort((a, b) => b.cap - a.cap || b.amount - a.amount);
        const giveCount = Math.min(avail, active.length);
        for (let i = 0; i < giveCount; i++) {
          const p = active[i];
          autoNotes[p.id][denom] = (autoNotes[p.id][denom] || 0) + 1;
          remainingPayouts[p.id] -= denom;
          leftoverNotes[denom] -= 1;
          avail -= 1;
          p.cap -= 1;
        }
        break;
      }

      // Check for members capped below `target`
      const constrained = active.filter(p => p.cap < target);

      if (constrained.length > 0) {
        // Allocate max capacity to constrained members and remove them from active set
        constrained.forEach(p => {
          const alloc = p.cap;
          autoNotes[p.id][denom] = (autoNotes[p.id][denom] || 0) + alloc;
          remainingPayouts[p.id] -= alloc * denom;
          leftoverNotes[denom] -= alloc;
          avail -= alloc;
          p.cap = 0;
        });
        active = active.filter(p => p.cap > 0);
      } else {
        // ALL active members can accept at least `target` notes!
        active.forEach(p => {
          const alloc = target;
          autoNotes[p.id][denom] = (autoNotes[p.id][denom] || 0) + alloc;
          remainingPayouts[p.id] -= alloc * denom;
          leftoverNotes[denom] -= alloc;
          avail -= alloc;
          p.cap -= target;
        });

        // Handle remainder stock (avail < active.length)
        if (avail > 0 && avail < active.length) {
          const eligibleForRemainder = active.filter(p => p.cap > 0);
          eligibleForRemainder.sort((a, b) => b.cap - a.cap || b.amount - a.amount);
          const giveCount = Math.min(avail, eligibleForRemainder.length);
          for (let i = 0; i < giveCount; i++) {
            const p = eligibleForRemainder[i];
            autoNotes[p.id][denom] = (autoNotes[p.id][denom] || 0) + 1;
            remainingPayouts[p.id] -= denom;
            leftoverNotes[denom] -= 1;
            avail -= 1;
            p.cap -= 1;
          }
        }
        break;
      }
    }
  };

  // Variety mode: pre-allocate 1 note of each available denomination round-robin
  if (ensureAllDenominations) {
    const availableDenomsAsc = [...denominations]
      .filter(d => (leftoverNotes[d] || 0) > 0 || isUnlimited)
      .sort((a, b) => a - b);

    availableDenomsAsc.forEach(denom => {
      distributeDenomWaterFilling(denom, 1);
    });
  }

  // Main distribution: allocate denominations using water-filling from highest to lowest
  sortedDenoms.forEach(denom => {
    distributeDenomWaterFilling(denom);
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

