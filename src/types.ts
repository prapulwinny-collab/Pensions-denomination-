export interface Currency {
  code: string;
  symbol: string;
  name: string;
  denominations: number[];
}

export interface Functionary {
  id: string;
  name: string;
  amount: number;
  pensions?: number;
  notes?: string;
}

export interface DenominationStock {
  [denom: number]: number;
}

export interface PayoutAllocation {
  [denom: number]: number;
}

export interface FunctionaryAllocation {
  functionaryId: string;
  allocatedAmount: number;
  notes: PayoutAllocation;
  status: 'fully_paid' | 'partially_paid' | 'overpaid' | 'unpaid';
}

export interface DistributionSummary {
  totalTargetPayout: number;
  totalCashAvailable: number;
  totalAllocated: number;
  unallocatedCash: number;
  unpaidPayout: number;
  allocations: { [functionaryId: string]: FunctionaryAllocation };
  leftoverNotes: DenominationStock;
  notesNeededForPerfectPayout: DenominationStock; // For withdrawal planning mode
}

export const PRESET_CURRENCIES: Currency[] = [
  {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    denominations: [500, 200, 100, 50, 20, 10, 5],
  },
];

export interface ArchivedFunctionaryAllocation {
  id: string;
  name: string;
  amount: number;
  pensionCount: number;
  notes: PayoutAllocation;
  status: 'fully_paid' | 'partially_paid' | 'overpaid' | 'unpaid';
}

export interface AllocationArchiveRecord {
  id: string; // e.g., "2026-07"
  monthYear: string; // e.g., "July 2026"
  timestamp: number;
  currencySymbol: string;
  totalDisbursed: number;
  totalTargetPayout: number;
  totalStaffCount: number;
  totalPensionsCount: number;
  strategyUsed: string; // "Equivalent Division" or "Greedy Division"
  denominationBreakdown: Record<number, number>; // total physical notes used per denomination
  functionaryAllocations: ArchivedFunctionaryAllocation[];
  memo?: string;
}

