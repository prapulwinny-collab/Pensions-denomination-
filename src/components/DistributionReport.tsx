import React, { useState } from 'react';
import { Sliders, Clipboard, Printer, RefreshCw, AlertTriangle, CheckCircle2, Check, Download, ChevronDown, ChevronUp, Lock, Unlock, HelpCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Currency, DistributionSummary, Functionary, PayoutAllocation } from '../types';
import { formatCurrency, generateShareableSummary, formatDateDDMMYYYY } from '../utils';

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState('');

  const denominations = selectedCurrency.denominations;

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true);
      setPdfProgress('Generating...');

      const pdfSym = selectedCurrency.symbol === '₹' ? 'Rs.' : (selectedCurrency.symbol.charCodeAt(0) > 127 ? selectedCurrency.code + ' ' : selectedCurrency.symbol);
      const formatPdfCurrency = (amt: number) => {
        return formatCurrency(amt, selectedCurrency.symbol).replace(selectedCurrency.symbol, pdfSym);
      };

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      let pageNum = 1;
      let currY = 20;

      // Header Helper for Schedule
      const drawScheduleHeader = (pageNum: number) => {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('DETAILED STAFF PAYOUT SCHEDULE', 15, currY);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Report Generated: ${formatDateDDMMYYYY()}`, 15, currY + 6);
        doc.text(`Allocation Mode: ${isEquivalentMode ? 'Equivalent Division' : 'Greedy Division'}`, 15, currY + 11);
        
        if (pageNum > 1) {
          doc.setFont('Helvetica', 'bold');
          doc.text(`Page ${pageNum}`, 195, currY, { align: 'right' });
        }
        
        // horizontal line below header
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(15, currY + 15, 195, currY + 15);
        
        currY += 22;
      };

      const drawTableHeader = () => {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        
        doc.text('STAFF / FUNCTIONARY', 15, currY);
        doc.text('PENSIONS', 65, currY, { align: 'center' });
        doc.text('TARGET SHARE', 100, currY, { align: 'right' });
        doc.text('ALLOCATED AMT', 125, currY, { align: 'right' });
        doc.text('DENOMINATION BREAKDOWN', 128, currY);
        
        doc.setLineWidth(0.3);
        doc.line(15, currY + 2, 195, currY + 2);
        currY += 7;
      };

      const activeFunctionaries = functionaries.filter(f => f.amount > 0);

      drawScheduleHeader(pageNum);
      drawTableHeader();

      const lineSpacing = 4.5;

      activeFunctionaries.forEach((f) => {
        const alloc = summary.allocations[f.id];
        if (!alloc) return;
        
        const activeDenoms = denominations.filter(denom => (alloc.notes[denom] || 0) > 0);
        const breakdownStr = activeDenoms.length > 0 
          ? activeDenoms.map(denom => `${pdfSym}${denom}×${alloc.notes[denom]}`).join(' , ')
          : 'None';
        
        const wrappedBreakdown = doc.splitTextToSize(breakdownStr, 66);
        const rowLines = Math.max(1, wrappedBreakdown.length);
        const rowHeight = rowLines * lineSpacing + 2;
        
        if (currY + rowHeight > 275) {
          doc.addPage();
          pageNum++;
          currY = 20;
          drawScheduleHeader(pageNum);
          drawTableHeader();
        }
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        
        // Name
        doc.text(f.name, 15, currY + 4);
        
        // Pensions
        doc.text(String(f.pensions || 1), 65, currY + 4, { align: 'center' });
        
        // Target Share
        doc.text(formatPdfCurrency(f.amount), 100, currY + 4, { align: 'right' });
        
        // Allocated
        doc.text(formatPdfCurrency(alloc.allocatedAmount), 125, currY + 4, { align: 'right' });
        
        // Breakdown
        for (let l = 0; l < wrappedBreakdown.length; l++) {
          doc.text(wrappedBreakdown[l], 128, currY + 4 + (l * lineSpacing));
        }
        
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.line(15, currY + rowHeight, 195, currY + rowHeight);
        
        currY += rowHeight;
      });

      // Total row
      const totalAllocated = activeFunctionaries.reduce((sum, f) => {
        const alloc = summary.allocations[f.id];
        return sum + (alloc ? alloc.allocatedAmount : 0);
      }, 0);

      if (currY + 12 > 275) {
        doc.addPage();
        pageNum++;
        currY = 20;
        drawScheduleHeader(pageNum);
      }

      currY += 2;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('Total Payout Fulfilled:', 15, currY + 4);
      doc.text(formatPdfCurrency(totalAllocated), 125, currY + 4, { align: 'right' });

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(15, currY + 7, 195, currY + 7);

      // Slips rendering helper
      const drawReceiptSlip = (f: Functionary, globalIndex: number, startY: number) => {
        const alloc = summary.allocations[f.id];
        if (!alloc) return;
        
        const slipHeight = 82;
        const startX = 15;
        const width = 180;
        
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.setLineDashPattern([2, 1.5], 0);
        doc.rect(startX, startY, width, slipHeight);
        doc.setLineDashPattern([], 0);
        
        const padX = startX + 5;
        const padY = startY + 6;
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text('CASH PAYOUT RECEIPT', padX, padY);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text(`Slip #${globalIndex + 1}  •  ${formatDateDDMMYYYY()}`, padX, padY + 4);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(80, 80, 80);
        doc.text('AMOUNT PAID', startX + width - 5, padY, { align: 'right' });
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(formatPdfCurrency(alloc.allocatedAmount), startX + width - 5, padY + 5.5, { align: 'right' });
        
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.15);
        doc.line(padX, padY + 7, startX + width - 5, padY + 7);
        
        const gridY = padY + 12;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('PAID TO (FUNCTIONARY):', padX, gridY);
        doc.text('NO OF PENSIONS:', padX + 70, gridY, { align: 'center' });
        doc.text('TARGET SHARE:', startX + width - 5, gridY, { align: 'right' });
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text(f.name, padX, gridY + 4);
        doc.text(String(f.pensions || 1), padX + 70, gridY + 4, { align: 'center' });
        doc.text(formatPdfCurrency(f.amount), startX + width - 5, gridY + 4, { align: 'right' });
        
        const boxY = gridY + 7;
        const boxHeight = 15;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.rect(padX, boxY, width - 10, boxHeight);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text('DENOMINATION BREAKDOWN:', padX + 3, boxY + 3.5);
        
        const activeDenoms = denominations.filter(denom => (alloc.notes[denom] || 0) > 0);
        const breakdownParts = activeDenoms.map(denom => {
          const count = alloc.notes[denom] || 0;
          return `${pdfSym}${denom} × ${count} = ${formatPdfCurrency(count * denom)}`;
        });
        
        const breakdownFullStr = breakdownParts.length > 0 ? breakdownParts.join('   •   ') : 'None';
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        
        const wrappedBreakdownBox = doc.splitTextToSize(breakdownFullStr, width - 16);
        for (let l = 0; l < Math.min(2, wrappedBreakdownBox.length); l++) {
          doc.text(wrappedBreakdownBox[l], padX + 3, boxY + 7.5 + (l * 3.5));
        }
        
        const returnY = boxY + boxHeight + 4;
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('Number of undisbursed pensions: ______', padX, returnY);
        doc.text('Returned amount: ________________________', padX + 75, returnY);
        
        const sigY = returnY + 11;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        doc.line(padX + 5, sigY, padX + 55, sigY);
        doc.line(startX + width - 60, sigY, startX + width - 10, sigY);
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.text('Authorized Signatory', padX + 30, sigY + 3, { align: 'center' });
        doc.text("Receiver's Signature", startX + width - 35, sigY + 3, { align: 'center' });
      };

      const slipsPerPage = 3;
      const totalReceiptPages = Math.ceil(activeFunctionaries.length / slipsPerPage);

      for (let pageIndex = 0; pageIndex < totalReceiptPages; pageIndex++) {
        doc.addPage();
        const startIdx = pageIndex * slipsPerPage;
        const chunk = activeFunctionaries.slice(startIdx, startIdx + slipsPerPage);
        
        chunk.forEach((f, i) => {
          const globalIndex = startIdx + i;
          const slipStartY = 10 + (i * 87);
          drawReceiptSlip(f, globalIndex, slipStartY);
        });
      }

      setPdfProgress('Saving...');
      doc.save(`Cash_Distribution_Report_${selectedCurrency.code}_${formatDateDDMMYYYY().replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('PDF Generation failed with detailed error:', err);
      alert(`An error occurred while generating the PDF: ${err instanceof Error ? err.message : String(err)}\n\nPlease try again or use the print function.`);
    } finally {
      setIsGeneratingPDF(false);
      setPdfProgress('');
    }
  };

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
    <div id="distribution-report-container">
      {/* On-Screen Interactive Report (Hidden in print) */}
      <div className="space-y-6 no-print">
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
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold shadow-3xs transition-all cursor-pointer ${
                isGeneratingPDF
                  ? 'bg-amber-100 border border-amber-200 text-amber-800 cursor-not-allowed dark:bg-amber-950/40 dark:border-amber-900/40 dark:text-amber-300'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white'
              }`}
              id="download-pdf-btn"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-bounce' : 'text-white'}`} />
              {isGeneratingPDF ? pdfProgress : 'Download PDF'}
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

      {/* Close the On-Screen Interactive Report wrapper */}
      </div>

      {/* Print Page 1: Detailed Staff Payout Schedule (Hidden on screen, styled for ISO A4 print) */}
      <div className="hidden print:block print-only print-page text-black" id="printable-schedule-page" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
        {/* Header */}
        <div className="flex justify-between items-center border-b border-black pb-3 mb-6 bg-white">
          <div>
            <h1 className="font-display font-extrabold text-lg text-black uppercase tracking-tight">
              Detailed Staff Payout Schedule
            </h1>
            <p className="text-[10px] text-black font-mono mt-0.5">
              Report Generated: {formatDateDDMMYYYY()}
            </p>
          </div>
          <div className="text-right text-[10px] text-black bg-white">
            <span className="font-bold">Allocation Mode: </span>
            <span className="font-semibold text-black bg-white px-2 py-0.5 rounded border border-black">
              {isEquivalentMode ? 'Equivalent Division' : 'Greedy Division'}
            </span>
          </div>
        </div>

        {/* Elegant Schedule Table */}
        <div className="border border-black rounded-xl overflow-hidden mt-4 bg-white">
          <table className="w-full text-left border-collapse table-fixed bg-white">
            <thead>
              <tr className="bg-white text-[9px] font-extrabold uppercase text-black border-b border-black">
                <th className="py-2 px-4 w-[22%] text-black">Staff / Functionary</th>
                <th className="py-2 px-3 text-center w-[8%] text-black">Pensions</th>
                <th className="py-2 px-3 text-right w-[15%] text-black">Target Share</th>
                <th className="py-2 px-3 text-right w-[15%] text-black">Allocated Amt</th>
                <th className="py-2 px-4 text-center w-[40%] text-black">Denomination Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black text-[11px] bg-white">
              {functionaries.filter(f => f.amount > 0).map(f => {
                const alloc = summary.allocations[f.id];
                if (!alloc) return null;

                const hasNotes = Object.entries(alloc.notes).some(([_, count]) => count > 0);
                const activeDenoms = denominations.filter(denom => (alloc.notes[denom] || 0) > 0);

                return (
                  <tr key={f.id} className="bg-white text-black">
                    <td className="py-1.5 px-4 font-bold text-black break-words bg-white">{f.name}</td>
                    <td className="py-1.5 px-3 text-center font-semibold text-black bg-white">{f.pensions || 1}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-black bg-white">{formatCurrency(f.amount, selectedCurrency.symbol)}</td>
                    <td className="py-1.5 px-3 text-right font-mono font-bold text-black bg-white">{formatCurrency(alloc.allocatedAmount, selectedCurrency.symbol)}</td>
                    <td className="py-1.5 px-4 text-center bg-white">
                      <div className="flex flex-wrap gap-x-2.5 gap-y-1 items-center justify-center bg-white text-[10px] font-mono text-black font-semibold">
                        {activeDenoms.map((denom, idx) => {
                          const count = alloc.notes[denom] || 0;
                          return (
                            <span key={denom} className="whitespace-nowrap">
                              {selectedCurrency.symbol}{denom}×{count}{idx < activeDenoms.length - 1 ? " ," : ""}
                            </span>
                          );
                        })}
                        {!hasNotes && (
                          <span className="text-[10px] text-black font-mono italic">None</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer block for Detailed Schedule */}
          <div className="p-3 bg-white border-t border-black flex justify-between items-center text-[10px] text-black">
            <div>
              <p className="font-semibold text-black">Total Payout Fulfilled: <span className="font-bold text-black font-mono">{formatCurrency(summary.totalAllocated, selectedCurrency.symbol)}</span></p>
            </div>
            <div>
              <p className="font-mono text-black">Payout Schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Beautiful Printable Payout Slips (Hidden in normal screen, styled for print only) */}
      <div className="hidden print:block print-only receipts-container" id="printable-slips-container">
        {(() => {
          const activeFunctionaries = functionaries.filter(f => f.amount > 0);
          const chunks: Functionary[][] = [];
          for (let i = 0; i < activeFunctionaries.length; i += 3) {
            chunks.push(activeFunctionaries.slice(i, i + 3));
          }
          
          return chunks.map((chunk, pageIndex) => (
            <div key={pageIndex} className="receipt-page" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
              {chunk.map((f, i) => {
                const globalIndex = pageIndex * 3 + i;
                const alloc = summary.allocations[f.id];
                if (!alloc) return null;
                
                return (
                  <div key={f.id} className="print-card bg-transparent text-black border border-dashed border-black">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-dashed border-black pb-2 bg-transparent">
                      <div>
                        <h3 className="font-display font-bold text-sm text-black">CASH PAYOUT RECEIPT</h3>
                        <p className="text-[9px] text-black font-mono font-bold">Slip #{globalIndex + 1} • {formatDateDDMMYYYY()}</p>
                      </div>
                      <div className="text-right text-black bg-transparent">
                        <span className="text-[9px] uppercase font-bold text-black tracking-wider">Amount Paid</span>
                        <p className="text-base font-bold font-mono text-black bg-transparent">{formatCurrency(alloc.allocatedAmount, selectedCurrency.symbol)}</p>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 bg-transparent text-black">
                      <div className="bg-transparent">
                        <span className="text-[9px] text-black block font-bold uppercase bg-transparent">Paid To (Functionary):</span>
                        <span className="font-bold text-black bg-transparent">{f.name}</span>
                      </div>
                      <div className="text-center bg-transparent">
                        <span className="text-[9px] text-black block font-bold uppercase bg-transparent">No of Pensions:</span>
                        <span className="font-bold text-black block bg-transparent">{f.pensions || 1}</span>
                      </div>
                      <div className="text-right bg-transparent">
                        <span className="text-[9px] text-black block font-bold uppercase bg-transparent">Target Share:</span>
                        <span className="font-mono text-black block bg-transparent">{formatCurrency(f.amount, selectedCurrency.symbol)}</span>
                      </div>
                    </div>

                    {/* Breakdown Box */}
                    <div className="bg-transparent p-2 rounded border border-black my-1 text-black">
                      <span className="text-[9px] font-bold text-black block uppercase mb-1 bg-transparent">Denomination Breakdown:</span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 bg-transparent text-[11px] font-mono font-bold text-black">
                        {denominations.filter(denom => (alloc.notes[denom] || 0) > 0).map((denom, idx, arr) => {
                          const count = alloc.notes[denom] || 0;
                          return (
                            <span key={denom} className="whitespace-nowrap bg-transparent">
                              {selectedCurrency.symbol}{denom} × {count} = {formatCurrency(count * denom, selectedCurrency.symbol)}{idx < arr.length - 1 ? "   • " : ""}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Return lines */}
                    <div className="border-t border-dashed border-black pt-2 flex flex-wrap gap-x-6 gap-y-1 text-[11px] bg-transparent text-black">
                      <div className="flex items-center gap-1 bg-transparent">
                        <span className="font-semibold text-black bg-transparent">Number of undisbursed pensions:</span>
                        <span className="font-mono text-black bg-transparent">______</span>
                      </div>
                      <div className="flex items-center gap-1 bg-transparent">
                        <span className="font-semibold text-black bg-transparent">Returned amount:</span>
                        <span className="font-mono text-black bg-transparent">________________________</span>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 pt-5 text-[10px] bg-transparent text-black">
                      <div className="border-t border-black pt-1 text-center text-black font-bold bg-transparent">
                        Authorized Signatory
                      </div>
                      <div className="border-t border-black pt-1 text-center text-black font-bold bg-transparent">
                        Receiver's Signature
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
