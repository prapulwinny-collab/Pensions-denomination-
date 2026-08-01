import { useState, useEffect } from 'react';
import { Coins, ShieldCheck, Mail, Calendar, Sparkles, Sun, Moon, Archive, LayoutGrid, BarChart2 } from 'lucide-react';
import { Currency, DenominationStock, Functionary, PayoutAllocation } from './types';
import { calculateDistribution, getSampleFunctionaries, getSampleStock, formatDateDDMMYYYY } from './utils';

// Import our modular components
import CashDrawer from './components/CashDrawer';
import FunctionaryList from './components/FunctionaryList';
import DistributionReport from './components/DistributionReport';
import HistoryDashboard from './components/HistoryDashboard';

export default function App() {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'workspace' | 'history'>('workspace');

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) return stored === 'true';
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
      }
    } catch {
      // Ignore iframe storage access restrictions
    }
  }, [darkMode]);

  // Ask for confirmation before exiting the app
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required for compatibility with various browsers
      e.returnValue = 'Are you sure you want to exit the application?';
      return 'Are you sure you want to exit the application?';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Preset currencies
  const defaultCurrency = {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    denominations: [500, 200, 100, 50, 20, 10, 5],
  };

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_currency');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse currency from localStorage', e);
    }
    return defaultCurrency;
  });
  const isUnlimited = false;

  // Stock of denominations (persistent storage)
  const [stock, setStock] = useState<DenominationStock>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_stock');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse stock from localStorage', e);
    }
    return getSampleStock('INR');
  });

  // List of functionaries (persistent storage)
  const [functionaries, setFunctionaries] = useState<Functionary[]>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_functionaries');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse functionaries from localStorage', e);
    }
    return getSampleFunctionaries();
  });

  // Manual Note overrides for specific functionaries (persistent storage)
  const [manualOverrides, setManualOverrides] = useState<Record<string, PayoutAllocation | null>>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_manualOverrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse manualOverrides from localStorage', e);
    }
    return {};
  });

  const [isEquivalentMode, setIsEquivalentMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_isEquivalentMode');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.warn('Failed to parse isEquivalentMode from localStorage', e);
    }
    return true;
  });

  const [ensureAllDenominations, setEnsureAllDenominations] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_ensureAllDenominations');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.warn('Failed to parse ensureAllDenominations from localStorage', e);
    }
    return true;
  });

  // Persistent Memory Active Toggle State
  const [isPersistentMemoryActive, setIsPersistentMemoryActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_persistentMemoryActive');
      if (saved !== null) return saved === 'true';
    } catch (e) {
      console.warn('Failed to parse persistentMemoryActive from localStorage', e);
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('cash_dist_persistentMemoryActive', String(isPersistentMemoryActive));
    } catch (e) {
      console.error('Error saving persistentMemoryActive preference', e);
    }
  }, [isPersistentMemoryActive]);

  // Persistent storage auto-save effects (guarded by isPersistentMemoryActive)
  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_stock', JSON.stringify(stock));
    } catch (e) {
      console.error('Error saving stock to persistent memory', e);
    }
  }, [stock, isPersistentMemoryActive]);

  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_functionaries', JSON.stringify(functionaries));
    } catch (e) {
      console.error('Error saving functionaries to persistent memory', e);
    }
  }, [functionaries, isPersistentMemoryActive]);

  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_manualOverrides', JSON.stringify(manualOverrides));
    } catch (e) {
      console.error('Error saving manualOverrides to persistent memory', e);
    }
  }, [manualOverrides, isPersistentMemoryActive]);

  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_isEquivalentMode', String(isEquivalentMode));
    } catch (e) {
      console.error('Error saving isEquivalentMode to persistent memory', e);
    }
  }, [isEquivalentMode, isPersistentMemoryActive]);

  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_ensureAllDenominations', String(ensureAllDenominations));
    } catch (e) {
      console.error('Error saving ensureAllDenominations to persistent memory', e);
    }
  }, [ensureAllDenominations, isPersistentMemoryActive]);

  useEffect(() => {
    if (!isPersistentMemoryActive) return;
    try {
      localStorage.setItem('cash_dist_currency', JSON.stringify(selectedCurrency));
    } catch (e) {
      console.error('Error saving currency to persistent memory', e);
    }
  }, [selectedCurrency, isPersistentMemoryActive]);

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
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-sky-50/20 to-indigo-50/10 text-slate-900 font-sans pb-16 antialiased selection:bg-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 dark:text-slate-100 overflow-x-hidden w-full">
      {/* 1. Header & Navigation Rail (Hidden during printing) */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 no-print dark:bg-slate-900/80 dark:border-slate-800/80 w-full overflow-hidden transition-all shadow-xs" id="app-header">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 min-w-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200/50 dark:shadow-none shrink-0 ring-1 ring-black/5 dark:ring-white/10">
              <Coins className="w-5 h-5 text-white" id="header-logo-icon" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-slate-950 dark:text-white flex flex-wrap items-center gap-2">
                <span className="truncate">Cash Payout & Denominations</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200/60 flex items-center gap-1 font-sans dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800/80 shrink-0 shadow-3xs">
                  <Sparkles className="w-2.5 h-2.5 text-indigo-500" /> Core Engine v2
                </span>
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                Optimized cash allocations and custom note distribution for variable monthly functionaries.
              </p>
            </div>
          </div>

          {/* User metadata, navigation tabs & Dark Mode Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 w-full md:w-auto min-w-0">
            {/* Main Tabs */}
            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 w-full sm:w-auto min-w-0 shadow-inner" id="main-navigation-tabs">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs font-bold whitespace-nowrap ${
                  activeTab === 'workspace'
                    ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Current Allocation</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl transition-all cursor-pointer text-[11px] sm:text-xs font-bold whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-white text-emerald-950 shadow-sm border border-slate-200/60 dark:bg-slate-700 dark:text-white dark:border-slate-600'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>History & Analytics</span>
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-3xs text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="font-display font-bold text-slate-800 dark:text-slate-200">{formatDateDDMMYYYY()}</span>
              </div>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200/80 shadow-3xs rounded-xl transition-all cursor-pointer flex items-center justify-center dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-700/80 shrink-0"
                aria-label="Toggle theme"
                id="theme-toggle-btn"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Interactive Workspace Section OR History Dashboard Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8 min-w-0 max-w-full overflow-x-hidden" id="app-main-workspace">
        {activeTab === 'history' ? (
          <HistoryDashboard
            selectedCurrency={selectedCurrency}
            currentFunctionaries={functionaries}
            currentSummary={distributionSummary}
            isEquivalentMode={isEquivalentMode}
            ensureAllDenominations={ensureAllDenominations}
            onRestoreFunctionaries={(restored) => {
              setFunctionaries(restored);
              setActiveTab('workspace');
            }}
          />
        ) : (
          <>
            {/* Banner callout explaining persistent memory state */}

        <div 
          className={`border shadow-3xs rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print transition-colors ${
            isPersistentMemoryActive
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-100 dark:from-emerald-950/30 dark:to-teal-950/10 dark:border-emerald-900/50'
              : 'bg-gradient-to-br from-rose-50 to-slate-50 border-rose-200/80 dark:from-rose-950/20 dark:to-slate-900/60 dark:border-rose-900/50'
          }`} 
          id="sample-data-callout"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-3xs text-white transition-colors ${
              isPersistentMemoryActive ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className={`text-sm font-bold font-display flex items-center gap-2 flex-wrap ${
                isPersistentMemoryActive
                  ? 'text-emerald-850 dark:text-emerald-300'
                  : 'text-rose-850 dark:text-rose-300'
              }`}>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0" id="persistent-memory-glow-dot">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isPersistentMemoryActive ? 'bg-emerald-400' : 'bg-rose-400'
                    }`} />
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isPersistentMemoryActive
                        ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]'
                        : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                    }`} />
                  </span>
                  <span>{isPersistentMemoryActive ? 'Persistent Memory Active' : 'Persistent Memory Inactive'}</span>
                </span>

                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                  isPersistentMemoryActive
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                }`}>
                  {isPersistentMemoryActive ? 'Auto-Saved' : 'Disabled'}
                </span>
              </h4>
              <p className={`text-xs font-medium mt-0.5 ${
                isPersistentMemoryActive
                  ? 'text-emerald-650 dark:text-emerald-400/90'
                  : 'text-rose-650 dark:text-rose-400/90'
              }`}>
                {isPersistentMemoryActive
                  ? 'All staff details, payouts, denomination stocks, and strategy choices are continuously saved in local memory.'
                  : 'Local auto-saving is currently paused. Changes will not be saved to browser storage.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => setIsPersistentMemoryActive(!isPersistentMemoryActive)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-3xs flex items-center gap-1.5 ${
                isPersistentMemoryActive
                  ? 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-slate-800 dark:hover:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                  : 'bg-white hover:bg-rose-50 text-rose-800 border-rose-200 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
              }`}
              title="Toggle Persistent Memory State"
              id="toggle-persistent-memory-btn"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isPersistentMemoryActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{isPersistentMemoryActive ? 'Pause Memory' : 'Enable Memory'}</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear all staff members and zero out the cash drawer?')) {
                  setFunctionaries([]);
                  const emptyStock: DenominationStock = {};
                  selectedCurrency.denominations.forEach(d => { emptyStock[d] = 0; });
                  setStock(emptyStock);
                  setManualOverrides({});
                }
              }}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-3xs whitespace-nowrap dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700"
            >
              Clear Sheet & Start Fresh
            </button>
          </div>
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
          {/* Left Column - Cash Drawer Inventory (Span 4) */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <CashDrawer
              selectedCurrency={selectedCurrency}
              stock={stock}
              onUpdateStock={setStock}
            />
          </div>

          {/* Right Column - Functionary Management List (Span 8) */}
          <div className="lg:col-span-8 flex flex-col h-full">
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
      </>
    )}
  </main>
</div>
  );
}

