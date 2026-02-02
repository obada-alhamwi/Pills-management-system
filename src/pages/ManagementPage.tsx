import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';

export default function ManagementPage() {
  const processes = useQuery(api.processes.getAll) || [];
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'preparing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'out_for_delivery': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'in_transit': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Management View" />
      
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[17.5%]">Substance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[17.5%]">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Final Amt/Pkg</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Pills</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Final Amt/Pill</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Box Number</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Image</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {processes.map((process) => (
                  <tr key={process._id} className={process.urgent ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}>
                    <td className="px-4 py-2 text-center text-gray-900 dark:text-white">{process.rowNumber}</td>
                    <td className="px-4 py-2">
                      <input type="text" value={process.substance} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={process.name} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(process.finalAmountPackage)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(process.pillsSy)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(process.finalAmountPill)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
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
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(process.status)}`}>
                        {process.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processes.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No management data available yet.
            </div>
          )}
        </div>
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
