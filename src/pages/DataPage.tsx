import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface RowData {
  _id?: Id<"pills">;
  substance: string;
  name: string;
  company: string;
  pillsBl: number | string;
  pillsSy: number | string;
  price: number | string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string | null;
  imageFile?: File;
  isNew?: boolean;
}

export default function DataPage() {
  const pills = useQuery(api.pills.getAll) || [];
  const bulkSavePills = useMutation(api.pills.bulkSaveWithCheck);
  const removePill = useMutation(api.pills.remove);
  const clearAllPills = useMutation(api.pills.clearAll);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [rows, setRows] = useState<RowData[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // Load data from Convex into local state
  useEffect(() => {
    if (pills.length > 0) {
      setRows(pills.map(p => ({ 
        _id: p._id,
        substance: p.substance,
        name: p.name,
        company: p.company,
        pillsBl: p.pillsBl,
        pillsSy: p.pillsSy,
        price: p.price,
        imageStorageId: p.imageStorageId,
        imageUrl: p.imageUrl,
        isNew: false 
      })));
    } else {
      // Add one empty row if no data
      setRows([{ 
        substance: '',
        name: '',
        company: '',
        pillsBl: '',
        pillsSy: '',
        price: '',
        isNew: true 
      }]);
    }
  }, [pills]);

  const addRow = () => {
    setRows([...rows, { 
      substance: '',
      name: '',
      company: '',
      pillsBl: '',
      pillsSy: '',
      price: '',
      isNew: true 
    }]);
    toast.info('New row added');
  };

  const updateRow = (index: number, field: keyof RowData, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value, isNew: false };
    setRows(updated);
  };

  const handleImageUpload = async (index: number, file: File | null) => {
    if (!file) return;

    const loadingToast = toast.loading('Uploading image...');
    
    try {
      // Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();
      
      // Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!result.ok) {
        throw new Error('Upload failed');
      }
      
      const { storageId } = await result.json();
      
      // Update row with storage ID
      const updated = [...rows];
      updated[index] = { 
        ...updated[index], 
        imageStorageId: storageId,
        imageFile: file,
        isNew: false 
      };
      setRows(updated);
      
      toast.dismiss(loadingToast);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload image');
    }
  };

  const getImageUrl = (row: RowData): string | null => {
    if (row.imageFile) {
      return URL.createObjectURL(row.imageFile);
    }
    if (row.imageUrl) {
      return row.imageUrl;
    }
    return null;
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    if (row._id) {
      const loadingToast = toast.loading('Deleting row...');
      try {
        await removePill({ id: row._id });
        toast.dismiss(loadingToast);
        toast.success('Row deleted successfully');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete row: ' + (error as Error).message);
        return;
      }
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  // OPTIMIZED: Bulk save all rows in a single mutation
  const saveData = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading('Saving data...');

    try {
      // Collect all rows with substance
      const pillsToSave = rows
        .filter(row => row.substance?.trim())
        .map(row => ({
          substance: row.substance.trim(),
          name: row.name || '',
          company: row.company || '',
          pillsBl: Number(row.pillsBl) || 0,
          pillsSy: Number(row.pillsSy) || 0,
          price: Number(row.price) || 0,
          imageStorageId: row.imageStorageId as Id<"_storage"> | undefined,
          currentRowId: row._id as Id<"pills"> | undefined,
        }));

      if (pillsToSave.length === 0) {
        toast.dismiss(loadingToast);
        toast.warning('No data to save. Please fill in at least one substance.');
        setIsSaving(false);
        return;
      }

      // Save all in one bulk mutation (MUCH FASTER)
      const result = await bulkSavePills({ pills: pillsToSave });
      
      toast.dismiss(loadingToast);

      // Show appropriate messages based on summary
      const { summary } = result;
      
      if (summary.created > 0) {
        toast.success(`Successfully created ${summary.created} new row(s)`);
      }
      if (summary.updated > 0) {
        toast.success(`Successfully updated ${summary.updated} existing row(s)`);
      }
      if (summary.duplicates > 0) {
        toast.error(
          `Found ${summary.duplicates} duplicate substance(s): ${summary.duplicateSubstances.join(', ')}. Substance must be unique.`,
          { duration: 5000 }
        );
      }
      if (summary.created === 0 && summary.updated === 0 && summary.duplicates === 0) {
        toast.warning('No data to save. Please fill in at least one substance.');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Failed to save data: ' + (err as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to clear all data? This will delete all images too and cannot be undone.')) {
      const loadingToast = toast.loading('Clearing all data...');
      try {
        await clearAllPills();
        setRows([{ 
          substance: '',
          name: '',
          company: '',
          pillsBl: '',
          pillsSy: '',
          price: '',
          isNew: true 
        }]);
        toast.dismiss(loadingToast);
        toast.success('All data and images cleared');
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error('Failed to clear data');
      }
    }
  };

  const importExcel = () => {
    fileInputRef.current?.click();
  };

  const processExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingToast = toast.loading('Importing Excel file...');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const arr = new Uint8Array(data as ArrayBuffer);
        const workbook = XLSX.read(arr, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          toast.dismiss(loadingToast);
          toast.error('Excel file is empty or invalid');
          return;
        }

        const headers = jsonData[0].map(h => String(h).trim().toLowerCase().replace(/\s+/g, ''));
        const pillsToImport = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          // Try different column name variations
          const substanceIdx = headers.findIndex(h => h.includes('substance') || h === 'sub_d');
          const nameIdx = headers.findIndex(h => h.includes('name'));
          const companyIdx = headers.findIndex(h => h.includes('company') || h === 'com');
          const pillsBlIdx = headers.findIndex(h => h.includes('pillsbl') || h.includes('num_pill_lb'));
          const pillsSyIdx = headers.findIndex(h => h.includes('pillssy') || h.includes('num_pill_sy'));
          const priceIdx = headers.findIndex(h => h.includes('price'));

          const substance = String(row[substanceIdx >= 0 ? substanceIdx : 0] || '').trim();
          if (!substance) continue;

          pillsToImport.push({
            substance,
            name: String(row[nameIdx >= 0 ? nameIdx : 1] || ''),
            company: String(row[companyIdx >= 0 ? companyIdx : 2] || ''),
            pillsBl: parseFloat(String(row[pillsBlIdx >= 0 ? pillsBlIdx : 3] || '0').replace(/,/g, '')) || 0,
            pillsSy: parseFloat(String(row[pillsSyIdx >= 0 ? pillsSyIdx : 4] || '0').replace(/,/g, '')) || 0,
            price: parseFloat(String(row[priceIdx >= 0 ? priceIdx : 5] || '0').replace(/,/g, '')) || 0,
          });
        }

        if (pillsToImport.length > 0) {
          await bulkSavePills({ pills: pillsToImport });
          toast.dismiss(loadingToast);
          toast.success(`Imported ${pillsToImport.length} rows successfully!`);
        } else {
          toast.dismiss(loadingToast);
          toast.info('No valid data found to import');
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error('Failed to import Excel file: ' + (err as Error).message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const exportExcel = () => {
    const exportData = rows
      .filter(row => row.substance?.trim())
      .map(row => ({
        substance: row.substance,
        name: row.name || '',
        company: row.company || '',
        pillsBl: Number(row.pillsBl) || 0,
        pillsSy: Number(row.pillsSy) || 0,
        price: Number(row.price) || 0,
      }));

    if (exportData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pills');
    XLSX.writeFile(wb, 'pills_export.xlsx');
    toast.success(`Exported ${exportData.length} rows successfully!`);
  };

  const formatNumber = (num: number | string) => {
    if (!num || num === '') return '';
    const n = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(n)) return '';
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Data Management" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[18%]">Substance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[18%]">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[16%]">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Pills BL</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Pills SY</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Image</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {rows.map((row, index) => {
                  const imageUrl = getImageUrl(row);
                  return (
                    <tr key={row._id || `row-${index}`} className={row.isNew ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.substance}
                          onChange={(e) => updateRow(index, 'substance', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter substance"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) => updateRow(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter name"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={row.company}
                          onChange={(e) => updateRow(index, 'company', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formatNumber(row.pillsBl)}
                          onChange={(e) => updateRow(index, 'pillsBl', e.target.value.replace(/,/g, ''))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formatNumber(row.pillsSy)}
                          onChange={(e) => updateRow(index, 'pillsSy', e.target.value.replace(/,/g, ''))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={formatNumber(row.price)}
                          onChange={(e) => updateRow(index, 'price', e.target.value.replace(/,/g, ''))}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {(imageUrl || row.imageUrl) && (
                            <img 
                              src={imageUrl || row.imageUrl || ''} 
                              alt="" 
                              className="w-full h-10 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImage(imageUrl || row.imageUrl || null)}
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            ref={el => { imageInputRefs.current[index] = el; }}
                            onChange={(e) => handleImageUpload(index, e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <button
                            onClick={() => imageInputRefs.current[index]?.click()}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                          >
                            {(imageUrl || row.imageStorageId) ? 'Update' : 'Upload'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => deleteRow(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                          title="Delete row"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700">
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
            <button
              onClick={saveData}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
            <button
              onClick={importExcel}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={processExcel}
              className="hidden"
            />
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
