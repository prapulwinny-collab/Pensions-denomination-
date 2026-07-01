import { useState, useEffect } from 'react';
import { Coins, ShieldCheck, Mail, Calendar, Sparkles, Sun, Moon } from 'lucide-react';
import { Currency, DenominationStock, Functionary, PayoutAllocation } from './types';
import { calculateDistribution, getSampleFunctionaries, getSampleStock, formatDateDDMMYYYY } from './utils';

// Import our modular components
import CurrencySelector from './components/CurrencySelector';
import CashDrawer from './components/CashDrawer';
import FunctionaryList from './components/FunctionaryList';
import DistributionReport from './components/DistributionReport';

export default function App() {
  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('darkMode') === 'true' || 
      (!('darkMode' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // Preset currencies
  const defaultCurrency = {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    denominations: [500, 200, 100, 50, 20, 10, 5],
  };

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const [isUnlimited, setIsUnlimited] = useState<boolean>(true); // Default to bank withdrawal planning

  // Stock of denominations
  const [stock, setStock] = useState<DenominationStock>(() => {
    return getSampleStock('INR');
  });

  // List of functionaries
  const [functionaries, setFunctionaries] = useState<Functionary[]>(() => {
    return getSampleFunctionaries();
  });

  // Manual Note overrides for specific functionaries
  const [manualOverrides, setManualOverrides] = useState<Record<string, PayoutAllocation | null>>({});
  const [isEquivalentMode, setIsEquivalentMode] = useState<boolean>(false);
  const [ensureAllDenominations, setEnsureAllDenominations] = useState<boolean>(true);

  // Reset overrides when changing currency, mode, or strategy to prevent state issues
  useEffect(() => {
    setManualOverrides({});
  }, [selectedCurrency, isUnlimited, isEquivalentMode, ensureAllDenominations]);

  const handleUpdateOverride = (fId: string, override: PayoutAllocation | null) => {
    setManualOverrides(prev => ({
      ...prev,
      [fId]: override,
    }));
  };

  const handleClearOverrides = () => {
    setManualOverrides({});
  };

  // Live calculation of distribution
  const distributionSummary = calculateDistribution(
    functionaries,
    selectedCurrency.denominations,
    stock,
    isUnlimited,
    manualOverrides,
    isEquivalentMode,
    ensureAllDenominations
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-indigo-50/10 text-slate-900 font-sans pb-16 antialiased selection:bg-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 dark:text-slate-100">
      {/* 1. Header & Navigation Rail (Hidden during printing) */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-20 no-print dark:bg-slate-900/80 dark:border-slate-800" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100 dark:shadow-none">
              <Coins className="w-5 h-5 text-white" id="header-logo-icon" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
                Cash Payout & Denominations
                <span className="text-[10px] bg-indigo-100/70 text-indigo-800 font-black px-2.5 py-0.5 rounded-full border border-indigo-200/50 flex items-center gap-0.5 font-sans dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900/60">
                  <Sparkles className="w-2.5 h-2.5" /> Core Engine v2
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Optimized cash allocations and custom note distribution for variable monthly functionaries.
              </p>
            </div>
          </div>

          {/* User metadata & date status & Dark Mode Toggle */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-3xs dark:bg-slate-800/80 dark:border-slate-700/60 dark:text-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="font-display">{formatDateDDMMYYYY()}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-indigo-50/75 text-indigo-800 px-3 py-1.5 rounded-lg border border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-[11px] font-mono">prapulwinny@gmail.com</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60 shadow-3xs rounded-lg transition-all cursor-pointer flex items-center justify-center dark:bg-slate-800/80 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/60"
              aria-label="Toggle theme"
              id="theme-toggle-btn"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Interactive Workspace Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="app-main-workspace">
        
        {/* Banner callout explaining sample state */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 shadow-3xs rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print dark:from-emerald-950/30 dark:to-teal-950/10 dark:border-emerald-900/50" id="sample-data-callout">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-3xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-850 dark:text-emerald-300 font-display">Preloaded Monthly Simulation</h4>
              <p className="text-xs text-emerald-650 dark:text-emerald-400/90 font-medium mt-0.5">
                We've auto-loaded 15 default functionaries and cash reserves. Edit names, target payouts, and counts to recalculate.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Reset to blank state
              setFunctionaries([]);
              const emptyStock: DenominationStock = {};
              selectedCurrency.denominations.forEach(d => { emptyStock[d] = 0; });
              setStock(emptyStock);
              setManualOverrides({});
            }}
            className="px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-3xs whitespace-nowrap dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60"
          >
            Clear Sheet & Start Fresh
          </button>
        </div>

        {/* Division Strategy Controls */}
        <div className="bg-gradient-to-br from-indigo-50/80 to-sky-50/40 rounded-2xl p-5 border border-indigo-100 shadow-3xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print dark:from-indigo-950/20 dark:to-slate-900/40 dark:border-indigo-900/40" id="strategy-controls">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl shadow-3xs dark:bg-indigo-950 dark:text-indigo-300 dark:border dark:border-indigo-900/60">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-indigo-950 dark:text-indigo-100 text-sm">Denomination Division Strategy</h3>
              <p className="text-xs text-indigo-600/80 dark:text-slate-400 font-medium">Configure how paper bills and coins are distributed to each staff member.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-900 bg-white hover:bg-indigo-50/45 px-3.5 py-2.5 rounded-xl border border-indigo-100/80 transition-all select-none shadow-3xs dark:text-indigo-200 dark:bg-slate-800 dark:border-slate-700">
              <input
                type="checkbox"
                checked={ensureAllDenominations}
                onChange={(e) => setEnsureAllDenominations(e.target.checked)}
                className="w-4 h-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer dark:border-slate-600"
              />
              <span>Ensure Variety (All Denominations)</span>
            </label>

            <div className="flex bg-indigo-100/50 p-1 rounded-xl self-start md:self-auto dark:bg-slate-800" id="strategy-mode-selector">
              <button
                onClick={() => setIsEquivalentMode(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isEquivalentMode
                    ? 'bg-white text-indigo-850 shadow-3xs border border-indigo-100/50 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                    : 'text-indigo-750 hover:text-indigo-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                id="strategy-greedy-btn"
              >
                Greedy (Fewer Notes)
              </button>
              <button
                onClick={() => setIsEquivalentMode(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isEquivalentMode
                    ? 'bg-white text-indigo-850 shadow-3xs border border-indigo-100/50 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                    : 'text-indigo-750 hover:text-indigo-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                id="strategy-equivalent-btn"
              >
                Equivalent (Balanced Mix)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
          {/* Left Column - Currency Selector & Cash Drawer (Span 5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
            />
            <div className="flex-1">
              <CashDrawer
                selectedCurrency={selectedCurrency}
                isUnlimited={isUnlimited}
                onToggleUnlimited={setIsUnlimited}
                stock={stock}
                onUpdateStock={setStock}
              />
            </div>
          </div>

          {/* Right Column - Functionary Management List (Span 7) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <FunctionaryList
              selectedCurrency={selectedCurrency}
              functionaries={functionaries}
              onUpdateFunctionaries={setFunctionaries}
            />
          </div>
        </div>

        {/* 3. Output Calculations & Reports Section */}
        {functionaries.filter(f => f.amount > 0).length > 0 ? (
          <DistributionReport
            selectedCurrency={selectedCurrency}
            functionaries={functionaries}
            summary={distributionSummary}
            isUnlimited={isUnlimited}
            manualOverrides={manualOverrides}
            onUpdateOverride={handleUpdateOverride}
            onClearOverrides={handleClearOverrides}
            isEquivalentMode={isEquivalentMode}
            ensureAllDenominations={ensureAllDenominations}
          />
        ) : (
          <div className="bg-slate-100/50 rounded-2xl p-12 text-center border border-dashed border-slate-300 no-print dark:bg-slate-900/40 dark:border-slate-800/80" id="report-placeholder">
            <Coins className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="font-display font-bold text-slate-600 dark:text-slate-400 text-sm mb-1">
              Allocation Report Pending
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
              Please enter target payout amounts of at least one functionary to generate the denomination breakdown slips.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
