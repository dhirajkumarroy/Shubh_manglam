import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ChevronRight,
  Layers,
  Tag,
  Calendar,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  downloadSmartImportTemplate, 
  parseExcelFile, 
  ParsedImportData 
} from '../utils/excelTemplate';
import { adminCategoryService } from '../services/category.service';

interface SmartExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultTab?: 'categories' | 'subcategories' | 'celebrations';
}

export const SmartExcelImportModal: React.FC<SmartExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultTab = 'categories',
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'categories' | 'subcategories' | 'celebrations'>(defaultTab);

  // Import options
  const [importMode, setImportMode] = useState<'UPSERT' | 'CREATE_ONLY'>('UPSERT');
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setError(null);
    setImportResult(null);

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Please upload a valid Excel spreadsheet (.xlsx, .xls) or CSV file.');
      return;
    }

    try {
      setSelectedFile(file);
      setParsing(true);
      const data = await parseExcelFile(file);
      setParsedData(data);

      // Auto switch to tab that has data
      if (data.categories.length > 0) setActivePreviewTab('categories');
      else if (data.subcategories.length > 0) setActivePreviewTab('subcategories');
      else if (data.celebrations.length > 0) setActivePreviewTab('celebrations');
    } catch (err: any) {
      setError(err.message || 'Failed to parse Excel file. Please ensure it follows the template format.');
      setSelectedFile(null);
      setParsedData(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleExecuteImport = async () => {
    if (!parsedData) return;
    setError(null);
    setImporting(true);

    try {
      const res = await adminCategoryService.bulkSmartImport({
        mode: importMode,
        categories: parsedData.categories,
        subcategories: parsedData.subcategories,
        celebrations: parsedData.celebrations,
      });

      setImportResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Import execution failed. Please check your data and try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalDetected = (parsedData?.categories.length || 0) + 
                        (parsedData?.subcategories.length || 0) + 
                        (parsedData?.celebrations.length || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E7E0D8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E7E0D8] bg-gradient-to-r from-[#FAF8F5] via-white to-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#881337] to-[#E65100] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-[#1C1917] tracking-tight">
                  Smart Excel Importer
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#92400E] text-[10px] font-extrabold uppercase">
                  Batch Sync
                </span>
              </div>
              <p className="text-xs text-[#78716C]">
                Upload Categories, Subcategories, and Celebrations from a multi-sheet spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#78716C] hover:text-[#1C1917] hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Import Error</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {importResult && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2 font-extrabold text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Smart Import Successfully Executed!</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-xs text-stone-500 font-medium">Categories</div>
                  <div className="text-lg font-black text-emerald-700">
                    +{importResult.summary.categoriesCreated} <span className="text-xs font-normal text-stone-400">({importResult.summary.categoriesUpdated} updated)</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-xs text-stone-500 font-medium">Subcategories</div>
                  <div className="text-lg font-black text-emerald-700">
                    +{importResult.summary.subcategoriesCreated} <span className="text-xs font-normal text-stone-400">({importResult.summary.subcategoriesUpdated} updated)</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-xs text-stone-500 font-medium">Celebrations</div>
                  <div className="text-lg font-black text-emerald-700">
                    +{importResult.summary.celebrationsCreated} <span className="text-xs font-normal text-stone-400">({importResult.summary.celebrationsUpdated} updated)</span>
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-sm text-center">
                  <div className="text-xs text-stone-500 font-medium">Mappings Linked</div>
                  <div className="text-lg font-black text-emerald-700">
                    {importResult.summary.mappingsCreated}
                  </div>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  <p className="font-bold mb-1">⚠️ {importResult.errors.length} rows were skipped due to issues:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {importResult.errors.map((err: any, idx: number) => (
                      <li key={idx}>
                        <span className="font-semibold">[{err.sheet}] {err.item}:</span> {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Upload Zone & Template Download */}
          {!parsedData ? (
            <div className="space-y-4">
              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-200 text-[#92400E] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1C1917]">Need the Excel Format?</h4>
                    <p className="text-[11px] text-[#78716C]">
                      Download our pre-styled template with Categories, Subcategories, and Celebrations sheets.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadSmartImportTemplate}
                  className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template (.xlsx)</span>
                </button>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-[#881337] bg-rose-50/50 scale-[0.99]'
                    : 'border-[#D6D3D1] bg-[#FAF8F5] hover:bg-stone-50 hover:border-[#881337]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white shadow-md border border-[#E7E0D8] flex items-center justify-center text-[#881337]">
                  {parsing ? (
                    <Loader2 className="w-7 h-7 animate-spin text-[#881337]" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-[#1C1917] mb-1">
                  {parsing ? 'Reading and parsing workbook...' : 'Click to upload or drag & drop spreadsheet'}
                </h4>
                <p className="text-xs text-[#78716C] max-w-sm mx-auto">
                  Supports Microsoft Excel (<span className="font-semibold text-stone-700">.xlsx, .xls</span>) or CSV files up to 10MB.
                </p>
              </div>
            </div>
          ) : (
            /* STEP 2: Live Preview & Inspection */
            <div className="space-y-5">
              {/* File Info & Stats Row */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E0D8] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1C1917]">{selectedFile?.name}</p>
                    <p className="text-[11px] text-[#78716C]">
                      {totalDetected} total rows ready for import
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode Selector */}
                  <div className="flex items-center bg-white border border-[#D6D3D1] rounded-lg p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setImportMode('UPSERT')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        importMode === 'UPSERT'
                          ? 'bg-[#881337] text-white shadow-sm'
                          : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                    >
                      Update Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('CREATE_ONLY')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        importMode === 'CREATE_ONLY'
                          ? 'bg-[#881337] text-white shadow-sm'
                          : 'text-[#78716C] hover:text-[#1C1917]'
                      }`}
                    >
                      Create Only
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-[#78716C] hover:text-[#1C1917] hover:underline"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActivePreviewTab('categories')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activePreviewTab === 'categories'
                      ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-200'
                      : 'bg-white border-[#E7E0D8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#D97706]" /> Categories
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#1C1917] mt-1">
                    {parsedData.categories.length}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab('subcategories')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activePreviewTab === 'subcategories'
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                      : 'bg-white border-[#E7E0D8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#881337]" /> Subcategories
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#1C1917] mt-1">
                    {parsedData.subcategories.length}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewTab('celebrations')}
                  className={`p-3 rounded-xl border text-left transition ${
                    activePreviewTab === 'celebrations'
                      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200'
                      : 'bg-white border-[#E7E0D8] hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-[#78716C]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#E65100]" /> Celebrations
                    </span>
                  </div>
                  <div className="text-xl font-black text-[#1C1917] mt-1">
                    {parsedData.celebrations.length}
                  </div>
                </button>
              </div>

              {/* Data Preview Table */}
              <div className="border border-[#E7E0D8] rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="max-h-60 overflow-y-auto">
                  {activePreviewTab === 'categories' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-[#78716C] uppercase font-bold sticky top-0 border-b border-[#E7E0D8]">
                        <tr>
                          <th className="py-2.5 px-3">Icon</th>
                          <th className="py-2.5 px-3">Category Name</th>
                          <th className="py-2.5 px-3">Slug</th>
                          <th className="py-2.5 px-3">Description</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {parsedData.categories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-stone-400">
                              No categories found in this sheet.
                            </td>
                          </tr>
                        ) : (
                          parsedData.categories.map((c, idx) => (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className="py-2 px-3 text-base">{c.icon || '🎪'}</td>
                              <td className="py-2 px-3 font-bold text-[#1C1917]">{c.name}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-stone-500">{c.slug || '(auto)'}</td>
                              <td className="py-2 px-3 text-stone-600 truncate max-w-xs">{c.description || '-'}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                                  {c.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'subcategories' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-[#78716C] uppercase font-bold sticky top-0 border-b border-[#E7E0D8]">
                        <tr>
                          <th className="py-2.5 px-3">Parent Category</th>
                          <th className="py-2.5 px-3">Icon</th>
                          <th className="py-2.5 px-3">Subcategory Name</th>
                          <th className="py-2.5 px-3">Slug</th>
                          <th className="py-2.5 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {parsedData.subcategories.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-stone-400">
                              No subcategories found in this sheet.
                            </td>
                          </tr>
                        ) : (
                          parsedData.subcategories.map((s, idx) => (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className="py-2 px-3 font-semibold text-[#881337]">{s.parentCategoryName}</td>
                              <td className="py-2 px-3 text-base">{s.icon || '📂'}</td>
                              <td className="py-2 px-3 font-bold text-[#1C1917]">{s.name}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-stone-500">{s.slug || '(auto)'}</td>
                              <td className="py-2 px-3 text-stone-600 truncate max-w-xs">{s.description || '-'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}

                  {activePreviewTab === 'celebrations' && (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] text-[#78716C] uppercase font-bold sticky top-0 border-b border-[#E7E0D8]">
                        <tr>
                          <th className="py-2.5 px-3">Icon</th>
                          <th className="py-2.5 px-3">Celebration Type</th>
                          <th className="py-2.5 px-3">Slug</th>
                          <th className="py-2.5 px-3">Mapped Categories</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {parsedData.celebrations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-stone-400">
                              No celebrations found in this sheet.
                            </td>
                          </tr>
                        ) : (
                          parsedData.celebrations.map((e, idx) => (
                            <tr key={idx} className="hover:bg-stone-50">
                              <td className="py-2 px-3 text-base">{e.icon || '🎉'}</td>
                              <td className="py-2 px-3 font-bold text-[#1C1917]">{e.name}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-stone-500">{e.slug || '(auto)'}</td>
                              <td className="py-2 px-3">
                                {e.mappedCategoryNames && e.mappedCategoryNames.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {e.mappedCategoryNames.map((m, mIdx) => (
                                      <span key={mIdx} className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-medium">
                                        {m}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-stone-400 italic">None</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E7E0D8] bg-[#FAF8F5] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[#D6D3D1] bg-white text-xs font-bold text-[#57534E] hover:bg-stone-50 transition"
          >
            {importResult ? 'Close' : 'Cancel'}
          </button>

          {parsedData && !importResult && (
            <button
              type="button"
              disabled={importing || totalDetected === 0}
              onClick={handleExecuteImport}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#881337] via-[#9F1239] to-[#E65100] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Batch Import...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import {totalDetected} Records to Database</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartExcelImportModal;
