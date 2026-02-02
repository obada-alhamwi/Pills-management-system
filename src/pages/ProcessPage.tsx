import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';
import { toast } from 'sonner';

type Status = 'ordered' | 'preparing' | 'out_for_delivery' | 'in_transit';

interface Process {
  _id: string;
  rowNumber: number;
  substance: string;
  name: string;
  finalAmountPackage: number;
  pillsSy: number;
  finalAmountPill: number;
  boxNumber: string;
  imageUrl: string;
  status: Status;
  urgent: boolean;
}

export default function ProcessPage() {
  const processes = useQuery(api.processes.getAll) || [];
  const updateProcess = useMutation(api.processes.update);
  const deleteAllProcesses = useMutation(api.processes.deleteAllToLastOrder);

  const [rows, setRows] = useState<Process[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    setRows(processes as Process[]);
  }, [processes]);

  const updateRow = (index: number, field: keyof Process, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const saveChanges = async (index: number, updates?: Partial<Process>) => {
    const row = rows[index];
    const dataToSave = updates ? { ...row, ...updates } : row;

    try {
      await updateProcess({
        id: row._id as any,
        boxNumber: dataToSave.boxNumber,
        status: dataToSave.status,
      });
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm('Move all process data to Last Order and delete from previous pages?')) return;

    if (processes.length === 0) {
      toast.error('No process data to move.');
      return;
    }

    const loadingToast = toast.loading('Moving data to Last Order...');
    try {
      await deleteAllProcesses({});
      toast.dismiss(loadingToast);
      toast.success('All process data moved to Last Order and cleared from previous pages.');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to move data to Last Order');
    }
  };

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Process Tracking" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-t-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">No.</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">substance</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Name</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Final Amount Per Package</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[6%]">Num of<br />Pills</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Final Amount Per Pill</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Box Number</th>
                  <th rowSpan={2} className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Image</th>
                  <th colSpan={4} className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[22%]">Status</th>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Ordered</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Preparing</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Out for Delivery</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">In Transit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {rows.map((row, index) => (
                  <tr key={row._id} className={row.urgent ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}>
                    <td className="px-4 py-2 text-center text-gray-900 dark:text-white">{row.rowNumber}</td>
                    <td className="px-4 py-2">
                      <input type="text" value={row.substance} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={row.name} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.finalAmountPackage)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.pillsSy)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.finalAmountPill)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={row.boxNumber}
                        onChange={(e) => updateRow(index, 'boxNumber', e.target.value)}
                        onBlur={() => saveChanges(index)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {row.imageUrl && (
                        <img 
                          src={row.imageUrl} 
                          alt="" 
                          className="w-full h-10 object-cover mx-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setPreviewImage(row.imageUrl)}
                        />
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="radio"
                        name={`status-${row._id}`}
                        checked={row.status === 'ordered'}
                        onChange={() => {
                          updateRow(index, 'status', 'ordered');
                          saveChanges(index, { status: 'ordered' });
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="radio"
                        name={`status-${row._id}`}
                        checked={row.status === 'preparing'}
                        onChange={() => {
                          updateRow(index, 'status', 'preparing');
                          saveChanges(index, { status: 'preparing' });
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="radio"
                        name={`status-${row._id}`}
                        checked={row.status === 'out_for_delivery'}
                        onChange={() => {
                          updateRow(index, 'status', 'out_for_delivery');
                          saveChanges(index, { status: 'out_for_delivery' });
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="radio"
                        name={`status-${row._id}`}
                        checked={row.status === 'in_transit'}
                        onChange={() => {
                          updateRow(index, 'status', 'in_transit');
                          saveChanges(index, { status: 'in_transit' });
                        }}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No processes yet. Please confirm orders in Damas page first.
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 rounded-b-xl">
            <button
              onClick={handleDeleteOrder}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Order
            </button>
          </div>
        )}
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
