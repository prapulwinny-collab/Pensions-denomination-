import React from 'react';
import { Currency } from '../types';
import { Coins, ShieldCheck } from 'lucide-react';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
}

export default function CurrencySelector({
  selectedCurrency,
}: CurrencySelectorProps) {
  return (
    <div className="bg-gradient-to-br from-sky-50/90 to-blue-50/40 rounded-2xl p-6 border border-sky-100 shadow-xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800" id="currency-selector-card">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-sky-100 text-sky-700 rounded-xl shadow-3xs dark:bg-sky-950/40 dark:text-sky-400 dark:border dark:border-sky-900/40">
          <Coins className="w-5 h-5 text-sky-600 dark:text-sky-400" id="globe-icon" />
        </div>
        <div>
          <h2 className="font-display font-bold text-sky-950 dark:text-sky-100 text-base tracking-tight">Currency Profile</h2>
          <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">System configured for Indian Rupee</p>
        </div>
      </div>

      <div className="mt-4 p-4 bg-white/80 backdrop-blur-xs rounded-xl border border-sky-100/60 flex items-center justify-between shadow-3xs dark:bg-slate-800/80 dark:border-slate-700/60" id="active-currency-display">
        <div>
          <span className="text-2xl font-black font-display text-sky-950 dark:text-sky-100 mr-2">
            {selectedCurrency.symbol}
          </span>
          <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200 uppercase tracking-wider font-mono dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900/60">
            {selectedCurrency.code}
          </span>
          <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-1.5 font-semibold font-display">{selectedCurrency.name}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100 shadow-3xs dark:text-teal-300 dark:bg-teal-950/40 dark:border-teal-900/50">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Active Profile</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-sky-100/50 dark:border-slate-800">
        <span className="text-[10px] font-extrabold text-sky-800/60 dark:text-sky-400/65 uppercase tracking-widest block mb-2 font-display">
          Available Denominations (Bills & Coins)
        </span>
        <div className="flex flex-wrap gap-1.5" id="denoms-badge-container">
          {selectedCurrency.denominations.map(d => (
            <span
              key={d}
              className="text-xs font-mono font-bold px-2.5 py-1.5 bg-white hover:bg-sky-50 border border-sky-100 rounded-lg text-sky-900 shadow-3xs hover:border-sky-300 transition-all dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-250"
            >
              ₹{d}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

