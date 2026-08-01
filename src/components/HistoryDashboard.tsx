import React, { useState, useEffect } from 'react';
import { 
  Calendar, Download, TrendingUp, TrendingDown, Users, Banknote, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Archive, Trash2, Eye, 
  FileText, PlusCircle, CheckCircle2, AlertCircle, BarChart3, Layers, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { jsPDF } from 'jspdf';
import { Currency, DistributionSummary, Functionary, PayoutAllocation, AllocationArchiveRecord, ArchivedFunctionaryAllocation } from '../types';
import { formatCurrency, formatDateDDMMYYYY } from '../utils';

interface HistoryDashboardProps {
  selectedCurrency: Currency;
  currentFunctionaries: Functionary[];
  currentSummary: DistributionSummary;
  isEquivalentMode: boolean;
  ensureAllDenominations: boolean;
  onRestoreFunctionaries: (functionaries: Functionary[]) => void;
}

// Default Sample Historical Months for demo & comparison if storage is empty
const getSampleHistoryRecords = (currencySymbol: string): AllocationArchiveRecord[] => [
  {
    id: '2026-05',
    monthYear: 'May 2026',
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    currencySymbol,
    totalDisbursed: 185000,
    totalTargetPayout: 185000,
    totalStaffCount: 14,
    totalPensionsCount: 18,
    strategyUsed: 'Equivalent Division',
    denominationBreakdown: { 500: 320, 200: 95, 100: 50, 50: 20, 20: 0, 10: 0, 5: 0 },
    functionaryAllocations: [
      { id: '1', name: 'Ramesh Kumar', amount: 25000, pensionCount: 2, notes: { 500: 44, 200: 10, 100: 10 }, status: 'fully_paid' },
      { id: '2', name: 'Suresh Patel', amount: 15000, pensionCount: 1, notes: { 500: 26, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '3', name: 'Anil Verma', amount: 12000, pensionCount: 1, notes: { 500: 20, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '4', name: 'Priya Sharma', amount: 18000, pensionCount: 2, notes: { 500: 32, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '5', name: 'Sunita Reddy', amount: 10000, pensionCount: 1, notes: { 500: 18, 200: 4, 100: 2 }, status: 'fully_paid' },
      { id: '6', name: 'Vijay Singh', amount: 14000, pensionCount: 1, notes: { 500: 24, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '7', name: 'Meena Gupta', amount: 11000, pensionCount: 1, notes: { 500: 18, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '8', name: 'Kiran Rao', amount: 13000, pensionCount: 1, notes: { 500: 22, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '9', name: 'Deepak Joshi', amount: 9000, pensionCount: 1, notes: { 500: 14, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '10', name: 'Asha Bhat', amount: 16000, pensionCount: 2, notes: { 500: 28, 200: 8, 100: 4 }, status: 'fully_paid' },
    ],
    memo: 'May Monthly Staff Disbursal - Standard Roll',
  },
  {
    id: '2026-06',
    monthYear: 'June 2026',
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
    currencySymbol,
    totalDisbursed: 202500,
    totalTargetPayout: 202500,
    totalStaffCount: 15,
    totalPensionsCount: 20,
    strategyUsed: 'Equivalent Division',
    denominationBreakdown: { 500: 350, 200: 110, 100: 55, 50: 0, 20: 0, 10: 0, 5: 0 },
    functionaryAllocations: [
      { id: '1', name: 'Ramesh Kumar', amount: 26000, pensionCount: 2, notes: { 500: 46, 200: 10, 100: 10 }, status: 'fully_paid' },
      { id: '2', name: 'Suresh Patel', amount: 15000, pensionCount: 1, notes: { 500: 26, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '3', name: 'Anil Verma', amount: 12500, pensionCount: 1, notes: { 500: 21, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '4', name: 'Priya Sharma', amount: 18000, pensionCount: 2, notes: { 500: 32, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '5', name: 'Sunita Reddy', amount: 10500, pensionCount: 1, notes: { 500: 19, 200: 4, 100: 2 }, status: 'fully_paid' },
      { id: '6', name: 'Vijay Singh', amount: 14000, pensionCount: 1, notes: { 500: 24, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '7', name: 'Meena Gupta', amount: 11500, pensionCount: 1, notes: { 500: 19, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '8', name: 'Kiran Rao', amount: 13000, pensionCount: 1, notes: { 500: 22, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '9', name: 'Deepak Joshi', amount: 9000, pensionCount: 1, notes: { 500: 14, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '10', name: 'Asha Bhat', amount: 16000, pensionCount: 2, notes: { 500: 28, 200: 8, 100: 4 }, status: 'fully_paid' },
      { id: '11', name: 'Rajesh Nair', amount: 17500, pensionCount: 2, notes: { 500: 31, 200: 8, 100: 4 }, status: 'fully_paid' },
    ],
    memo: 'June Disbursal with summer allowance adjustments',
  }
];

export default function HistoryDashboard({
  selectedCurrency,
  currentFunctionaries,
  currentSummary,
  isEquivalentMode,
  ensureAllDenominations,
  onRestoreFunctionaries,
}: HistoryDashboardProps) {
  // Archive records state
  const [records, setRecords] = useState<AllocationArchiveRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cash_dist_history_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse history records from localStorage', e);
    }
    return getSampleHistoryRecords(selectedCurrency.symbol);
  });

  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveMonthName, setArchiveMonthName] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [archiveMemo, setArchiveMemo] = useState('');

  // Selected comparison months
  const [baseMonthId, setBaseMonthId] = useState<string>('');
  const [targetMonthId, setTargetMonthId] = useState<string>('');

  // View modal state
  const [selectedRecordForView, setSelectedRecordForView] = useState<AllocationArchiveRecord | null>(null);

  // Auto-save history records to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cash_dist_history_records', JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save history records', e);
    }
  }, [records]);

  // Set default comparative month choices when records load
  useEffect(() => {
    if (records.length >= 2) {
      setBaseMonthId(records[records.length - 2].id);
      setTargetMonthId(records[records.length - 1].id);
    } else if (records.length === 1) {
      setBaseMonthId(records[0].id);
      setTargetMonthId(records[0].id);
    }
  }, [records.length]);

  const currencySymbol = selectedCurrency.symbol;
  const pdfSym = currencySymbol === '₹' ? 'Rs.' : (currencySymbol.charCodeAt(0) > 127 ? selectedCurrency.code + ' ' : currencySymbol);

  const formatPdfCurrency = (amt: number) => {
    return formatCurrency(amt, currencySymbol).replace(currencySymbol, pdfSym);
  };

  // Helper to snapshot active workspace into an Archive Record
  const handleArchiveCurrentMonth = () => {
    if (!archiveMonthName.trim()) {
      alert('Please enter a valid month/year label (e.g. "July 2026").');
      return;
    }

    // Build denomination breakdown of current allocated notes
    const denomBreakdown: Record<number, number> = {};
    selectedCurrency.denominations.forEach(d => { denomBreakdown[d] = 0; });

    const activeStaff = currentFunctionaries.filter(f => f.amount > 0);
    const archivedAllocations: ArchivedFunctionaryAllocation[] = activeStaff.map(f => {
      const alloc = currentSummary.allocations[f.id];
      const noteMap = alloc ? { ...alloc.notes } : {};
      
      // Sum notes for total breakdown
      Object.entries(noteMap).forEach(([dStr, count]) => {
        const d = Number(dStr);
        denomBreakdown[d] = (denomBreakdown[d] || 0) + (count || 0);
      });

      return {
        id: f.id,
        name: f.name,
        amount: f.amount,
        pensionCount: f.pensions || 1,
        notes: noteMap,
        status: alloc ? alloc.status : 'unpaid',
      };
    });

    const totalPensionsCount = activeStaff.reduce((sum, f) => sum + (f.pensions || 1), 0);

    const newRecord: AllocationArchiveRecord = {
      id: `record-${Date.now()}`,
      monthYear: archiveMonthName.trim(),
      timestamp: Date.now(),
      currencySymbol: selectedCurrency.symbol,
      totalDisbursed: currentSummary.totalAllocated,
      totalTargetPayout: currentSummary.totalTargetPayout,
      totalStaffCount: activeStaff.length,
      totalPensionsCount,
      strategyUsed: isEquivalentMode ? 'Equivalent Division' : 'Greedy Division',
      denominationBreakdown: denomBreakdown,
      functionaryAllocations: archivedAllocations,
      memo: archiveMemo.trim(),
    };

    setRecords(prev => [...prev, newRecord]);
    setShowArchiveModal(false);
    setArchiveMemo('');
    alert(`Successfully archived allocation for "${newRecord.monthYear}" into historical memory!`);
  };

  const handleDeleteRecord = (id: string, monthYear: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the archive for "${monthYear}"?`)) {
      setRecords(prev => prev.filter(r => r.id !== id));
      if (selectedRecordForView?.id === id) setSelectedRecordForView(null);
    }
  };

  // Base and Target month selection for comparative metrics
  const baseRecord = records.find(r => r.id === baseMonthId) || records[0];
  const targetRecord = records.find(r => r.id === targetMonthId) || records[records.length - 1];

  // Calculate Month-over-Month Differences
  const calcDiffs = () => {
    if (!baseRecord || !targetRecord) return null;

    const disbursedDiff = targetRecord.totalDisbursed - baseRecord.totalDisbursed;
    const disbursedPct = baseRecord.totalDisbursed > 0 ? (disbursedDiff / baseRecord.totalDisbursed) * 100 : 0;

    const staffDiff = targetRecord.totalStaffCount - baseRecord.totalStaffCount;
    const pensionsDiff = targetRecord.totalPensionsCount - baseRecord.totalPensionsCount;

    const baseAvg = baseRecord.totalStaffCount > 0 ? baseRecord.totalDisbursed / baseRecord.totalStaffCount : 0;
    const targetAvg = targetRecord.totalStaffCount > 0 ? targetRecord.totalDisbursed / targetRecord.totalStaffCount : 0;
    const avgDiff = targetAvg - baseAvg;

    // Staff level differences
    const staffMap: Record<string, {
      id: string;
      name: string;
      baseAmount: number;
      targetAmount: number;
      basePensions: number;
      targetPensions: number;
    }> = {};

    baseRecord.functionaryAllocations.forEach(f => {
      staffMap[f.name.toLowerCase()] = {
        id: f.id,
        name: f.name,
        baseAmount: f.amount,
        targetAmount: 0,
        basePensions: f.pensionCount,
        targetPensions: 0,
      };
    });

    targetRecord.functionaryAllocations.forEach(f => {
      const key = f.name.toLowerCase();
      if (staffMap[key]) {
        staffMap[key].targetAmount = f.amount;
        staffMap[key].targetPensions = f.pensionCount;
      } else {
        staffMap[key] = {
          id: f.id,
          name: f.name,
          baseAmount: 0,
          targetAmount: f.amount,
          basePensions: 0,
          targetPensions: f.pensionCount,
        };
      }
    });

    const staffDiffList = Object.values(staffMap).map(s => {
      const diffAmt = s.targetAmount - s.baseAmount;
      const pctChange = s.baseAmount > 0 ? (diffAmt / s.baseAmount) * 100 : 100;
      return {
        ...s,
        diffAmt,
        pctChange,
      };
    }).sort((a, b) => Math.abs(b.diffAmt) - Math.abs(a.diffAmt));

    // Denomination differences
    const allDenoms = Array.from(
      new Set([
        ...Object.keys(baseRecord.denominationBreakdown).map(Number),
        ...Object.keys(targetRecord.denominationBreakdown).map(Number),
        ...selectedCurrency.denominations,
      ])
    ).sort((a, b) => b - a);

    const denomDiffs = allDenoms.map(d => {
      const baseNotes = baseRecord.denominationBreakdown[d] || 0;
      const targetNotes = targetRecord.denominationBreakdown[d] || 0;
      return {
        denom: d,
        baseNotes,
        targetNotes,
        diffNotes: targetNotes - baseNotes,
        baseValue: baseNotes * d,
        targetValue: targetNotes * d,
        diffValue: (targetNotes - baseNotes) * d,
      };
    });

    return {
      disbursedDiff,
      disbursedPct,
      staffDiff,
      pensionsDiff,
      baseAvg,
      targetAvg,
      avgDiff,
      staffDiffList,
      denomDiffs,
    };
  };

  const diffs = calcDiffs();

  // Prepare chart data for Recharts
  const trendChartData = records.map(r => ({
    name: r.monthYear,
    'Total Disbursed': r.totalDisbursed,
    'Staff Count': r.totalStaffCount,
  }));

  const denomChartData = selectedCurrency.denominations.map(d => ({
    denom: `${currencySymbol}${d}`,
    [baseRecord?.monthYear || 'Base']: baseRecord?.denominationBreakdown[d] || 0,
    [targetRecord?.monthYear || 'Target']: targetRecord?.denominationBreakdown[d] || 0,
  }));

  // Download Historical Comparative PDF Report
  const handleDownloadComparativePDF = () => {
    if (!baseRecord || !targetRecord || !diffs) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let currY = 20;

    // Title
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('HISTORICAL ALLOCATION & DIFFERENCE REPORT', 15, currY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Comparative Period: ${baseRecord.monthYear} vs ${targetRecord.monthYear}`, 15, currY + 6);
    doc.text(`Generated: ${formatDateDDMMYYYY()}`, 15, currY + 11);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, currY + 15, 195, currY + 15);
    currY += 22;

    // Executive Summary Box
    doc.setFillColor(245, 247, 250);
    doc.rect(15, currY, 180, 32, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('MONTH-OVER-MONTH SUMMARY COMPARISON', 20, currY + 7);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Base Month (${baseRecord.monthYear}): ${formatPdfCurrency(baseRecord.totalDisbursed)} (${baseRecord.totalStaffCount} staff)`, 20, currY + 14);
    doc.text(`Target Month (${targetRecord.monthYear}): ${formatPdfCurrency(targetRecord.totalDisbursed)} (${targetRecord.totalStaffCount} staff)`, 20, currY + 20);

    const sign = diffs.disbursedDiff >= 0 ? '+' : '';
    doc.setFont('Helvetica', 'bold');
    doc.text(`Net Difference: ${sign}${formatPdfCurrency(diffs.disbursedDiff)} (${sign}${diffs.disbursedPct.toFixed(1)}%)`, 20, currY + 26);

    currY += 40;

    // Staff Variance Table Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('STAFF PAYOUT VARIANCE TABLE', 15, currY);
    currY += 6;

    doc.setFontSize(8);
    doc.text('STAFF NAME', 15, currY);
    doc.text(`${baseRecord.monthYear.toUpperCase()}`, 70, currY, { align: 'right' });
    doc.text(`${targetRecord.monthYear.toUpperCase()}`, 110, currY, { align: 'right' });
    doc.text('VARIANCE', 150, currY, { align: 'right' });
    doc.text('% CHANGE', 185, currY, { align: 'right' });

    doc.setLineWidth(0.3);
    doc.line(15, currY + 2, 195, currY + 2);
    currY += 7;

    doc.setFont('Helvetica', 'normal');
    diffs.staffDiffList.forEach(s => {
      if (currY > 270) {
        doc.addPage();
        currY = 20;
      }
      doc.text(s.name, 15, currY);
      doc.text(formatPdfCurrency(s.baseAmount), 70, currY, { align: 'right' });
      doc.text(formatPdfCurrency(s.targetAmount), 110, currY, { align: 'right' });
      
      const vSign = s.diffAmt >= 0 ? '+' : '';
      doc.text(`${vSign}${formatPdfCurrency(s.diffAmt)}`, 150, currY, { align: 'right' });
      doc.text(`${vSign}${s.pctChange.toFixed(1)}%`, 185, currY, { align: 'right' });
      
      currY += 6;
    });

    // Denomination Shift Section
    currY += 8;
    if (currY > 240) {
      doc.addPage();
      currY = 20;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DENOMINATION NOTE MIX SHIFT', 15, currY);
    currY += 6;

    doc.setFontSize(8);
    doc.text('DENOMINATION', 15, currY);
    doc.text(`${baseRecord.monthYear} (NOTES)`, 80, currY, { align: 'right' });
    doc.text(`${targetRecord.monthYear} (NOTES)`, 130, currY, { align: 'right' });
    doc.text('NOTE DIFFERENCE', 185, currY, { align: 'right' });

    doc.line(15, currY + 2, 195, currY + 2);
    currY += 7;

    doc.setFont('Helvetica', 'normal');
    diffs.denomDiffs.forEach(d => {
      if (currY > 270) {
        doc.addPage();
        currY = 20;
      }
      doc.text(`${pdfSym} ${d.denom}`, 15, currY);
      doc.text(`${d.baseNotes} notes`, 80, currY, { align: 'right' });
      doc.text(`${d.targetNotes} notes`, 130, currY, { align: 'right' });

      const nSign = d.diffNotes >= 0 ? '+' : '';
      doc.text(`${nSign}${d.diffNotes} notes`, 185, currY, { align: 'right' });

      currY += 6;
    });

    doc.save(`Cash_Allocation_Difference_Report_${baseRecord.monthYear.replace(/\s+/g, '_')}_vs_${targetRecord.monthYear.replace(/\s+/g, '_')}.pdf`);
  };

  // Download Single Archived Month PDF
  const handleDownloadSingleMonthPDF = (record: AllocationArchiveRecord) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let currY = 20;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`MONTHLY CASH DISTRIBUTION LEDGER - ${record.monthYear.toUpperCase()}`, 15, currY);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Archived Date: ${new Date(record.timestamp).toLocaleDateString()}`, 15, currY + 6);
    doc.text(`Allocation Strategy: ${record.strategyUsed}`, 15, currY + 11);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, currY + 15, 195, currY + 15);
    currY += 22;

    // Totals Banner
    doc.setFillColor(240, 249, 245);
    doc.rect(15, currY, 180, 20, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Disbursed: ${formatPdfCurrency(record.totalDisbursed)}`, 20, currY + 8);
    doc.text(`Staff Count: ${record.totalStaffCount} members`, 90, currY + 8);
    doc.text(`Total Pensions: ${record.totalPensionsCount}`, 150, currY + 8);

    currY += 28;

    // Table Header
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('STAFF / FUNCTIONARY', 15, currY);
    doc.text('PENSIONS', 65, currY, { align: 'center' });
    doc.text('AMOUNT PAID', 100, currY, { align: 'right' });
    doc.text('DENOMINATION BREAKDOWN', 115, currY);

    doc.line(15, currY + 2, 195, currY + 2);
    currY += 7;

    doc.setFont('Helvetica', 'normal');
    record.functionaryAllocations.forEach(f => {
      if (currY > 270) {
        doc.addPage();
        currY = 20;
      }
      doc.text(f.name, 15, currY);
      doc.text(`${f.pensionCount}`, 65, currY, { align: 'center' });
      doc.text(formatPdfCurrency(f.amount), 100, currY, { align: 'right' });

      // Notes breakdown string
      const notesParts = Object.entries(f.notes)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([denom, count]) => `${pdfSym}${denom}x${count}`);

      doc.text(notesParts.join('  ') || 'None', 115, currY);
      currY += 6;
    });

    doc.save(`Archived_Cash_Distribution_${record.monthYear.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-8" id="history-dashboard-root">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Archive className="w-4 h-4" />
            <span>Persistent Historical Archive & Analytics</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-display mt-1">
            Monthly Distribution History & Difference Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compare monthly allocations, analyze denomination shifts, identify variances, and download formal PDF reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Archive Current Month ({currencySymbol}{currentSummary.totalAllocated.toLocaleString()})</span>
          </button>

          {diffs && (
            <button
              onClick={handleDownloadComparativePDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer border border-slate-700"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download MoM PDF Report</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Month Selector & MoM Comparative Metric Cards */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-white">Month-over-Month Comparative Analytics</h3>
              <p className="text-xs text-slate-400">Select base and target historical months to analyze differences</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold px-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compare:</span>
            </div>

            <select
              value={baseMonthId}
              onChange={(e) => setBaseMonthId(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {records.map(r => (
                <option key={r.id} value={r.id}>{r.monthYear} (Base)</option>
              ))}
            </select>

            <span className="text-xs text-slate-400 font-bold">vs</span>

            <select
              value={targetMonthId}
              onChange={(e) => setTargetMonthId(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
            >
              {records.map(r => (
                <option key={r.id} value={r.id}>{r.monthYear} (Target)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Top MoM Difference Stat Badges */}
        {diffs && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Total Disbursed Diff */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Total Cash Disbursed</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white font-display">
                  {currencySymbol}{targetRecord.totalDisbursed.toLocaleString()}
                </span>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${diffs.disbursedDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {diffs.disbursedDiff >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {diffs.disbursedDiff >= 0 ? '+' : ''}{diffs.disbursedPct.toFixed(1)}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Diff vs {baseRecord.monthYear}: <strong className={diffs.disbursedDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{diffs.disbursedDiff >= 0 ? '+' : ''}{currencySymbol}{diffs.disbursedDiff.toLocaleString()}</strong>
              </p>
            </div>

            {/* Stat 2: Active Staff Diff */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Staff Count</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white font-display">
                  {targetRecord.totalStaffCount} Members
                </span>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${diffs.staffDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {diffs.staffDiff >= 0 ? '+' : ''}{diffs.staffDiff} Staff
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Base ({baseRecord.monthYear}): {baseRecord.totalStaffCount} staff members
              </p>
            </div>

            {/* Stat 3: Avg Payout per Staff */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Avg Payout / Staff</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-white font-display">
                  {currencySymbol}{Math.round(diffs.targetAvg).toLocaleString()}
                </span>
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${diffs.avgDiff >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {diffs.avgDiff >= 0 ? '+' : ''}{currencySymbol}{Math.round(diffs.avgDiff).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Base Avg: {currencySymbol}{Math.round(diffs.baseAvg).toLocaleString()}
              </p>
            </div>

            {/* Stat 4: Strategy & Pension Count */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-400">Pensions & Strategy</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-400 font-display">
                  {targetRecord.totalPensionsCount} Shares
                </span>
                <span className="text-[11px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded">
                  {targetRecord.strategyUsed}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pensions Delta: {diffs.pensionsDiff >= 0 ? '+' : ''}{diffs.pensionsDiff} shares
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Multi-Month Allocation Growth Trend */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Disbursed Cash & Staff Count Trend</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{records.length} Archived Months</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${currencySymbol}${Number(value).toLocaleString()}`, 'Total Cash']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="Total Disbursed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCash)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Denomination Note Mix Shift Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Denomination Note Count Comparison</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{baseRecord?.monthYear} vs {targetRecord?.monthYear}</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={denomChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="denom" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: any) => [`${value} notes`, 'Note Count']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey={baseRecord?.monthYear || 'Base'} fill="#64748b" radius={[6, 6, 0, 0]} />
                <Bar dataKey={targetRecord?.monthYear || 'Target'} fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. Staff-level Variance & Difference Table */}
      {diffs && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-0">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Staff Payout Variance Ledger ({baseRecord.monthYear} vs {targetRecord.monthYear})</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Detailed individual payout differences, pension changes, and variance percentages</p>
            </div>
            
            <button
              onClick={handleDownloadComparativePDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs font-bold rounded-lg transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Variance PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4 text-right">{baseRecord.monthYear} Payout</th>
                  <th className="py-3 px-4 text-right">{targetRecord.monthYear} Payout</th>
                  <th className="py-3 px-4 text-right">Variance ({currencySymbol})</th>
                  <th className="py-3 px-4 text-right">% Change</th>
                  <th className="py-3 px-4 text-center">Pension Shift</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {diffs.staffDiffList.map((s, idx) => {
                  const isNew = s.baseAmount === 0;
                  const isRemoved = s.targetAmount === 0;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{s.name}</span>
                        {isNew && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                            New Staff
                          </span>
                        )}
                        {isRemoved && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full dark:bg-rose-950 dark:text-rose-300">
                            Removed
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium">
                        {s.baseAmount > 0 ? `${currencySymbol}${s.baseAmount.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {s.targetAmount > 0 ? `${currencySymbol}${s.targetAmount.toLocaleString()}` : '—'}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-extrabold ${s.diffAmt > 0 ? 'text-emerald-600 dark:text-emerald-400' : s.diffAmt < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                        {s.diffAmt > 0 ? '+' : ''}{currencySymbol}{s.diffAmt.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${s.diffAmt > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : s.diffAmt < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {s.diffAmt > 0 ? '+' : ''}{s.pctChange.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-slate-500">
                        {s.basePensions} → {s.targetPensions} ({s.targetPensions - s.basePensions >= 0 ? '+' : ''}{s.targetPensions - s.basePensions})
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Complete Archived Monthly Records Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden space-y-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Archived Monthly Distribution Records ({records.length})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">All saved allocation snapshots kept permanently in local memory</p>
          </div>

          <button
            onClick={() => setShowArchiveModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Archive Active Allocation</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {records.map((rec) => (
            <div key={rec.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white font-display">{rec.monthYear}</h4>
                  <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md dark:bg-emerald-950 dark:text-emerald-300">
                    {rec.strategyUsed}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Archived on {new Date(rec.timestamp).toLocaleDateString()} • {rec.totalStaffCount} staff members • {rec.totalPensionsCount} pensions
                </p>
                {rec.memo && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md inline-block mt-1">
                    "{rec.memo}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 self-end md:self-auto">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-medium block">Total Disbursed</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white font-display">
                    {rec.currencySymbol}{rec.totalDisbursed.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-4">
                  <button
                    onClick={() => setSelectedRecordForView(rec)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="View Full Monthly Ledger"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDownloadSingleMonthPDF(rec)}
                    className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Download Month PDF Report"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Restore functionary staff list from "${rec.monthYear}" into your current workspace?`)) {
                        const restoredList: Functionary[] = rec.functionaryAllocations.map(f => ({
                          id: f.id,
                          name: f.name,
                          amount: f.amount,
                          pensions: f.pensionCount,
                        }));
                        onRestoreFunctionaries(restoredList);
                        alert(`Restored ${restoredList.length} staff members from ${rec.monthYear} to workspace.`);
                      }
                    }}
                    className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Load Staff List into Workspace"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleDeleteRecord(rec.id, rec.monthYear, e)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer"
                    title="Delete Archive Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal 1: Save Archive Current Month Dialog */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
                <Archive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Archive Current Month Allocation</span>
              </h3>
              <button 
                onClick={() => setShowArchiveModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save a permanent snapshot of the current workspace calculations ({currencySymbol}{currentSummary.totalAllocated.toLocaleString()} across {currentFunctionaries.filter(f => f.amount > 0).length} staff members).
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Month / Year Label
                </label>
                <input
                  type="text"
                  value={archiveMonthName}
                  onChange={(e) => setArchiveMonthName(e.target.value)}
                  placeholder="e.g. July 2026"
                  className="w-full text-sm font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Optional Notes / Memo
                </label>
                <textarea
                  value={archiveMemo}
                  onChange={(e) => setArchiveMemo(e.target.value)}
                  placeholder="e.g. Special festive bonus included for senior staff..."
                  rows={3}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveCurrentMonth}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
              >
                Confirm & Archive Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: View Single Month Full Record Inspection Modal */}
      {selectedRecordForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                  Archived Ledger: {selectedRecordForView.monthYear}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedRecordForView.currencySymbol}{selectedRecordForView.totalDisbursed.toLocaleString()} disbursed using {selectedRecordForView.strategyUsed}
                </p>
              </div>
              <button 
                onClick={() => setSelectedRecordForView(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* Denomination count summary bar */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Denomination Notes Used</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(selectedRecordForView.denominationBreakdown)
                    .map(([d, c]) => [d, Number(c)] as [string, number])
                    .filter(([_, count]) => count > 0)
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .map(([denom, count]) => (
                      <span key={denom} className="text-xs bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
                        {selectedRecordForView.currencySymbol}{denom}: <strong>{count} notes</strong> ({selectedRecordForView.currencySymbol}{(Number(denom) * count).toLocaleString()})
                      </span>
                    ))}
                </div>
              </div>

              {/* Staff table */}
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3 text-center">Pensions</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Denominations Allocated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedRecordForView.functionaryAllocations.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{f.name}</td>
                      <td className="py-2.5 px-3 text-center font-medium">{f.pensionCount}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{selectedRecordForView.currencySymbol}{f.amount.toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(f.notes)
                            .map(([d, c]) => [d, Number(c)] as [string, number])
                            .filter(([_, count]) => count > 0)
                            .sort((a, b) => Number(b[0]) - Number(a[0]))
                            .map(([d, count]) => (
                              <span key={d} className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {selectedRecordForView.currencySymbol}{d}x{count}
                              </span>
                            ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDownloadSingleMonthPDF(selectedRecordForView)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Ledger</span>
              </button>

              <button
                onClick={() => setSelectedRecordForView(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
