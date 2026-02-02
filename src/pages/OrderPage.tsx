import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import Navigation from '../components/Navigation';
import ImagePreview from '../components/ImagePreview';
import { toast } from 'sonner';

interface Order {
  _id?: Id<"orders">;
  rowNumber: number;
  substance: string;
  name: string;
  company: string;
  pillsBl: number;
  currentBalance: number;
  quantityOrder: number;
  realOrder: number;
  finalBalance: number;
  pillQuantityOrder: number;
  pillRealOrder: number;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string | null;
  urgent: boolean;
  price: number;
}

export default function OrderPage() {
  const orders = useQuery(api.orders.getAll) || [];
  const pills = useQuery(api.pills.getAll) || [];
  const saveOrder = useMutation(api.orders.save);
  const removeOrder = useMutation(api.orders.remove);
  const sendToDamas = useMutation(api.orders.sendToDamas);

  const [rows, setRows] = useState<Order[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [savingRow, setSavingRow] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!hasLoaded && orders.length > 0) {
      setRows(orders as Order[]);
      setHasLoaded(true);
    } else if (!hasLoaded && pills.length > 0 && rows.length === 0) {
      addRow();
      setHasLoaded(true);
    }
    // Note: We don't sync orders into rows after initial load to preserve unsaved local rows
  }, [orders, pills, hasLoaded]);

  const getPillBySubstance = (substance: string) => {
    return pills.find(p => p.substance === substance);
  };

  const getNextRowNumber = () => {
    if (rows.length === 0) return 1;
    return Math.max(...rows.map(r => r.rowNumber)) + 1;
  };

  const addRow = () => {
    const newRow: Order = {
      rowNumber: getNextRowNumber(),
      substance: '',
      name: '',
      company: '',
      pillsBl: 0,
      currentBalance: 0,
      quantityOrder: 0,
      realOrder: 0,
      finalBalance: 0,
      pillQuantityOrder: 0,
      pillRealOrder: 0,
      urgent: false,
      price: 0,
    };
    setRows([...rows, newRow]);
    toast.success('New order row added');
  };

  const updateRow = async (index: number, field: keyof Order, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate when substance changes
    if (field === 'substance') {
      const pill = getPillBySubstance(value);
      if (pill) {
        updated[index].name = pill.name;
        updated[index].company = pill.company;
        updated[index].pillsBl = pill.pillsBl;
        updated[index].imageStorageId = pill.imageStorageId;
        updated[index].imageUrl = pill.imageUrl;
        updated[index].price = pill.price || 0;
      }
      
      // Auto-add new row if this is the last row and substance was selected
      if (index === rows.length - 1 && value.trim()) {
        const newRow: Order = {
          rowNumber: 0, // Will be reassigned
          substance: '',
          name: '',
          company: '',
          pillsBl: 0,
          currentBalance: 0,
          quantityOrder: 0,
          realOrder: 0,
          finalBalance: 0,
          pillQuantityOrder: 0,
          pillRealOrder: 0,
          urgent: false,
          price: 0,
        };
        updated.push(newRow);
        // Renumber all rows
        const renumbered = updated.map((row, i) => ({ ...row, rowNumber: i + 1 }));
        setRows(renumbered);
        
        // Auto-save the updated row and the new empty row
        setSavingRow(renumbered[index].rowNumber);
        await saveSingleRow(renumbered[index]);
        setSavingRow(null);
        return;
      }
    }

    // Recalculate final balance
    if (field === 'currentBalance' || field === 'quantityOrder') {
      const row = updated[index];
      updated[index].finalBalance = (row.currentBalance || 0) + (row.quantityOrder || 0);
      updated[index].pillQuantityOrder = (row.quantityOrder || 0) * (row.pillsBl || 0);
    }

    // Recalculate pill real order
    if (field === 'realOrder') {
      const row = updated[index];
      updated[index].pillRealOrder = (row.realOrder || 0) * (row.pillsBl || 0);
    }

    // Renumber when urgent changes - urgent orders get #1, 2, 3... non-urgent follow
    if (field === 'urgent') {
      // Sort: urgent first (by their original order), then non-urgent
      const sorted = [...updated].sort((a, b) => {
        if (a.urgent && !b.urgent) return -1;
        if (!a.urgent && b.urgent) return 1;
        // Among same urgency, maintain relative order
        return 0;
      });
      
      // Renumber all
      const renumbered = sorted.map((row, i) => ({
        ...row,
        rowNumber: i + 1
      }));
      
      setRows(renumbered);
      
      // Auto-save all renumbered rows in background
      setSavingRow(renumbered[index].rowNumber);
      Promise.all(renumbered.map(row => saveSingleRow(row))).finally(() => {
        setSavingRow(null);
      });
      return;
    }

    setRows(updated);
    
    // Auto-save the updated row in background
    setSavingRow(updated[index].rowNumber);
    await saveSingleRow(updated[index]);
    setSavingRow(null);
  };

  const saveSingleRow = async (row: Order) => {
    if (!row.substance?.trim()) return;
    
    try {
      const orderData = {
        rowNumber: row.rowNumber,
        substance: row.substance,
        currentBalance: Number(row.currentBalance) || 0,
        quantityOrder: Number(row.quantityOrder) || 0,
        realOrder: Number(row.realOrder) || 0,
        finalBalance: Number(row.finalBalance) || 0,
        pillQuantityOrder: Number(row.pillQuantityOrder) || 0,
        pillRealOrder: Number(row.pillRealOrder) || 0,
        urgent: row.urgent || false,
      };
      await saveOrder(orderData);
    } catch (error) {
      console.error('Failed to auto-save row:', error);
    }
  };

  const deleteRow = async (index: number) => {
    const row = rows[index];
    if (row._id) {
      const loadingToast = toast.loading('Deleting order...');
      try {
        await removeOrder({ id: row._id });
        toast.dismiss(loadingToast);
        toast.success('Order deleted');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete order');
        return;
      }
    }

    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSendToDamas = async () => {
    const loadingToast = toast.loading('Sending orders to Damas...');
    
    try {
      // First save all orders
      for (const row of rows) {
        if (row.substance?.trim()) {
          const orderData = {
            rowNumber: row.rowNumber,
            substance: row.substance,
            currentBalance: Number(row.currentBalance) || 0,
            quantityOrder: Number(row.quantityOrder) || 0,
            realOrder: Number(row.realOrder) || 0,
            finalBalance: Number(row.finalBalance) || 0,
            pillQuantityOrder: Number(row.pillQuantityOrder) || 0,
            pillRealOrder: Number(row.pillRealOrder) || 0,
            urgent: row.urgent || false,
          };
          
          await saveOrder(orderData);
        }
      }
      
      // Then send to Damas
      await sendToDamas({});
      
      toast.dismiss(loadingToast);
      toast.success('Orders sent to Damas successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to send to Damas: ' + (error as Error).message);
    }
  };

  const formatNumber = (num: number) => {
    if (!num) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Sort for display: urgent first, then by rowNumber
  const displayRows = [...rows].sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return a.rowNumber - b.rowNumber;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Order Creation" />
      
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[4%]">No.</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Substance</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[15%]">Name</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Pills</th>
                  <th colSpan={4} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Per Package</th>
                  <th colSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Per Pill</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[10%]">Image</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Action</th>
                  <th rowSpan={2} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[5%]">Urgent</th>
                </tr>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Current</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Qty Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Customer Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Final</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Qty Order</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 w-[8%]">Customer Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {displayRows.map((row) => {
                  const originalIndex = rows.findIndex(r => r.rowNumber === row.rowNumber);
                  return (
                    <tr key={row.rowNumber} className={row.urgent ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}>
                      <td className="px-4 py-2 text-center text-gray-900 dark:text-white">
                        {row.rowNumber}
                        {savingRow === row.rowNumber && (
                          <span className="ml-1 text-xs text-blue-500 animate-pulse">●</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          list="substanceList"
                          defaultValue={row.substance}
                          onChange={(e) => updateRow(originalIndex, 'substance', e.target.value)}
                          placeholder="Type or select..."
                          className="w-full px-1 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                        <datalist id="substanceList">
                          {pills.map(pill => (
                            <option key={pill._id} value={pill.substance} />
                          ))}
                        </datalist>
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={row.name} readOnly className="w-full px-1 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(row.pillsBl)} readOnly className="w-full px-1 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          defaultValue={row.currentBalance || ''}
                          onBlur={(e) => updateRow(originalIndex, 'currentBalance', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          defaultValue={row.quantityOrder || ''}
                          onBlur={(e) => updateRow(originalIndex, 'quantityOrder', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          defaultValue={row.realOrder || ''}
                          onBlur={(e) => updateRow(originalIndex, 'realOrder', parseFloat(e.target.value) || 0)}
                          className="w-full px-1 py-1 border border-gray-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(row.finalBalance)} readOnly className="w-full px-1 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(row.pillQuantityOrder)} readOnly className="w-full px-1 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2">
                        <input type="text" value={formatNumber(row.pillRealOrder)} readOnly className="w-full px-1 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white" />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.imageUrl && (
                          <img 
                            src={row.imageUrl} 
                            alt="" 
                            className="w-full h-10 object-cover mx-auto rounded cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewImage(row.imageUrl || null)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => deleteRow(originalIndex)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.urgent}
                          onChange={(e) => updateRow(originalIndex, 'urgent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Order
            </button>
            <button
              onClick={handleSendToDamas}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Send to Damas
            </button>
          </div>
        </div>
      </main>
      <ImagePreview imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
}
