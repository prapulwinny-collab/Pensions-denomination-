import { Banknote, Sliders, RefreshCw } from 'lucide-react';
import { Currency, DenominationStock } from '../types';
import { formatCurrency, getSampleStock } from '../utils';

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

  const handleLoadSample = () => {
    const sample = getSampleStock(selectedCurrency.code);
    const updated: DenominationStock = {};
    denominations.forEach(d => {
      updated[d] = sample[d] || 0;
    });
    onUpdateStock(updated);
  };

  const totalValue = denominations.reduce((sum, d) => sum + (stock[d] || 0) * d, 0);

  return (
    <div className="bg-gradient-to-br from-violet-50/90 to-purple-50/40 rounded-2xl p-6 border border-violet-100 shadow-xs flex flex-col h-full dark:from-slate-900 dark:to-slate-950 dark:border-slate-800" id="cash-drawer-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-100 text-violet-700 rounded-xl shadow-3xs dark:bg-violet-950/40 dark:text-violet-400 dark:border dark:border-violet-900/40">
            <Banknote className="w-5 h-5 text-violet-600 dark:text-violet-400" id="banknote-icon" />
          </div>
          <div>
            <h2 className="font-display font-bold text-violet-950 dark:text-violet-100 text-base tracking-tight">Cash Inventory</h2>
            <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">Configure your starting cash vault</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full" id="limited-drawer-container">
        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <span className="text-xs font-semibold text-violet-800 dark:text-violet-300">Physical Stock Count:</span>
          <div className="flex gap-1.5">
            <button
              onClick={handleLoadSample}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 rounded-lg border border-emerald-200/50 transition-all cursor-pointer shadow-3xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60"
              id="load-sample-cash-btn"
            >
              <RefreshCw className="w-3 h-3" />
              Fill Sample
            </button>
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-100/80 text-rose-800 hover:bg-rose-200 hover:text-rose-900 rounded-lg border border-rose-200/50 transition-all cursor-pointer shadow-3xs dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60"
              id="clear-cash-btn"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Denominations List */}
        <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1 flex-1 mb-4" id="denom-list">
          {denominations.map(denom => {
            const count = stock[denom] || 0;
            const value = count * denom;
            return (
              <div
                key={denom}
                className="bg-white/80 p-3 rounded-xl border border-violet-100 flex items-center justify-between gap-3 transition-all hover:bg-white shadow-3xs dark:bg-slate-800/80 dark:border-slate-700/50 dark:hover:bg-slate-800"
                id={`denom-card-${denom}`}
              >
                {/* Left Section: Denomination & Value */}
                <div className="flex items-center gap-3">
                  <div className="w-14 h-11 bg-violet-100/80 hover:bg-violet-100 text-violet-800 border border-violet-200/60 rounded-lg flex items-center justify-center text-xs font-black font-mono transition-colors dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900/60">
                    {selectedCurrency.symbol}{denom}
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-violet-450 dark:text-violet-500 uppercase tracking-widest font-display">
                      Total Value
                    </div>
                    <div className="text-xs font-black text-violet-950 dark:text-white font-mono">
                      {formatCurrency(value, selectedCurrency.symbol)}
                    </div>
                  </div>
                </div>

                {/* Right Section: Tactile inputs & quick increments */}
                <div className="flex items-center gap-2">
                  {/* Quick Add Pills */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => adjustCount(denom, 100)}
                      className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-violet-50 text-violet-700 border border-violet-100 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 dark:border-slate-700"
                    >
                      +100
                    </button>
                    <button
                      onClick={() => adjustCount(denom, 1000)}
                      className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-violet-50 text-violet-700 border border-violet-100 rounded-lg transition-all cursor-pointer shadow-3xs dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-350 dark:border-slate-700"
                    >
                      +1000
                    </button>
                  </div>

                  {/* Simple Counter Group */}
                  <div className="flex items-center bg-white rounded-lg border border-violet-100 shadow-3xs p-0.5 dark:bg-slate-900 dark:border-slate-700">
                    <button
                      onClick={() => adjustCount(denom, -1)}
                      className="w-7 h-7 flex items-center justify-center text-violet-400 hover:text-violet-900 dark:text-slate-500 dark:hover:text-slate-200 font-extrabold hover:bg-violet-50 rounded-md transition-colors cursor-pointer select-none text-xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      placeholder="0"
                      onChange={e => handleCountChange(denom, e.target.value)}
                      className="w-10 text-center py-0.5 text-xs font-mono font-black text-violet-950 dark:text-white bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => adjustCount(denom, 1)}
                      className="w-7 h-7 flex items-center justify-center text-violet-400 hover:text-violet-900 dark:text-slate-500 dark:hover:text-slate-200 font-extrabold hover:bg-violet-50 rounded-md transition-colors cursor-pointer select-none text-xs"
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
        <div className="pt-4 border-t border-violet-100 bg-violet-100/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-2xl mt-auto dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-800 dark:text-slate-350">Total Vault Cash:</span>
            <span className="text-lg font-black font-display text-violet-700 dark:text-violet-400">
              {formatCurrency(totalValue, selectedCurrency.symbol)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
