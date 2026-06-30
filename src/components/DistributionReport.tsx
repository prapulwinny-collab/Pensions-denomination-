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
    csvContent += `Functionary Name,Target Payout,Allocated Payout,Status,${denominations.map(d => `${selectedCurrency.code} ${d}`).join(',')}\n`;

    functionaries.forEach(f => {
      const alloc = summary.allocations[f.id];
      if (!alloc) return;
      const rowNotes = denominations.map(d => alloc.notes[d] || 0).join(',');
      const statusText = alloc.status.toUpperCase().replace('_', ' ');
      csvContent += `"${f.name}",${f.amount},${alloc.allocatedAmount},"${statusText}",${rowNotes}\n`;
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
      if (denom === 500) return 'bg-stone-100 text-stone-800 border-stone-200';
      if (denom === 200) return 'bg-orange-50 text-orange-800 border-orange-200';
      if (denom === 100) return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      if (denom === 50) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      if (denom === 20) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      if (denom === 10) return 'bg-amber-50 text-amber-800 border-amber-200';
      return 'bg-slate-100 text-slate-800 border-slate-200';
    }
    if (selectedCurrency.code === 'USD') {
      if (denom === 100) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      if (denom === 50) return 'bg-teal-50 text-teal-800 border-teal-200';
      return 'bg-green-50 text-green-800 border-green-200';
    }
    return 'bg-indigo-50/60 text-indigo-900 border-indigo-100';
  };

  const hasAnyOverrides = Object.keys(manualOverrides).length > 0;

  return (
    <div className="space-y-6" id="distribution-report-container">
      {/* 1. Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-row">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Target Payout Total
          </span>
          <span className="text-xl font-bold text-gray-900 font-display mt-1 block">
            {formatCurrency(totalPayout, selectedCurrency.symbol)}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            Requested by {functionaries.length} staff
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Allocated Cash
          </span>
          <span className="text-xl font-bold text-emerald-600 font-display mt-1 block">
            {formatCurrency(summary.totalAllocated, selectedCurrency.symbol)}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 font-medium block flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3 inline" />
            {totalPayout > 0 ? `${Math.round((summary.totalAllocated / totalPayout) * 100)}% Fulfilled` : '0%'}
          </span>
        </div>

        {!isUnlimited ? (
          <>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Leftover in Drawer
              </span>
              <span className="text-xl font-bold text-indigo-600 font-display mt-1 block">
                {formatCurrency(summary.unallocatedCash, selectedCurrency.symbol)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Notes not distributed
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Cash Shortfall
              </span>
              <span className={`text-xl font-bold font-display mt-1 block ${summary.unpaidPayout > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                {formatCurrency(summary.unpaidPayout, selectedCurrency.symbol)}
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">
                Unsatisfied payout total
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm col-span-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Perfect Change Mode
              </span>
              <span className="text-sm font-semibold text-indigo-700 font-display mt-1.5 block">
                Unlimited Cash Reserves Enabled
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5 block leading-tight">
                No note shortages. Shows exact notes needed for withdrawal.
              </span>
            </div>
          </>
        )}
      </div>

      {/* 2. Mode-Specific Displays */}
      {isUnlimited && (
        <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-md shadow-indigo-100" id="bank-order-panel">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-base font-display font-bold">🏦 Bank Cash Withdrawal Checklist</h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Take this list to the teller to withdraw the exact coins & notes required.
              </p>
            </div>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-semibold border border-indigo-400 transition-all cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Copy Bank Order
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" id="bank-order-grid">
            {denominations.map(denom => {
              const notesNeeded = summary.notesNeededForPerfectPayout[denom] || 0;
              if (notesNeeded <= 0) return null;
              return (
                <div key={denom} className="bg-indigo-700/50 border border-indigo-500/30 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-indigo-200">
                    {selectedCurrency.symbol}
                    {denom} Notes
                  </span>
                  <span className="text-xl font-bold font-mono text-white mt-1">
                    {notesNeeded} <span className="text-xs font-normal">bills</span>
                  </span>
                  <span className="text-[10px] text-indigo-200 mt-0.5">
                    Value: {formatCurrency(notesNeeded * denom, selectedCurrency.symbol)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Detailed Distribution breakdown */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm" id="breakdown-details-card">
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-lg">Staff Payout Breakdown</h2>
            <p className="text-xs text-gray-500">
              Review and adjust notes assigned to each functionary using <b>{isEquivalentMode ? 'Equivalent Division' : 'Greedy Division'}</b>{ensureAllDenominations ? ' with ' : ''}<b>{ensureAllDenominations ? 'Variety Mode (All Denominations)' : ''}</b>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap no-print">
            {hasAnyOverrides && (
              <button
                onClick={onClearOverrides}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold border border-rose-100 transition-all cursor-pointer"
                id="reset-overrides-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Adjustments
              </button>
            )}
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer"
              id="copy-report-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" />
                  Copy Summary
                </>
              )}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer"
              id="export-csv-btn"
            >
              <Download className="w-3.5 h-3.5" />
              CSV Export
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              id="print-slips-btn"
            >
              <Printer className="w-3.5 h-3.5" />
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
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${getBillColor(denom)}`}
                  >
                    <span>{selectedCurrency.symbol}{denom}</span>
                    <span className="opacity-50 font-sans">×</span>
                    <span>{count}</span>
                  </div>
                );
              }
            });

            return (
              <div
                key={f.id}
                className={`border rounded-xl transition-all ${
                  isExpanded
                    ? 'border-indigo-200 bg-indigo-50/10 shadow-xs'
                    : 'border-gray-200 bg-gray-50/40 hover:bg-gray-50/80'
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
                      <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                        {f.name}
                        {isOverridden && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-200">
                            <Lock className="w-2.5 h-2.5" /> Customized
                          </span>
                        )}
                      </h4>
                      <div className="text-[10px] text-gray-400 mt-0.5 flex gap-2">
                        <span>Target: <b>{formatCurrency(f.amount, selectedCurrency.symbol)}</b></span>
                        <span>•</span>
                        <span>Paid: <b className={alloc.status === 'fully_paid' ? 'text-emerald-600' : 'text-gray-600'}>{formatCurrency(alloc.allocatedAmount, selectedCurrency.symbol)}</b></span>
                      </div>
                    </div>
                  </div>

                  {/* Notes List Tokens */}
                  <div className="flex-1 md:max-w-md lg:max-w-xl flex flex-wrap gap-1.5 items-center md:justify-end">
                    {billTokens.length > 0 ? billTokens : <span className="text-[10px] text-gray-400 font-medium">No notes allocated</span>}
                  </div>

                  {/* Expand button */}
                  <div className="flex items-center gap-2 no-print">
                    <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-all px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 shadow-2xs cursor-pointer">
                      {isExpanded ? 'Collapse' : 'Adjust'}
                    </button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded adjustment form */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-3 border-t border-gray-200 bg-gray-50/70 rounded-b-xl no-print">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-xs font-bold text-gray-700">Denomination Tuning:</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Payout Status:</span>{' '}
                        {alloc.allocatedAmount === f.amount ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            Perfect Match
                          </span>
                        ) : alloc.allocatedAmount > f.amount ? (
                          <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                            Over-allocated (+{formatCurrency(alloc.allocatedAmount - f.amount, selectedCurrency.symbol)})
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                            Shortfall (-{formatCurrency(f.amount - alloc.allocatedAmount, selectedCurrency.symbol)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-2">
                      {denominations.map(denom => {
                        const count = alloc.notes[denom] || 0;
                        return (
                          <div key={denom} className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-500 mb-1">
                              {selectedCurrency.symbol}{denom}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={count || ''}
                              placeholder="0"
                              onChange={e => handleOverrideNoteChange(f.id, denom, e.target.value)}
                              className="w-full text-center px-1 py-1 text-xs font-mono font-bold border border-gray-200 rounded focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between mt-4 text-[10px] text-gray-500 border-t border-gray-200 pt-3">
                      <p>
                        💡 Adjust counts manually to customize the bills. 
                        This locks this user's allocation and auto-recalculates all other staff payouts using the remaining drawer.
                      </p>
                      {isOverridden && (
                        <button
                          onClick={() => onUpdateOverride(f.id, null)}
                          className="text-indigo-600 font-semibold hover:underline cursor-pointer"
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

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Paid To (Functionary):</span>
                  <span className="font-bold text-slate-800 text-sm">{f.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Target Share:</span>
                  <span className="font-mono text-slate-700">{formatCurrency(f.amount, selectedCurrency.symbol)}</span>
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
