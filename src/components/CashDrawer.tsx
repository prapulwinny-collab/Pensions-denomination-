import { Banknote, Sliders } from 'lucide-react';
import { Currency, DenominationStock } from '../types';
import { formatCurrency } from '../utils';

interface CashDrawerProps {
  selectedCurrency: Currency;
  stock: DenominationStock;
  onUpdateStock: (stock: DenominationStock) => void;
}

export default function CashDrawer({
  selectedCurrency,
  stock,
  onUpdateStock,
}: CashDrawerProps) {
  const denominations = selectedCurrency.denominations;

  const handleCountChange = (denom: number, value: string) => {
    const count = parseInt(value, 10);
    onUpdateStock({
      ...stock,
      [denom]: isNaN(count) || count < 0 ? 0 : count,
    });
  };

  const adjustCount = (denom: number, delta: number) => {
    const current = stock[denom] || 0;
    const next = Math.max(0, current + delta);
    onUpdateStock({
      ...stock,
      [denom]: next,
    });
  };

  const handleClearAll = () => {
    const cleared: DenominationStock = {};
    denominations.forEach(d => {
      cleared[d] = 0;
    });
    onUpdateStock(cleared);
  };

  const totalValue = denominations.reduce((sum, d) => sum + (stock[d] || 0) * d, 0);

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col h-full min-w-0 max-w-full overflow-hidden transition-all" id="cash-drawer-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900/50 shrink-0">
            <Banknote className="w-5 h-5" id="banknote-icon" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-slate-900 dark:text-white text-base tracking-tight">Cash Vault Inventory</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Starting physical notes & coins count</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full" id="limited-drawer-container">
        {/* Action bar */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>Vault Denominations</span>
          </span>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100/80 rounded-lg border border-rose-200/60 transition-all cursor-pointer dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60"
            id="clear-cash-btn"
          >
            Zero Out Vault
          </button>
        </div>

        {/* Denominations List */}
        <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1 flex-1 mb-4 custom-scrollbar" id="denom-list">
          {denominations.map(denom => {
            const count = stock[denom] || 0;
            const value = count * denom;
            return (
              <div
                key={denom}
                className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-white hover:border-slate-300 dark:bg-slate-800/40 dark:border-slate-700/60 dark:hover:bg-slate-800/80 shadow-3xs"
                id={`denom-card-${denom}`}
              >
                {/* Left Section: Denomination Pill & Value */}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-10 bg-indigo-600 text-white border border-indigo-700 rounded-xl flex items-center justify-center text-xs font-extrabold font-mono shadow-3xs shrink-0 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800">
                    {selectedCurrency.symbol}{denom}
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Subtotal
                    </div>
                    <div className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {formatCurrency(value, selectedCurrency.symbol)}
                    </div>
                  </div>
                </div>

                {/* Right Section: Stepper & Quick Adjustment Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* Quick Add / Subtract Pills */}
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => adjustCount(denom, 100)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-300 dark:border-slate-700 text-center whitespace-nowrap min-w-[38px]"
                      title="Add 100 notes"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => adjustCount(denom, 1000)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-indigo-300 dark:border-slate-700 text-center whitespace-nowrap min-w-[42px]"
                      title="Add 1000 notes"
                    >
                      +1000
                    </button>
                    <button
                      onClick={() => adjustCount(denom, -100)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-rose-950/30 dark:text-rose-400 dark:border-slate-700 text-center whitespace-nowrap min-w-[38px]"
                      title="Subtract 100 notes"
                    >
                      -100
                    </button>
                    <button
                      onClick={() => adjustCount(denom, -1000)}
                      className="px-2 py-0.5 text-[9px] font-bold bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-rose-950/30 dark:text-rose-400 dark:border-slate-700 text-center whitespace-nowrap min-w-[42px]"
                      title="Subtract 1000 notes"
                    >
                      -1000
                    </button>
                  </div>

                  {/* Simple Stepper Input Group */}
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-3xs p-0.5 dark:bg-slate-900 dark:border-slate-700">
                    <button
                      onClick={() => adjustCount(denom, -1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer select-none text-xs"
                      aria-label={`Decrease ${denom} count`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      placeholder="0"
                      onChange={e => handleCountChange(denom, e.target.value)}
                      className="w-12 text-center py-0.5 text-xs font-mono font-black text-slate-900 dark:text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => adjustCount(denom, 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-black hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer select-none text-xs"
                      aria-label={`Increase ${denom} count`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer summary total */}
        <div className="pt-3.5 pb-1 border-t border-slate-200 dark:border-slate-800 mt-auto">
          <div className="flex items-center justify-between bg-indigo-50/80 dark:bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Total Available Vault Cash:</span>
            <span className="text-lg font-black font-display text-indigo-700 dark:text-indigo-300">
              {formatCurrency(totalValue, selectedCurrency.symbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
