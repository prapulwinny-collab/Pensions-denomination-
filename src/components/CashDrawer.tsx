import { Banknote, Sliders, RefreshCw } from 'lucide-react';
import { Currency, DenominationStock } from '../types';
import { formatCurrency, getSampleStock } from '../utils';

interface CashDrawerProps {
  selectedCurrency: Currency;
  isUnlimited: boolean;
  onToggleUnlimited: (val: boolean) => void;
  stock: DenominationStock;
  onUpdateStock: (stock: DenominationStock) => void;
}

export default function CashDrawer({
  selectedCurrency,
  isUnlimited,
  onToggleUnlimited,
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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col h-full" id="cash-drawer-card">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Banknote className="w-5 h-5" id="banknote-icon" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-lg">Cash Inventory</h2>
            <p className="text-xs text-gray-500">Configure your starting cash vault</p>
          </div>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="bg-gray-100 p-1 rounded-xl grid grid-cols-2 gap-1 mb-5" id="mode-selector-grid">
        <button
          onClick={() => onToggleUnlimited(true)}
          className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            isUnlimited
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          id="mode-withdrawal-btn"
        >
          🏦 Withdrawal Planner
        </button>
        <button
          onClick={() => onToggleUnlimited(false)}
          className={`py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            !isUnlimited
              ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          id="mode-distribution-btn"
        >
          💼 Drawer Distribution
        </button>
      </div>

      {isUnlimited ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200" id="unlimited-info-box">
          <Sliders className="w-10 h-10 text-indigo-500/70 mb-3" />
          <h3 className="font-display font-semibold text-gray-700 text-sm mb-1">
            Unlimited Bank Reserves
          </h3>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            The planner assumes you can get any combination of notes. 
            It will calculate the optimal counts of each bill to request at the bank 
            to fulfill everyone's exact payouts.
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full" id="limited-drawer-container">
          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs font-medium text-gray-500">Physical Stock Count:</span>
            <div className="flex gap-2">
              <button
                onClick={handleLoadSample}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-all cursor-pointer"
                id="load-sample-cash-btn"
              >
                <RefreshCw className="w-3 h-3" />
                Fill Sample Cash
              </button>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 text-[10px] font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200 transition-all cursor-pointer"
                id="clear-cash-btn"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Denominations Grid */}
          <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[380px] pr-1 flex-1 mb-4" id="denom-grid">
            {denominations.map(denom => {
              const count = stock[denom] || 0;
              const value = count * denom;
              return (
                <div
                  key={denom}
                  className="bg-gray-50/70 p-3 rounded-xl border border-gray-100 flex flex-col justify-between"
                  id={`denom-card-${denom}`}
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-xs font-bold font-mono text-gray-900">
                      {selectedCurrency.symbol}
                      {denom}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded">
                      {formatCurrency(value, selectedCurrency.symbol)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => adjustCount(denom, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200 rounded text-xs transition-all cursor-pointer select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count || ''}
                      placeholder="0"
                      onChange={e => handleCountChange(denom, e.target.value)}
                      className="w-full text-center px-1 py-1 text-xs font-mono font-bold bg-white border border-gray-200 rounded focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={() => adjustCount(denom, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 font-bold border border-gray-200 rounded text-xs transition-all cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Multipliers */}
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <button
                      onClick={() => adjustCount(denom, 10)}
                      className="py-0.5 text-[9px] font-bold bg-white text-gray-500 hover:text-gray-800 border border-gray-200 rounded transition-all cursor-pointer"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => adjustCount(denom, 50)}
                      className="py-0.5 text-[9px] font-bold bg-white text-gray-500 hover:text-gray-800 border border-gray-200 rounded transition-all cursor-pointer"
                    >
                      +50
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer summary total */}
          <div className="pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">Total Vault Cash:</span>
              <span className="text-lg font-bold font-display text-indigo-600">
                {formatCurrency(totalValue, selectedCurrency.symbol)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
