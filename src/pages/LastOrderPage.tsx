import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function LastOrderPage() {
  const bundles = useQuery(api.lastOrders.getAll) || [];
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const exportLastOrder = () => {
    if (bundles.length === 0) {
      toast.error('No data to export');
      return;
    }

    const latestBundle = bundles[0];
    const exportData = latestBundle.processes.map((process: any) => {
      const damas = latestBundle.damasOrders.find((d: any) => d._id === process.damasOrderId);

      return {
        no: process.rowNumber,
        substance: process.substance,
        name: process.name,
        final_amount_package: damas?.finalAmountPackage ?? 0,
        num_pill_sy: process.pillsSy ?? 0,
        final_amount_pill: damas?.finalAmountPill ?? 0,
        box_num: process.boxNumber,
        status: process.status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Last Order');

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    XLSX.writeFile(wb, `Order_${dateStr}.xlsx`);
    toast.success('Exported to Excel successfully!');
  };

  const latestBundle = bundles[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Last Order" />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">substance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Final Amount Per Package</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Num of<br />Pills</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Final Amount Per Pill</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Box Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Image</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {latestBundle?.processes?.map((process: any) => {
                  const damas = latestBundle.damasOrders.find((d: any) => d._id === process.damasOrderId);
                  return (
                    <tr key={process._id} className={process.urgent ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}>
                      <td className="px-4 py-2 text-center text-gray-900 dark:text-white">{process.rowNumber}</td>
                      <td className="px-4 py-2">
                        <input type="text" value={process.substance} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={process.name} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(damas?.finalAmountPackage ?? 0)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(process.pillsSy ?? 0)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(damas?.finalAmountPill ?? 0)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={process.boxNumber} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {process.imageUrl && (
                          <img 
                            src={process.imageUrl} 
                            alt="" 
                            className="w-full h-10 object-cover mx-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewImage(process.imageUrl)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input type="text" value={process.status?.replace(/_/g, ' ') || ''} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {(!latestBundle || !latestBundle.processes || latestBundle.processes.length === 0) && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No last order data available yet. Complete and delete a process to see it here.
            </div>
          )}

          {latestBundle && latestBundle.processes && latestBundle.processes.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700">
              <button
                onClick={exportLastOrder}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          )}
        </div>
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
