import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Save, Upload, RefreshCw, X } from 'lucide-react';
import { Currency, Functionary } from '../types';
import { formatCurrency, getSampleFunctionaries } from '../utils';

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
      { id: newId, name: `Functionary ${newId}`, amount: 0 },
    ]);
  };

  const handleUpdateField = (id: string, field: 'name' | 'amount', value: string) => {
    onUpdateFunctionaries(
      functionaries.map(f => {
        if (f.id === id) {
          if (field === 'amount') {
            const val = parseInt(value, 10);
            return { ...f, amount: isNaN(val) || val < 0 ? 0 : val };
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
  };

  const handleLoadSample = () => {
    onUpdateFunctionaries(getSampleFunctionaries());
  };

  // Bulk paste parser
  const handleBulkImport = () => {
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split('\n');
    const imported: Functionary[] = [];
    let idCounter = 1;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Try split by tabs, multiple spaces, or commas
      let parts = trimmed.split(/\t/);
      if (parts.length < 2) {
        parts = trimmed.split(/ {2,}/); // split by multiple spaces
      }
      if (parts.length < 2) {
        // Try split by last space (name amount)
        const lastSpaceIdx = trimmed.lastIndexOf(' ');
        if (lastSpaceIdx !== -1) {
          parts = [trimmed.substring(0, lastSpaceIdx).trim(), trimmed.substring(lastSpaceIdx).trim()];
        }
      }

      if (parts.length >= 2) {
        const name = parts[0].trim();
        // Extract numeric part
        const cleanAmountStr = parts[1].replace(/[^\d]/g, '');
        const amount = parseInt(cleanAmountStr, 10);
        if (name && !isNaN(amount)) {
          imported.push({
            id: idCounter.toString(),
            name,
            amount,
          });
          idCounter++;
        }
      }
    });

    if (imported.length > 0) {
      onUpdateFunctionaries(imported);
      setBulkInput('');
      setShowBulkModal(false);
    } else {
      alert('Could not parse any valid names and amounts. Please use "Name [Tab] Amount" format.');
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

      lines.forEach((line, index) => {
        // Skip header row if it contains descriptive words
        const isHeader = index === 0 && (
          line.toLowerCase().includes('name') || 
          line.toLowerCase().includes('payout') || 
          line.toLowerCase().includes('amount') || 
          line.toLowerCase().includes('staff')
        );
        if (isHeader) return;

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

        if (parts.length >= 2) {
          const name = parts[0].trim().replace(/^"|"$/g, '');
          let amount = NaN;

          for (let i = 1; i < parts.length; i++) {
            const cleanStr = parts[i].trim().replace(/[^\d]/g, '');
            const parsed = parseInt(cleanStr, 10);
            if (!isNaN(parsed)) {
              amount = parsed;
              break;
            }
          }

          if (name && !isNaN(amount)) {
            imported.push({
              id: `${idCounter}-${index}`,
              name,
              amount,
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
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
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
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col h-full" id="functionary-list-card">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" id="users-icon" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-gray-900 text-lg">Functionaries & Payouts</h2>
            <p className="text-xs text-gray-500">Manage monthly staff list & target payout shares</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer"
            id="csv-import-btn"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 transition-all cursor-pointer"
            id="bulk-import-btn"
          >
            <Upload className="w-3.5 h-3.5 text-gray-400" />
            Paste Text
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 transition-all cursor-pointer"
            id="save-template-btn"
            disabled={functionaries.length === 0}
          >
            <Save className="w-3.5 h-3.5" />
            Save List
          </button>
        </div>
      </div>

      {/* Templates Row */}
      {templates.length > 0 && (
        <div className="mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-200" id="templates-container">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Saved Lists / Monthly Templates:
          </span>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <div
                key={tpl.name}
                onClick={() => handleLoadTemplate(tpl)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-indigo-50/40 border border-gray-200 hover:border-indigo-200 rounded-lg text-xs text-gray-700 cursor-pointer transition-all shadow-xs group"
              >
                <span className="font-semibold">{tpl.name}</span>
                <span className="text-[10px] text-gray-400">({tpl.list.length})</span>
                <button
                  onClick={(e) => handleDeleteTemplate(tpl.name, e)}
                  className="p-0.5 text-gray-400 hover:text-rose-500 rounded-md transition-all opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick setup row */}
      <div className="flex items-center justify-between gap-2 mb-4 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/30">
        <span className="text-xs text-gray-600 font-medium">
          Total: <span className="font-bold text-gray-900">{functionaries.length}</span> staff members
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-100 transition-all cursor-pointer"
            id="load-sample-staff-btn"
          >
            <RefreshCw className="w-3 h-3" />
            Load Sample List (15 Staff)
          </button>
          <button
            onClick={handleClearAll}
            className="px-2.5 py-1 text-[10px] font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md border border-rose-100 transition-all cursor-pointer"
            id="clear-staff-btn"
          >
            Reset List
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-y-auto max-h-[380px] min-h-[250px] border border-gray-200 rounded-xl mb-4 pr-1">
        {functionaries.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50/30 rounded-xl" id="empty-staff-box">
            <Users className="w-10 h-10 text-gray-300 mb-3" />
            <h3 className="font-display font-semibold text-gray-600 text-sm mb-1">
              No Functionaries Added
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mb-4">
              Add your staff members one by one, use the sample list, or paste from an spreadsheet.
            </p>
            <button
              onClick={handleAddFunctionary}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Functionary
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse" id="staff-table">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider sticky top-0 border-b border-gray-200 z-10">
                <th className="py-2.5 px-4 w-12 text-center">#</th>
                <th className="py-2.5 px-3">Full Name</th>
                <th className="py-2.5 px-3 w-40 text-right">Target Payout</th>
                <th className="py-2.5 px-4 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {functionaries.map((func, index) => (
                <tr key={func.id} className="hover:bg-gray-50/50 transition-all" id={`staff-row-${func.id}`}>
                  <td className="py-2 px-4 text-center text-xs font-mono font-bold text-gray-400">
                    {index + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={func.name}
                      onChange={e => handleUpdateField(func.id, 'name', e.target.value)}
                      className="w-full bg-transparent hover:bg-white focus:bg-white px-2 py-1.5 rounded-md border border-transparent focus:border-indigo-300 hover:border-gray-200 text-xs text-gray-800 font-medium focus:outline-none transition-all"
                      placeholder="e.g. John Doe"
                      required
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex items-center relative w-full">
                      <span className="absolute left-2.5 text-xs text-gray-400 font-medium select-none">
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={func.amount || ''}
                        onChange={e => handleUpdateField(func.id, 'amount', e.target.value)}
                        className="w-full bg-transparent hover:bg-white focus:bg-white pl-7 pr-2.5 py-1.5 rounded-md border border-transparent focus:border-indigo-300 hover:border-gray-200 text-xs font-mono font-bold text-right text-gray-800 focus:outline-none transition-all"
                        placeholder="0"
                        required
                      />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button
                      onClick={() => handleDelete(func.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
          <button
            onClick={handleAddFunctionary}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm cursor-pointer"
            id="add-staff-row-btn"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff Member
          </button>
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-semibold block uppercase">Total Target Payouts</span>
            <span className="text-lg font-bold font-display text-gray-900">
              {formatCurrency(totalPayout, selectedCurrency.symbol)}
            </span>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="bulk-import-modal">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900 text-lg">Bulk Copy-Paste Import</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Copy rows from an Excel spreadsheet, Google Sheets, or a plain text document, 
              and paste them below. The app will automatically extract names and payouts.
              <br />
              <strong className="text-gray-700">Format:</strong> One line per person: <code>Name [Tab or Space] PayoutAmount</code>
            </p>
            <textarea
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              className="w-full flex-1 min-h-[200px] bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
              placeholder={`Arjun Sharma\t12500\nPriya Patel\t8400\nRajesh Kumar\t15000`}
              id="bulk-text-area"
            />
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="save-template-modal">
          <form onSubmit={handleSaveAsTemplate} className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-xl">
            <h3 className="font-display font-semibold text-gray-900 text-lg mb-2">Save Staff Template</h3>
            <p className="text-xs text-gray-500 mb-4">
              Save this group of functionaries (names & payout shares) so you can reload them next month.
            </p>
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. July 2026 Shift A"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:border-indigo-500 mb-4"
              required
              id="template-name-input"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
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
