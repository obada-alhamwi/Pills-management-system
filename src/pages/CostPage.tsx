import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Navigation from "../components/Navigation";

export default function CostPage() {
  const costs = useQuery(api.costs.getAll) || [];
  const totalData = useQuery(api.costs.getTotal);

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Order Cost" />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[5%]">
                    No.
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[15%]">
                    substance
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[12%]">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">
                    Final Amount
                    <br />
                    Per Package
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[8%]">
                    Bonus
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[10%]">
                    Bonus %
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[8%]">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 w-[12%]">
                    Total Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {costs.map((cost) => (
                  <tr
                    key={cost._id}
                    className={cost.urgent ? "bg-red-50 dark:bg-red-900/20" : "hover:bg-gray-50 dark:hover:bg-slate-700/50"}
                  >
                    <td className="px-4 py-2 text-center text-gray-900 dark:text-white">{cost.rowNumber}</td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={cost.substance}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={cost.name}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={cost.company}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={formatNumber(cost.finalAmountPackage)}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={formatNumber(cost.bonus)}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={`${formatNumber(cost.bonusPercentage)}%`}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={formatNumber(cost.price)}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm text-gray-900 dark:text-white"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={formatNumber(cost.totalPrice)}
                        readOnly
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-600 rounded text-center text-sm font-semibold text-gray-900 dark:text-white"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {costs.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No cost data yet. Please process orders in Process page first.
            </div>
          )}
        </div>

        {totalData && (
          <div className="mt-6 flex justify-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 w-64">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-center text-gray-700 dark:text-gray-200">Final Cost</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="text"
                        value={formatNumber(totalData.total)}
                        readOnly
                        className="w-full text-2xl font-bold text-gray-800 dark:text-white text-center bg-transparent border-none"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
