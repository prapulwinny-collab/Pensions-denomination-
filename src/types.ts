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
