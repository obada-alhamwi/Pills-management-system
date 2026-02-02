import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';
import { toast } from 'sonner';

interface DamasOrder {
  _id: string;
  rowNumber: number;
  substance: string;
  name: string;
  company: string;
  quantityOrder: number;
  finalOrder: number;
  price: number;
  totalPrice: number;
  bonus: number;
  pillsSy: number;
  finalAmountPackage: number;
  finalAmountPill: number;
  imageUrl: string;
  confirmed: boolean;
  urgent: boolean;
}

export default function DamasPage() {
  const damasOrders = useQuery(api.damas.getAll) || [];
  const updateDamas = useMutation(api.damas.update);
  const confirmDamas = useMutation(api.damas.confirm);

  const [rows, setRows] = useState<DamasOrder[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    setRows(damasOrders as DamasOrder[]);
  }, [damasOrders]);

  const updateRow = (index: number, field: 'finalOrder' | 'bonus', value: number) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate totals
    const row = updated[index];
    const finalAmountPackage = (row.finalOrder || 0) + (row.bonus || 0);
    const finalAmountPill = row.pillsSy > 0 ? finalAmountPackage * row.pillsSy : 0;
    const totalPrice = (row.finalOrder || 0) * row.price;

    updated[index].finalAmountPackage = finalAmountPackage;
    updated[index].finalAmountPill = finalAmountPill;
    updated[index].totalPrice = totalPrice;

    setRows(updated);
  };

  const saveChanges = async (index: number) => {
    const row = rows[index];
    try {
      await updateDamas({
        id: row._id as Id<"damasOrders">,
        finalOrder: row.finalOrder,
        bonus: row.bonus,
      });
      toast.success('Changes saved');
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  const handleConfirm = async () => {
    const loadingToast = toast.loading('Confirming orders...');
    try {
      await confirmDamas({});
      toast.dismiss(loadingToast);
      toast.success('Orders confirmed and sent to Process!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to confirm orders');
    }
  };

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Damas Processing" />
      
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[3%]">No.</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[11%]">Substance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[11%]">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Company</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[6%]">Qty Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[6%]">Final Order</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[7%]">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[9%]">Total Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[4%]">Bonus</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Pills</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[6%]">Final Amt/Pkg</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[6%]">Final Amt/Pill</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Image</th>
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
                      <input type="text" value={row.company} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.quantityOrder)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.finalOrder || ''}
                        placeholder={row.pillsSy > 0 ? Math.ceil(row.quantityOrder / row.pillsSy).toString() : ''}
                        onChange={(e) => updateRow(index, 'finalOrder', parseFloat(e.target.value) || 0)}
                        onBlur={() => saveChanges(index)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.price)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.totalPrice)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={row.bonus || ''}
                        onChange={(e) => updateRow(index, 'bonus', parseFloat(e.target.value) || 0)}
                        onBlur={() => saveChanges(index)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.pillsSy)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.finalAmountPackage)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" value={formatNumber(row.finalAmountPill)} readOnly className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No orders from Damas yet. Please create orders in Order page first.
            </div>
          )}

          {rows.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700">
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Confirm & Send to Process
              </button>
            </div>
          )}
        </div>
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
