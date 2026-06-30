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

  sortedAutoFunctionaries.forEach(f => {
    const notes: PayoutAllocation = {};
    // Initialize all notes to 0
    denominations.forEach(denom => { notes[denom] = 0; });

    let remainingPayout = f.amount;

    if (f.amount <= 0) {
      allocations[f.id] = {
        functionaryId: f.id,
        allocatedAmount: 0,
        notes,
        status: 'unpaid',
      };
      return;
    }

    // A. Pre-allocation of one of each declared available denomination if requested
    if (ensureAllDenominations) {
      // Find and sort available denominations in ascending order (smallest first) to maximize diversity
      const availableDenoms = [...denominations]
        .filter(d => (leftoverNotes[d] || 0) > 0)
        .sort((a, b) => a - b);

      availableDenoms.forEach(denom => {
        if (remainingPayout >= denom) {
          notes[denom] = 1;
          remainingPayout -= denom;
          if (!isUnlimited) {
            leftoverNotes[denom] -= 1;
          }
        }
      });
    }

    if (isEquivalentMode) {
      // In unlimited mode, optimize by doing a flat pass of k of each note first to handle huge amounts instantly
      if (isUnlimited) {
        const S = denominations.reduce((sum, d) => sum + d, 0);
        const k = Math.floor(remainingPayout / S);
        if (k > 0) {
          denominations.forEach(denom => {
            notes[denom] = (notes[denom] || 0) + k;
          });
          remainingPayout -= k * S;
        }
      }

      // Now allocate the rest (or all, in limited mode) incrementally to keep note counts perfectly balanced
      while (remainingPayout > 0) {
        const candidates = denominations.filter(d => (leftoverNotes[d] || 0) > 0 && d <= remainingPayout);
        if (candidates.length === 0) break;

        // Sort candidates:
        // 1. Minimum note count in hand (to balance notes)
        // 2. Secondary: Larger denomination (to make progress and break ties)
        candidates.sort((a, b) => {
          const countA = notes[a] || 0;
          const countB = notes[b] || 0;
          if (countA !== countB) {
            return countA - countB;
          }
          return b - a; // larger denomination first
        });

        const bestDenom = candidates[0];
        notes[bestDenom] = (notes[bestDenom] || 0) + 1;
        remainingPayout -= bestDenom;
        if (!isUnlimited) {
          leftoverNotes[bestDenom] -= 1;
        }
      }
    } else {
      // Try to satisfy using largest available notes (Greedy mode)
      denominations.forEach(denom => {
        if (remainingPayout >= denom) {
          const maxNotesNeeded = Math.floor(remainingPayout / denom);
          const available = leftoverNotes[denom] || 0;
          const allocated = isUnlimited ? maxNotesNeeded : Math.min(maxNotesNeeded, available);

          if (allocated > 0) {
            notes[denom] = (notes[denom] || 0) + allocated;
            remainingPayout -= allocated * denom;
            if (!isUnlimited) {
              leftoverNotes[denom] -= allocated;
            }
          }
        }
      });
    }

    const allocatedAmount = f.amount - remainingPayout;
    let status: FunctionaryAllocation['status'] = 'unpaid';
    if (allocatedAmount === f.amount) {
      status = 'fully_paid';
    } else if (allocatedAmount > 0) {
      status = 'partially_paid';
    }

    allocations[f.id] = {
      functionaryId: f.id,
      allocatedAmount,
      notes,
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
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
  });

  return text;
}

/**
 * Get sample data for quick start
 */
export function getSampleFunctionaries(): Functionary[] {
  return [
    { id: '1', name: 'Arjun Sharma', amount: 12500 },
    { id: '2', name: 'Priya Patel', amount: 8400 },
    { id: '3', name: 'Rajesh Kumar', amount: 15000 },
    { id: '4', name: 'Ananya Rao', amount: 6200 },
    { id: '5', name: 'Vikram Singh', amount: 11000 },
    { id: '6', name: 'Sneha Reddy', amount: 9500 },
    { id: '7', name: 'Amit Verma', amount: 14300 },
    { id: '8', name: 'Kiran Nair', amount: 5500 },
    { id: '9', name: 'Deepa Joshi', amount: 10800 },
    { id: '10', name: 'Sanjay Gupta', amount: 13200 },
    { id: '11', name: 'Neha Das', amount: 7800 },
    { id: '12', name: 'Rohan Mehta', amount: 11500 },
    { id: '13', name: 'Kavitha Swamy', amount: 9000 },
    { id: '14', name: 'Manoj Pillai', amount: 12000 },
    { id: '15', name: 'Sunita Sen', amount: 6800 },
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
      2: 200,
      1: 500,
    };
  }
  if (code === 'USD') {
    return {
      100: 10,
      50: 20,
      20: 50,
      10: 100,
      5: 100,
      2: 50,
      1: 200,
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
    2: 100,
    1: 200,
  };
}
