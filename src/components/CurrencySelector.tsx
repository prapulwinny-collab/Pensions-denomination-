import React, { useState } from 'react';
import { Currency, PRESET_CURRENCIES } from '../types';
import { Globe, Settings } from 'lucide-react';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onSelectCurrency: (currency: Currency) => void;
  onUpdateCustomCurrency: (currency: Currency) => void;
}

export default function CurrencySelector({
  selectedCurrency,
  onSelectCurrency,
  onUpdateCustomCurrency,
}: CurrencySelectorProps) {
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('$');
  const [customCode, setCustomCode] = useState('XYZ');
  const [customName, setCustomName] = useState('Custom Currency');
  const [customDenomsStr, setCustomDenomsStr] = useState('100, 50, 20, 10, 5, 1');

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const denoms = customDenomsStr
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0)
      .sort((a, b) => b - a);

    if (denoms.length === 0) {
      alert('Please enter at least one valid denomination.');
      return;
    }

    const newCurrency: Currency = {
      code: customCode.toUpperCase(),
      symbol: customSymbol,
      name: customName,
      denominations: denoms,
    };

    onUpdateCustomCurrency(newCurrency);
    onSelectCurrency(newCurrency);
    setIsCustomMode(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm" id="currency-selector-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Globe className="w-5 h-5" id="globe-icon" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-lg">Currency Profile</h2>
            <p className="text-xs text-gray-500">Select currency and available coinages</p>
          </div>
        </div>
        <button
          onClick={() => setIsCustomMode(!isCustomMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isCustomMode
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
          id="toggle-custom-currency-btn"
        >
          <Settings className="w-3.5 h-3.5" />
          {isCustomMode ? 'View Presets' : 'Configure Custom'}
        </button>
      </div>

      {!isCustomMode ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="presets-grid">
          {PRESET_CURRENCIES.map(curr => {
            const isSelected = selectedCurrency.code === curr.code;
            return (
              <button
                key={curr.code}
                onClick={() => onSelectCurrency(curr)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 scale-[1.02]'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-100 text-gray-700'
                }`}
                id={`preset-btn-${curr.code}`}
              >
                <span className={`text-2xl font-bold font-display ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {curr.symbol}
                </span>
                <span className="text-xs font-semibold mt-1">{curr.code}</span>
                <span className={`text-[10px] mt-0.5 opacity-80 truncate max-w-full ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                  {curr.name}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <form onSubmit={handleApplyCustom} className="space-y-4" id="custom-currency-form">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={customSymbol}
                onChange={e => setCustomSymbol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                maxLength={3}
                required
                id="custom-symbol-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Code (e.g. INR)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={e => setCustomCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold uppercase focus:outline-none focus:border-indigo-500"
                maxLength={4}
                required
                id="custom-code-input"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
                required
                id="custom-name-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Denominations (comma-separated, descending)
            </label>
            <input
              type="text"
              value={customDenomsStr}
              onChange={e => setCustomDenomsStr(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:border-indigo-500"
              placeholder="100, 50, 20, 10, 5, 1"
              required
              id="custom-denoms-input"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Example: 1000, 500, 100, 50, 20, 10, 5, 1
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
            id="apply-custom-currency-btn"
          >
            Apply Custom Currency
          </button>
        </form>
      )}

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Active Denominations:</span>
        <span className="font-mono text-indigo-600 font-medium">
          {selectedCurrency.denominations.map(d => `${selectedCurrency.symbol}${d}`).join(', ')}
        </span>
      </div>
    </div>
  );
}
