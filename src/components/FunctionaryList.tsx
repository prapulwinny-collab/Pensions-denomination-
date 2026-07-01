import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Upload, RefreshCw, X } from 'lucide-react';
import { Currency, Functionary } from '../types';
import { formatCurrency, getSampleFunctionaries, formatDateDDMMYYYY } from '../utils';

interface FunctionaryListProps {
  selectedCurrency: Currency;
  functionaries: Functionary[];
  onUpdateFunctionaries: (list: Functionary[]) => void;
}

export default function FunctionaryList({
  selectedCurrency,
  functionaries,
  onUpdateFunctionaries,
}: FunctionaryListProps) {
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [templates, setTemplates] = useState<{ name: string; date: string; list: Functionary[] }[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Load templates from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cash_dist_templates');
      if (stored) {
        setTemplates(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading templates', e);
    }
  }, []);

  const saveTemplatesToStorage = (newTemplates: typeof templates) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem('cash_dist_templates', JSON.stringify(newTemplates));
    } catch (e) {
      console.error('Error saving templates', e);
    }
  };

  const handleAddFunctionary = () => {
    const newId = (Math.max(0, ...functionaries.map(f => parseInt(f.id, 10) || 0)) + 1).toString();
    onUpdateFunctionaries([
      ...functionaries,
      { id: newId, name: `Functionary ${newId}`, amount: 0, pensions: 1 },
    ]);
  };

  const handleUpdateField = (id: string, field: 'name' | 'amount' | 'pensions', value: string) => {
    onUpdateFunctionaries(
      functionaries.map(f => {
        if (f.id === id) {
          if (field === 'amount') {
            const val = parseInt(value, 10);
            return { ...f, amount: isNaN(val) || val < 0 ? 0 : val };
          }
          if (field === 'pensions') {
            const val = parseInt(value, 10);
            return { ...f, pensions: isNaN(val) || val < 1 ? 1 : val };
          }
          return { ...f, name: value };
        }
        return f;
      })
    );
  };

  const handleDelete = (id: string) => {
    onUpdateFunctionaries(functionaries.filter(f => f.id !== id));
  };

  const handleClearAll = () => {
    onUpdateFunctionaries([]);
    setShowConfirmReset(false);
  };

  const handleLoadSample = () => {
    onUpdateFunctionaries(getSampleFunctionaries());
  };

  // Bulk paste parser
  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n');
    const imported: Functionary[] = [];
    let idCounter = Date.now();

    // Check if first line is a header row
    let hasHeaderRow = false;
    let nameColIndex = 0;
    let amountColIndex = 1;
    let pensionsColIndex = -1;

    const firstLine = lines[0]?.trim();
    if (firstLine) {
      let headers: string[] = [];
      if (firstLine.includes('\t')) {
        headers = firstLine.split('\t');
      } else if (firstLine.includes(',')) {
        headers = firstLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      } else if (firstLine.includes(';')) {
        headers = firstLine.split(';');
      } else {
        headers = firstLine.split(/ {2,}/);
      }

      headers = headers.map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      const hasName = headers.some(h => h.includes('name') || h.includes('staff') || h.includes('employee') || h.includes('member') || h.includes('functionary'));
      const hasAmount = headers.some(h => h.includes('amount') || h.includes('payout') || h.includes('value') || h.includes('salary') || h.includes('pay'));
      const hasPensions = headers.some(h => h.includes('pension'));

      if (hasName || hasAmount || hasPensions) {
        hasHeaderRow = true;
        headers.forEach((h, idx) => {
          if (h.includes('name') || h.includes('staff') || h.includes('employee') || h.includes('member') || h.includes('functionary')) {
            nameColIndex = idx;
          } else if (h.includes('amount') || h.includes('payout') || h.includes('value') || h.includes('salary') || h.includes('pay')) {
            amountColIndex = idx;
          } else if (h.includes('pension')) {
            pensionsColIndex = idx;
          }
        });
      }
    }

    lines.forEach((line, index) => {
      if (index === 0 && hasHeaderRow) return;

      const trimmed = line.trim();
      if (!trimmed) return;

      let parts: string[] = [];
      if (hasHeaderRow) {
        if (firstLine.includes('\t')) {
          parts = trimmed.split('\t');
        } else if (firstLine.includes(',')) {
          parts = trimmed.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        } else if (firstLine.includes(';')) {
          parts = trimmed.split(';');
        } else {
          parts = trimmed.split(/ {2,}/);
        }
      } else {
        // Try split by tabs, multiple spaces, or commas first
        parts = trimmed.split(/\t/);
        if (parts.length < 2) {
          parts = trimmed.split(/ {2,}/); // split by multiple spaces
        }
        if (parts.length < 2 && trimmed.includes(',')) {
          parts = trimmed.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        }
        if (parts.length < 2) {
          // Split by single spaces right-to-left
          const spaceParts = trimmed.split(/\s+/);
          if (spaceParts.length >= 2) {
            const lastIndex = spaceParts.length - 1;
            const secondToLastIndex = spaceParts.length - 2;
            
            const lastNum = parseInt(spaceParts[lastIndex].replace(/[^\d]/g, ''), 10);
            const secondToLastNum = parseInt(spaceParts[secondToLastIndex]?.replace(/[^\d]/g, '') || '', 10);
            
            if (!isNaN(lastNum) && !isNaN(secondToLastNum) && spaceParts.length >= 3) {
              const name = spaceParts.slice(0, secondToLastIndex).join(' ');
              parts = [name, secondToLastNum.toString(), lastNum.toString()];
            } else if (!isNaN(lastNum)) {
              const name = spaceParts.slice(0, lastIndex).join(' ');
              parts = [name, lastNum.toString()];
            }
          }
        }
      }

      let name = '';
      let amount = NaN;
      let pensions = 1;

      if (hasHeaderRow) {
        if (parts.length > Math.max(nameColIndex, amountColIndex)) {
          name = parts[nameColIndex]?.trim().replace(/^"|"$/g, '') || '';
          const rawAmount = parts[amountColIndex]?.trim().replace(/[^\d]/g, '') || '';
          amount = parseInt(rawAmount, 10);

          if (pensionsColIndex !== -1 && parts[pensionsColIndex]) {
            const rawPensions = parts[pensionsColIndex].trim().replace(/[^\d]/g, '');
            const parsedPensions = parseInt(rawPensions, 10);
            if (!isNaN(parsedPensions) && parsedPensions > 0) {
              pensions = parsedPensions;
            }
          }
        }
      } else {
        // No header row
        if (parts.length >= 2) {
          name = parts[0]?.trim() || '';
          if (parts.length >= 3) {
            const val1 = parseInt(parts[1]?.replace(/[^\d]/g, '') || '', 10);
            const val2 = parseInt(parts[2]?.replace(/[^\d]/g, '') || '', 10);
            
            if (!isNaN(val1) && !isNaN(val2)) {
              if (val1 < val2 && val1 < 100) {
                pensions = val1;
                amount = val2;
              } else if (val2 < val1 && val2 < 100) {
                pensions = val2;
                amount = val1;
              } else {
                pensions = val1;
                amount = val2;
              }
            } else if (!isNaN(val1)) {
              amount = val1;
            } else if (!isNaN(val2)) {
              amount = val2;
            }
          } else {
            amount = parseInt(parts[1]?.replace(/[^\d]/g, '') || '', 10);
          }
        }
      }

      if (name && !isNaN(amount)) {
        imported.push({
          id: `${idCounter}-${index}`,
          name,
          amount,
          pensions,
        });
      }
    });

    if (imported.length > 0) {
      onUpdateFunctionaries(imported);
      setBulkInput('');
      setShowBulkModal(false);
    } else {
      alert('Could not parse any valid names and amounts. Please use "Name [Tab] NoOfPensions (optional) [Tab] Amount" format.');
    }
  };

  // CSV File Import Parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      const imported: Functionary[] = [];
      let idCounter = Date.now();

      let nameColIndex = 0;
      let amountColIndex = 1;
      let pensionsColIndex = -1;

      // check if first line is header
      const firstLine = lines[0]?.trim();
      let hasHeaderRow = false;
      if (firstLine) {
        let headers: string[] = [];
        if (firstLine.includes(',')) {
          headers = firstLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        } else if (firstLine.includes(';')) {
          headers = firstLine.split(';');
        } else if (firstLine.includes('\t')) {
          headers = firstLine.split('\t');
        }

        headers = headers.map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
        const hasName = headers.some(h => h.includes('name') || h.includes('staff') || h.includes('employee') || h.includes('member') || h.includes('functionary'));
        const hasAmount = headers.some(h => h.includes('amount') || h.includes('payout') || h.includes('value') || h.includes('salary') || h.includes('pay'));
        const hasPensions = headers.some(h => h.includes('pension'));

        if (hasName || hasAmount || hasPensions) {
          hasHeaderRow = true;
          headers.forEach((h, idx) => {
            if (h.includes('name') || h.includes('staff') || h.includes('employee') || h.includes('member') || h.includes('functionary')) {
              nameColIndex = idx;
            } else if (h.includes('amount') || h.includes('payout') || h.includes('value') || h.includes('salary') || h.includes('pay')) {
              amountColIndex = idx;
            } else if (h.includes('pension')) {
              pensionsColIndex = idx;
            }
          });
        }
      }

      lines.forEach((line, index) => {
        if (index === 0 && hasHeaderRow) return;

        const trimmed = line.trim();
        if (!trimmed) return;

        // Split by common CSV separators (comma, semicolon, tab)
        let parts: string[] = [];
        if (trimmed.includes(',')) {
          parts = trimmed.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        } else if (trimmed.includes(';')) {
          parts = trimmed.split(';');
        } else if (trimmed.includes('\t')) {
          parts = trimmed.split('\t');
        } else {
          const lastSpaceIdx = trimmed.lastIndexOf(' ');
          if (lastSpaceIdx !== -1) {
            parts = [trimmed.substring(0, lastSpaceIdx).trim(), trimmed.substring(lastSpaceIdx).trim()];
          }
        }

        if (parts.length > Math.max(nameColIndex, amountColIndex)) {
          const name = parts[nameColIndex]?.trim().replace(/^"|"$/g, '') || '';
          
          let amount = NaN;
          const rawAmount = parts[amountColIndex]?.trim().replace(/[^\d]/g, '') || '';
          const parsedAmount = parseInt(rawAmount, 10);
          if (!isNaN(parsedAmount)) {
            amount = parsedAmount;
          }

          let pensions = 1;
          if (pensionsColIndex !== -1 && parts[pensionsColIndex]) {
            const rawPensions = parts[pensionsColIndex].trim().replace(/[^\d]/g, '');
            const parsedPensions = parseInt(rawPensions, 10);
            if (!isNaN(parsedPensions) && parsedPensions > 0) {
              pensions = parsedPensions;
            }
          }

          if (name && !isNaN(amount)) {
            imported.push({
              id: `${idCounter}-${index}`,
              name,
              amount,
              pensions,
            });
          }
        }
      });

      if (imported.length > 0) {
        onUpdateFunctionaries(imported);
        e.target.value = '';
      } else {
        alert('Could not parse any valid names and amounts from this file. Please ensure it has at least two columns containing Name and Payout Amount.');
      }
    };
    reader.readAsText(file);
  };

  // Save Current state as Template
  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const newTemplate = {
      name: templateName.trim(),
      date: formatDateDDMMYYYY(),
      list: functionaries,
    };

    const updated = [newTemplate, ...templates.filter(t => t.name !== templateName.trim())].slice(0, 5); // Max 5 templates
    saveTemplatesToStorage(updated);
    setTemplateName('');
    setShowSaveTemplateModal(false);
  };

  const handleLoadTemplate = (tpl: typeof templates[0]) => {
    onUpdateFunctionaries(tpl.list);
  };

  const handleDeleteTemplate = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = templates.filter(t => t.name !== name);
    saveTemplatesToStorage(updated);
  };

  const totalPayout = functionaries.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/40 rounded-2xl p-6 border border-emerald-100 shadow-xs flex flex-col h-full dark:from-slate-900 dark:to-slate-950 dark:border-slate-800" id="functionary-list-card">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shadow-3xs dark:bg-emerald-950/45 dark:text-emerald-450 dark:border dark:border-emerald-900/40">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" id="users-icon" />
          </div>
          <div>
            <h2 className="font-display font-bold text-emerald-950 dark:text-emerald-100 text-base tracking-tight">Functionaries & Payouts</h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Manage monthly staff list & target payout shares</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-200/50 rounded-lg text-xs font-bold text-emerald-800 transition-all cursor-pointer shadow-3xs dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 dark:border-emerald-900/60 dark:text-emerald-300"
            id="csv-import-btn"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100/80 hover:bg-teal-200 border border-teal-200/50 rounded-lg text-xs font-bold text-teal-800 transition-all cursor-pointer shadow-3xs dark:bg-teal-950/40 dark:hover:bg-teal-950/70 dark:border-teal-900/60 dark:text-teal-300"
            id="bulk-import-btn"
          >
            <Upload className="w-3.5 h-3.5 text-teal-600 dark:text-teal-450" />
            Paste Text
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-850 transition-all cursor-pointer shadow-3xs disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-750 dark:text-emerald-300"
            id="save-template-btn"
            disabled={functionaries.length === 0}
          >
            <Save className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-450" />
            Save List
          </button>
        </div>
      </div>

      {/* Templates Row */}
      {templates.length > 0 && (
        <div className="mb-4 bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-3xs dark:bg-slate-800/80 dark:border-slate-700/60" id="templates-container">
          <span className="text-[10px] font-extrabold text-emerald-800/60 dark:text-emerald-400/65 uppercase tracking-widest block mb-2 font-display">
            Saved Lists / Monthly Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <div
                key={tpl.name}
                onClick={() => handleLoadTemplate(tpl)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-800 cursor-pointer transition-all shadow-3xs group dark:bg-slate-900 dark:hover:bg-slate-850 dark:border-slate-800 dark:text-slate-300"
              >
                <span className="font-bold">{tpl.name}</span>
                <span className="text-[10px] text-emerald-500 font-mono font-bold dark:text-emerald-400">({tpl.list.length})</span>
                <button
                  onClick={(e) => handleDeleteTemplate(tpl.name, e)}
                  className="p-0.5 text-emerald-400 hover:text-rose-500 rounded-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick setup row */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-white/80 p-3 rounded-xl border border-emerald-100 shadow-3xs dark:bg-slate-800/85 dark:border-slate-700/60">
        <span className="text-xs text-emerald-950 dark:text-emerald-200 font-bold font-display">
          Total: <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300">{functionaries.length}</span> staff members
        </span>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200 hover:text-emerald-900 rounded-lg border border-emerald-200/50 transition-all cursor-pointer shadow-3xs dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 dark:hover:bg-emerald-900/50"
            id="load-sample-staff-btn"
          >
            <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-450" />
            Load Sample (15 Staff)
          </button>
          
          {showConfirmReset ? (
            <div className="flex items-center gap-1.5 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 dark:bg-rose-950/40 dark:border-rose-900/50 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] font-bold text-rose-700 dark:text-rose-450">Are you sure?</span>
              <button
                onClick={handleClearAll}
                className="px-2 py-0.5 text-[9px] font-black bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer transition-colors"
                id="confirm-reset-btn"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2 py-0.5 text-[9px] font-black bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 rounded cursor-pointer transition-colors dark:bg-slate-750 dark:hover:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                id="cancel-reset-btn"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-2.5 py-1.5 text-[10px] font-bold bg-rose-100/70 text-rose-700 hover:bg-rose-200 hover:text-rose-900 rounded-lg border border-rose-200/50 transition-all cursor-pointer shadow-3xs dark:bg-rose-950/40 dark:text-rose-350 dark:border-rose-900/60 dark:hover:bg-rose-900/50"
              id="clear-staff-btn"
            >
              Reset List
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-y-auto max-h-[380px] min-h-[250px] border border-emerald-100 rounded-xl mb-4 pr-1 bg-white/90 shadow-3xs dark:border-slate-800 dark:bg-slate-900/80">
        {functionaries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-xl dark:bg-slate-900/50" id="empty-staff-box">
            <Users className="w-10 h-10 text-emerald-400/70 dark:text-emerald-500/50 mb-3" />
            <h3 className="font-display font-bold text-emerald-950 dark:text-emerald-100 text-sm mb-1">
              No Functionaries Added
            </h3>
            <p className="text-xs text-emerald-600 dark:text-slate-400 font-medium max-w-xs mb-4">
              Add your staff members one by one, use the sample list, or paste from an spreadsheet.
            </p>
            <button
              onClick={handleAddFunctionary}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <Plus className="w-4 h-4" />
              Add First Functionary
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="staff-table">
            <thead>
              <tr className="bg-emerald-50 text-emerald-900 text-[10px] uppercase font-bold tracking-wider sticky top-0 border-b border-emerald-100/80 z-10 font-display dark:bg-slate-800/90 dark:text-slate-200 dark:border-b dark:border-slate-750">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3 w-32 text-center">No of Pensions</th>
                <th className="py-2.5 px-3 w-40 text-right">Target Payout</th>
                <th className="py-2.5 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50 dark:divide-slate-800/50">
              {functionaries.map((func, index) => (
                <tr key={func.id} className="hover:bg-emerald-50/30 dark:hover:bg-slate-800/40 transition-all" id={`staff-row-${func.id}`}>
                  <td className="py-2 px-4 text-center text-xs font-mono font-bold text-emerald-400 dark:text-slate-500">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={func.name}
                      onChange={e => handleUpdateField(func.id, 'name', e.target.value)}
                      className="w-full bg-transparent hover:bg-white focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-800 px-2 py-1.5 rounded-md border border-transparent focus:border-emerald-300 hover:border-emerald-200 dark:focus:border-emerald-700 dark:hover:border-slate-700 text-xs text-emerald-950 dark:text-white font-bold focus:outline-none transition-all"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      min="1"
                      value={func.pensions || 1}
                      onChange={e => handleUpdateField(func.id, 'pensions', e.target.value)}
                      className="w-20 bg-transparent hover:bg-white focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-800 px-2 py-1.5 rounded-md border border-transparent focus:border-emerald-300 hover:border-emerald-200 dark:focus:border-emerald-700 dark:hover:border-slate-700 text-xs font-mono font-black text-center text-emerald-950 dark:text-white focus:outline-none transition-all mx-auto"
                      placeholder="1"
                      required
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center relative w-full">
                      <span className="absolute left-2.5 text-xs text-emerald-500 dark:text-emerald-400 font-bold select-none font-mono">
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={func.amount || ''}
                        onChange={e => handleUpdateField(func.id, 'amount', e.target.value)}
                        className="w-full bg-transparent hover:bg-white focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-800 pl-7 pr-2.5 py-1.5 rounded-md border border-transparent focus:border-emerald-300 hover:border-emerald-200 dark:focus:border-emerald-700 dark:hover:border-slate-700 text-xs font-mono font-black text-right text-emerald-950 dark:text-white focus:outline-none transition-all"
                        placeholder="0"
                        required
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => handleDelete(func.id)}
                      className="p-1.5 text-emerald-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer list actions */}
      {functionaries.length > 0 && (
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-emerald-100 dark:border-t dark:border-slate-800">
          <button
            onClick={handleAddFunctionary}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer dark:bg-emerald-750 dark:hover:bg-emerald-600"
            id="add-staff-row-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff Member
          </button>
          <div className="text-right">
            <span className="text-[10px] text-emerald-600/70 dark:text-slate-400 font-extrabold block uppercase tracking-widest font-display">Total Target Payouts</span>
            <span className="text-lg font-black font-display text-emerald-950 dark:text-white">
              {formatCurrency(totalPayout, selectedCurrency.symbol)}
            </span>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="bulk-import-modal">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-emerald-100 shadow-xl flex flex-col max-h-[90vh] dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-emerald-950 dark:text-white text-lg">Bulk Copy-Paste Import</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-emerald-400 hover:text-emerald-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-emerald-600 dark:text-slate-400 mb-4 leading-relaxed font-medium">
              Copy rows from an Excel spreadsheet, Google Sheets, or a plain text document, 
              and paste them below. The app will automatically extract names, number of pensions (optional), and payout amounts.
              <br />
              <strong className="text-emerald-900 dark:text-slate-200 font-bold">Format:</strong> One line per person: <code>Name [Tab/Space] NoOfPensions (optional) [Tab/Space] PayoutAmount</code>
            </p>
            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              className="w-full flex-1 min-h-[200px] bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs font-mono focus:outline-none focus:border-emerald-500 text-emerald-950 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 dark:focus:border-emerald-700"
              placeholder={`Arjun Sharma\t12500\nPriya Patel\t2\t8400\nRajesh Kumar\t15000`}
              id="bulk-text-area"
            />
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-100 transition-all cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-3xs cursor-pointer dark:bg-emerald-700 dark:hover:bg-emerald-600"
                id="bulk-submit-btn"
              >
                Parse & Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="save-template-modal">
          <form onSubmit={handleSaveAsTemplate} className="bg-white rounded-2xl p-6 max-w-sm w-full border border-emerald-100 shadow-xl dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
            <h3 className="font-display font-extrabold text-emerald-950 dark:text-white text-lg mb-2">Save Staff Template</h3>
            <p className="text-xs text-emerald-600 dark:text-slate-400 font-medium mb-4">
              Save this group of functionaries (names & payout shares) so you can reload them next month.
            </p>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. July 2026 Shift A"
              className="w-full px-3 py-2.5 border border-emerald-100 rounded-lg text-sm font-bold focus:outline-none focus:border-emerald-500 mb-4 text-emerald-950 bg-emerald-50/20 dark:border-slate-800 dark:text-white dark:bg-slate-950 dark:focus:border-emerald-700"
              required
              id="template-name-input"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-100 cursor-pointer dark:text-slate-300 dark:hover:bg-slate-800 dark:border-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer dark:bg-emerald-700 dark:hover:bg-emerald-600"
                id="template-submit-btn"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
