import { useState, useEffect } from 'react';
import { Coins, ShieldCheck, Mail, Calendar, Sparkles } from 'lucide-react';
import { Currency, DenominationStock, Functionary, PayoutAllocation } from './types';
import { calculateDistribution, getSampleFunctionaries, getSampleStock } from './utils';

// Import our modular components
import CurrencySelector from './components/CurrencySelector';
import CashDrawer from './components/CashDrawer';
import FunctionaryList from './components/FunctionaryList';
import DistributionReport from './components/DistributionReport';

export default function App() {
  // Preset currencies
  const defaultCurrency = {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    denominations: [500, 200, 100, 50, 20, 10, 5, 2, 1],
  };

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(defaultCurrency);
  const [customCurrency, setCustomCurrency] = useState<Currency | null>(null);
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

  // Reset overrides when changing currency, mode, or strategy to prevent state issues
  useEffect(() => {
    setManualOverrides({});
  }, [selectedCurrency, isUnlimited, isEquivalentMode]);

  // Adjust stock when selected currency changes to match typical stock patterns
  const handleSelectCurrency = (curr: Currency) => {
    setSelectedCurrency(curr);
    setStock(getSampleStock(curr.code));
  };

  const handleUpdateCustomCurrency = (curr: Currency) => {
    setCustomCurrency(curr);
  };

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
    isEquivalentMode
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-16 antialiased selection:bg-indigo-100">
      {/* 1. Header & Navigation Rail (Hidden during printing) */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 no-print" id="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <Coins className="w-5 h-5" id="header-logo-icon" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
                Cash Payout & Denominations
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Core Engine v2
                </span>
              </h1>
              <p className="text-xs text-gray-500">
                Optimized cash allocations and custom note distribution for variable monthly functionaries.
              </p>
            </div>
          </div>

          {/* User metadata & date status */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-indigo-50/50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-50/50">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-semibold text-[11px]">prapulwinny@gmail.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Interactive Workspace Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="app-main-workspace">
        
        {/* Banner callout explaining sample state */}
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print" id="sample-data-callout">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-800">Preloaded Monthly Simulation</h4>
              <p className="text-xs text-emerald-600">
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
            className="px-3.5 py-1.5 bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-xs whitespace-nowrap"
          >
            Clear Sheet & Start Fresh
          </button>
        </div>

        {/* Division Strategy Controls */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print" id="strategy-controls">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-gray-900 text-sm">Denomination Division Strategy</h3>
              <p className="text-xs text-gray-500">Configure how paper bills and coins are distributed to each staff member.</p>
            </div>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl self-start md:self-auto" id="strategy-mode-selector">
            <button
              onClick={() => setIsEquivalentMode(false)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isEquivalentMode
                  ? 'bg-white text-indigo-700 shadow-xs border border-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              id="strategy-greedy-btn"
            >
              Greedy (Fewer Notes)
            </button>
            <button
              onClick={() => setIsEquivalentMode(true)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isEquivalentMode
                  ? 'bg-white text-indigo-700 shadow-xs border border-gray-100'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              id="strategy-equivalent-btn"
            >
              Equivalent (Balanced Mix)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
          {/* Left Column - Currency Selector & Cash Drawer (Span 5) */}
          <div className="lg:col-span-5 space-y-6 flex flex-col h-full">
            <CurrencySelector
              selectedCurrency={selectedCurrency}
              onSelectCurrency={handleSelectCurrency}
              onUpdateCustomCurrency={handleUpdateCustomCurrency}
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
          />
        ) : (
          <div className="bg-gray-100/50 rounded-xl p-12 text-center border border-dashed border-gray-200 no-print" id="report-placeholder">
            <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-display font-semibold text-gray-600 text-sm mb-1">
              Allocation Report Pending
            </h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Please enter target payout amounts of at least one functionary to generate the denomination breakdown slips.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
