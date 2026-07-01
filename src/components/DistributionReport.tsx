import React, { useState } from 'react';
import { Sliders, Clipboard, Printer, RefreshCw, AlertTriangle, CheckCircle2, Check, Download, ChevronDown, ChevronUp, Lock, Unlock, HelpCircle } from 'lucide-react';
import { Currency, DistributionSummary, Functionary, PayoutAllocation } from '../types';
import { formatCurrency, generateShareableSummary } from '../utils';

interface DistributionReportProps {
  selectedCurrency: Currency;
  functionaries: Functionary[];
  summary: DistributionSummary;
  isUnlimited: boolean;
  manualOverrides: Record<string, PayoutAllocation | null>;
  onUpdateOverride: (id: string, override: PayoutAllocation | null) => void;
  onClearOverrides: () => void;
  isEquivalentMode: boolean;
  ensureAllDenominations?: boolean;
}

export default function DistributionReport({
  selectedCurrency,
  functionaries,
  summary,
  isUnlimited,
  manualOverrides,
  onUpdateOverride,
  onClearOverrides,
  isEquivalentMode,
  ensureAllDenominations = true,
}: DistributionReportProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const denominations = selectedCurrency.denominations;

  const handleCopyText = () => {
    const text = generateShareableSummary(summary, functionaries, denominations, selectedCurrency.symbol, isUnlimited, isEquivalentMode, ensureAllDenominations);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `Functionary Name,No of Pensions,Target Payout,Allocated Payout,Status,${denominations.map(d => `${selectedCurrency.code} ${d}`).join(',')}\n`;

    functionaries.forEach(f => {
      const alloc = summary.allocations[f.id];
      if (!alloc) return;
      const rowNotes = denominations.map(d => alloc.notes[d] || 0).join(',');
      const statusText = alloc.status.toUpperCase().replace('_', ' ');
      csvContent += `"${f.name}",${f.pensions || 1},${f.amount},${alloc.allocatedAmount},"${statusText}",${rowNotes}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cash_Payout_Distribution_${selectedCurrency.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOverrideNoteChange = (fId: string, denom: number, val: string) => {
    const count = parseInt(val, 10);
    const cleanCount = isNaN(count) || count < 0 ? 0 : count;
    
    // Get current override or initialize a blank one
    const currentOverride = manualOverrides[fId] || { ...summary.allocations[fId]?.notes };
    const nextOverride = {
      ...currentOverride,
      [denom]: cleanCount,
    };
    
    onUpdateOverride(fId, nextOverride);
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const totalPayout = functionaries.reduce((sum, f) => sum + f.amount, 0);

  // Return background colors for different denominations for realistic bill rendering
  const getBillColor = (denom: number) => {
    if (selectedCurrency.code === 'INR') {
      if (denom === 500) return 'bg-stone-100 text-stone-800 border-stone-300 shadow-3xs dark:bg-stone-900 dark:text-stone-100 dark:border-stone-800';
      if (denom === 200) return 'bg-amber-100 text-amber-900 border-amber-300 shadow-3xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
      if (denom === 100) return 'bg-sky-100 text-sky-900 border-sky-300 shadow-3xs dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/50';
      if (denom === 50) return 'bg-cyan-100 text-cyan-900 border-cyan-300 shadow-3xs dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900/50';
      if (denom === 20) return 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-3xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
      if (denom === 10) return 'bg-rose-100 text-rose-900 border-rose-300 shadow-3xs dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50';
      return 'bg-slate-100 text-slate-800 border-slate-300 shadow-3xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
    if (selectedCurrency.code === 'USD') {
      if (denom === 100) return 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-3xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50';
      if (denom === 50) return 'bg-teal-100 text-teal-900 border-teal-300 shadow-3xs dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900/50';
      if (denom === 20) return 'bg-green-100 text-green-900 border-green-300 shadow-3xs dark:bg-green-950/40 dark:text-green-300 dark:border-green-900/50';
      if (denom === 10) return 'bg-amber-100 text-amber-900 border-amber-300 shadow-3xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
      if (denom === 5) return 'bg-rose-100 text-rose-900 border-rose-300 shadow-3xs dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50';
      return 'bg-slate-100 text-slate-800 border-slate-300 shadow-3xs dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
    return 'bg-amber-50/80 text-amber-950 border-amber-200 shadow-3xs dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50';
  };

  const hasAnyOverrides = Object.keys(manualOverrides).length > 0;

  return (
    <div className="space-y-6" id="distribution-report-container">
      {/* 1. Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-row">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 p-5 rounded-2xl border border-amber-100 shadow-3xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
          <span className="text-[10px] font-extrabold text-amber-700/80 uppercase tracking-widest block font-display dark:text-amber-450">
            Target Payout Total
          </span>
          <span className="text-2xl font-black text-amber-950 dark:text-white font-display mt-1 block">
            {formatCurrency(totalPayout, selectedCurrency.symbol)}
          </span>
          <span className="text-[10px] text-amber-600 dark:text-slate-400 font-bold mt-0.5 block font-sans">
            Requested by {functionaries.length} staff
          </span>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/40 p-5 rounded-2xl border border-rose-100 shadow-3xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
          <span className="text-[10px] font-extrabold text-rose-700/80 uppercase tracking-widest block font-display dark:text-rose-450">
            Allocated Cash
          </span>
          <span className="text-2xl font-black text-rose-950 dark:text-white font-display mt-1 block">
            {formatCurrency(summary.totalAllocated, selectedCurrency.symbol)}
          </span>
          <span className="text-[10px] text-rose-600 dark:text-slate-400 mt-0.5 font-bold block flex items-center gap-0.5 font-sans">
            <CheckCircle2 className="w-3 h-3 inline text-rose-500" />
            {totalPayout > 0 ? `${Math.round((summary.totalAllocated / totalPayout) * 100)}% Fulfilled` : '0%'}
          </span>
        </div>

        {!isUnlimited ? (
          <>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/40 p-5 rounded-2xl border border-orange-100 shadow-3xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-orange-700/80 uppercase tracking-widest block font-display dark:text-orange-450">
                Leftover in Drawer
              </span>
              <span className="text-2xl font-black text-orange-950 dark:text-white font-display mt-1 block">
                {formatCurrency(summary.unallocatedCash, selectedCurrency.symbol)}
              </span>
              <span className="text-[10px] text-orange-600 dark:text-slate-400 font-bold mt-0.5 block font-sans">
                Notes not distributed
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/40 p-5 rounded-2xl border border-amber-100 shadow-3xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-amber-700/80 uppercase tracking-widest block font-display dark:text-amber-450">
                Cash Shortfall
              </span>
              <span className={`text-2xl font-black font-display mt-1 block ${summary.unpaidPayout > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {formatCurrency(summary.unpaidPayout, selectedCurrency.symbol)}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-slate-400 font-bold mt-0.5 block font-sans">
                Unsatisfied payout total
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-br from-amber-50 to-rose-50/50 p-5 rounded-2xl border border-amber-100 shadow-3xs col-span-2 flex flex-col justify-center dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-rose-700/80 uppercase tracking-widest block font-display dark:text-rose-450">
                Perfect Change Mode
              </span>
              <span className="text-sm font-black text-rose-950 dark:text-white font-display mt-1 block">
                Unlimited Cash Reserves Enabled
              </span>
              <span className="text-[10px] text-rose-600 dark:text-slate-400 font-bold mt-0.5 block font-sans">
                No note shortages. Shows exact notes needed for withdrawal.
              </span>
            </div>
          </>
        )}
      </div>

      {/* 2. Mode-Specific Displays */}
      {isUnlimited && (
        <div className="bg-gradient-to-br from-amber-600 to-rose-500 text-white rounded-2xl p-6 shadow-md shadow-rose-100 dark:from-rose-950 dark:to-amber-950 dark:shadow-none dark:border dark:border-slate-800" id="bank-order-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-base font-display font-black tracking-tight">🏦 Bank Cash Withdrawal Checklist</h3>
              <p className="text-xs text-rose-50 mt-0.5 font-medium">
                Take this list to the teller to withdraw the exact coins & notes required.
              </p>
            </div>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-800 rounded-xl text-xs font-black transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-rose-300"
            >
              <Clipboard className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Copy Bank Order
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="bank-order-grid">
            {denominations.map(denom => {
              const notesNeeded = summary.notesNeededForPerfectPayout[denom] || 0;
              if (notesNeeded <= 0) return null;
              return (
                <div key={denom} className="bg-white/10 border border-white/20 rounded-xl p-3 flex flex-col justify-between backdrop-blur-xs dark:bg-slate-900/40 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-rose-100">
                    {selectedCurrency.symbol}
                    {denom} Notes
                  </span>
                  <span className="text-xl font-black font-mono text-white mt-1">
                    {notesNeeded} <span className="text-xs font-normal">bills</span>
                  </span>
                  <span className="text-[10px] text-rose-100 mt-0.5">
                    Value: {formatCurrency(notesNeeded * denom, selectedCurrency.symbol)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Detailed Distribution breakdown */}
      <div className="bg-gradient-to-br from-rose-50/60 to-amber-50/30 rounded-2xl p-6 border border-rose-100 shadow-3xs dark:from-slate-900 dark:to-slate-950 dark:border-slate-800" id="breakdown-details-card">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display font-extrabold text-rose-950 dark:text-white text-base tracking-tight">Staff Payout Breakdown</h2>
            <p className="text-[11px] text-rose-700 dark:text-slate-400 font-medium">
              Review and adjust notes assigned to each functionary using <b>{isEquivalentMode ? 'Equivalent Division' : 'Greedy Division'}</b>{ensureAllDenominations ? ' with ' : ''}<b>{ensureAllDenominations ? 'Variety Mode (All Denominations)' : ''}</b>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            {hasAnyOverrides && (
              <button
                onClick={onClearOverrides}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold border border-rose-200/50 transition-all cursor-pointer shadow-3xs dark:bg-rose-950/40 dark:hover:bg-rose-950/70 dark:text-rose-350 dark:border-rose-900/60"
                id="reset-overrides-btn"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Reset Adjustments
              </button>
            )}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-800 transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-250"
              id="copy-report-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="text-rose-600 dark:text-rose-400">Copied!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-rose-500 dark:text-rose-450" />
                  Copy Summary
                </>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-800 transition-all cursor-pointer shadow-3xs dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-250"
              id="export-csv-btn"
            >
              <Download className="w-3.5 h-3.5 text-rose-500 dark:text-rose-450" />
              CSV Export
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-3xs transition-all cursor-pointer dark:bg-rose-700 dark:hover:bg-rose-600"
              id="print-slips-btn"
            >
              <Printer className="w-3.5 h-3.5 text-rose-150" />
              Print Receipts
            </button>
          </div>
        </div>

        {/* Functionary Row List */}
        <div className="space-y-3" id="functionary-allocations-list">
          {functionaries.filter(f => f.amount > 0).map(f => {
            const alloc = summary.allocations[f.id];
            if (!alloc) return null;

            const isExpanded = expandedRow === f.id;
            const isOverridden = !!manualOverrides[f.id];
            
            // Generate bill tokens for fast preview
            const billTokens: React.ReactNode[] = [];
            denominations.forEach(denom => {
              const count = alloc.notes[denom] || 0;
              if (count > 0) {
                billTokens.push(
                  <div
                    key={denom}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black font-mono border ${getBillColor(denom)}`}
                  >
                    <span>{selectedCurrency.symbol}{denom}</span>
                    <span className="opacity-40 font-sans font-bold">×</span>
                    <span>{count}</span>
                  </div>
                );
              }
            });

            return (
              <div
                key={f.id}
                className={`border rounded-2xl transition-all ${
                  isExpanded
                    ? 'border-rose-200 bg-gradient-to-br from-rose-50/40 to-amber-50/20 shadow-2xs dark:border-rose-900/60 dark:from-slate-850 dark:to-slate-900/70'
                    : 'border-rose-100/60 bg-white/85 hover:bg-white/95 shadow-3xs dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900'
                }`}
                id={`alloc-card-${f.id}`}
              >
                {/* Collapsed view summary */}
                <div
                  onClick={() => toggleRowExpansion(f.id)}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {/* Status indicator */}
                    <div>
                      {alloc.status === 'fully_paid' ? (
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" title="Fully Paid" />
                      ) : alloc.status === 'partially_paid' ? (
                        <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" title="Partially Paid" />
                      ) : alloc.status === 'overpaid' ? (
                        <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" title="Overpaid" />
                      ) : (
                        <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" title="Unpaid" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-rose-950 dark:text-white flex items-center gap-1.5 font-display">
                        {f.name}
                        {isOverridden && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black bg-amber-150 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200 shadow-3xs dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60">
                            <Lock className="w-2.5 h-2.5 text-amber-750 dark:text-amber-400" /> Customized
                          </span>
                        )}
                      </h4>
                      <div className="text-[10px] text-rose-600/70 dark:text-slate-400 mt-0.5 flex gap-2 font-semibold">
                        <span>Pensions: <b className="text-rose-900 dark:text-rose-450 font-mono">{f.pensions || 1}</b></span>
                        <span>•</span>
                        <span>Target: <b className="text-rose-900 dark:text-rose-450 font-mono">{formatCurrency(f.amount, selectedCurrency.symbol)}</b></span>
                        <span>•</span>
                        <span>Paid: <b className={alloc.status === 'fully_paid' ? 'text-emerald-600 dark:text-emerald-450 font-mono font-bold' : 'text-rose-900 dark:text-rose-450 font-mono'}>{formatCurrency(alloc.allocatedAmount, selectedCurrency.symbol)}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Notes List Tokens */}
                  <div className="flex-1 md:max-w-md lg:max-w-xl flex flex-wrap gap-1.5 items-center md:justify-end">
                    {billTokens.length > 0 ? billTokens : <span className="text-[10px] text-rose-400 dark:text-rose-500 font-bold">No notes allocated</span>}
                  </div>

                  {/* Expand button */}
                  <div className="flex items-center gap-2 no-print">
                    <button className="text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50/50 transition-all px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 shadow-3xs cursor-pointer dark:bg-slate-850 dark:border-slate-700 dark:text-slate-300 dark:hover:text-slate-100">
                      {isExpanded ? 'Collapse' : 'Adjust'}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-rose-400 dark:text-rose-500" /> : <ChevronDown className="w-4 h-4 text-rose-400 dark:text-rose-500" />}
                  </div>
                </div>

                {/* Expanded adjustment form */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-3 border-t border-rose-100 bg-rose-50/20 rounded-b-2xl no-print dark:border-slate-800 dark:bg-slate-950/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-rose-500 dark:text-rose-405" />
                        <span className="text-xs font-extrabold text-rose-900 dark:text-white font-display">Denomination Tuning:</span>
                      </div>
                      <div className="text-xs font-bold text-rose-950 dark:text-slate-300">
                        <span className="text-rose-600/70 dark:text-slate-450 font-medium">Payout Status:</span>{' '}
                        {alloc.allocatedAmount === f.amount ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-50 dark:bg-emerald-950/45 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/55">
                            Perfect Match
                          </span>
                        ) : alloc.allocatedAmount > f.amount ? (
                          <span className="text-rose-700 dark:text-rose-300 font-extrabold bg-rose-50 dark:bg-rose-950/45 px-2.5 py-1 rounded-lg border border-rose-150 dark:border-rose-900/55">
                            Over-allocated (+{formatCurrency(alloc.allocatedAmount - f.amount, selectedCurrency.symbol)})
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300 font-extrabold bg-amber-50 dark:bg-amber-950/45 px-2.5 py-1 rounded-lg border border-amber-150 dark:border-amber-900/55">
                            Shortfall (-{formatCurrency(f.amount - alloc.allocatedAmount, selectedCurrency.symbol)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
                      {denominations.map(denom => {
                        const count = alloc.notes[denom] || 0;
                        return (
                          <div key={denom} className="bg-white p-2 rounded-xl border border-rose-100 flex flex-col items-center dark:bg-slate-900 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-rose-500/80 dark:text-rose-400/85 mb-1 font-mono">
                              {selectedCurrency.symbol}{denom}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={count || ''}
                              placeholder="0"
                              onChange={e => handleOverrideNoteChange(f.id, denom, e.target.value)}
                              className="w-full text-center px-1 py-1 text-xs font-mono font-black border border-rose-100 dark:border-slate-800 rounded-md focus:outline-none focus:border-rose-500 dark:focus:border-rose-700 bg-rose-50/20 dark:bg-slate-950 text-rose-950 dark:text-white"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-4 text-[10px] text-rose-600/80 dark:text-slate-400 border-t border-rose-100 dark:border-slate-800 pt-3 font-semibold">
                      <p>
                        💡 Adjust counts manually to customize the bills. 
                        This locks this user's allocation and auto-recalculates all other staff payouts using the remaining drawer.
                      </p>
                      {isOverridden && (
                        <button
                          onClick={() => onUpdateOverride(f.id, null)}
                          className="text-rose-600 dark:text-rose-400 font-bold hover:text-rose-800 dark:hover:text-rose-300 underline cursor-pointer"
                        >
                          Unlock & Reset to Auto
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Beautiful Printable Payout Slips (Hidden in normal screen, styled for print only) */}
      <div className="hidden print:block print-only mt-10 space-y-8" id="printable-slips-container">
        <h2 className="text-center font-display font-bold text-xl mb-6 pb-2 border-b-2 border-slate-800">
          Monthly Cash Payout Receipts
        </h2>
        
        {functionaries.filter(f => f.amount > 0).map((f, i) => {
          const alloc = summary.allocations[f.id];
          if (!alloc) return null;
          
          return (
            <div key={f.id} className="print-card border border-slate-300 p-6 rounded-xl space-y-4 max-w-2xl mx-auto">
              <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-3">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-800">CASH PAYOUT RECEIPT</h3>
                  <p className="text-[10px] text-slate-500">Slip #{i+1} • {new Date().toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Amount Paid</span>
                  <p className="text-lg font-bold font-mono text-slate-900">{formatCurrency(alloc.allocatedAmount, selectedCurrency.symbol)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Paid To (Functionary):</span>
                  <span className="font-bold text-slate-800 text-sm">{f.name}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">No of Pensions:</span>
                  <span className="font-bold text-slate-700 text-sm block">{f.pensions || 1}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase text-right">Target Share:</span>
                  <span className="font-mono text-slate-700 text-sm text-right block">{formatCurrency(f.amount, selectedCurrency.symbol)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase mb-1.5">Denomination Breakdown:</span>
                <div className="flex flex-wrap gap-2">
                  {denominations.map(denom => {
                    const count = alloc.notes[denom] || 0;
                    if (count <= 0) return null;
                    return (
                      <span key={denom} className="inline-block px-2.5 py-1 bg-white border border-slate-200 text-xs font-mono font-bold rounded">
                        {selectedCurrency.symbol}{denom} × {count} = {formatCurrency(count * denom, selectedCurrency.symbol)}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 pt-8 text-xs">
                <div className="border-t border-slate-300 pt-2 text-center text-slate-500">
                  Authorized Signatory
                </div>
                <div className="border-t border-slate-300 pt-2 text-center text-slate-500">
                  Receiver's Signature
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
