import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';

const pageConfig: Record<string, { label: string; description: string; color: string; path: string }> = {
  order: { label: 'Order Creation', description: 'Create and manage orders', color: 'bg-blue-500', path: '/order' },
  management: { label: 'Management View', description: 'Overview and management dashboard', color: 'bg-purple-500', path: '/management' },
  cost: { label: 'Cost Breakdown', description: 'View cost analysis and reports', color: 'bg-green-500', path: '/cost' },
  last_order: { label: 'Last Order History', description: 'View previous orders history', color: 'bg-orange-500', path: '/last-order' },
  damas: { label: 'Damas Processing', description: 'Process Damas operations', color: 'bg-red-500', path: '/damas' },
  data: { label: 'Data Management', description: 'Manage pills and inventory data', color: 'bg-teal-500', path: '/data' },
  process: { label: 'Process Tracking', description: 'Track order processing status', color: 'bg-indigo-500', path: '/process' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handlePageClick = (page: string) => {
    const config = pageConfig[page];
    if (config) {
      navigate(config.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Navigation title="Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Select a Page</h2>
          <p className="text-gray-600 dark:text-gray-300">Choose from your available modules below</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.pages.map((page) => {
            const config = pageConfig[page] || { label: page, description: '', color: 'bg-gray-500' };
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className="group relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-left p-6"
              >
                <div className={`absolute top-0 left-0 w-2 h-full ${config.color}`} />
                <div className="pl-4">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {config.label}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {config.description}
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                    <span>Access Page</span>
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {user?.pages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No pages available for your account.</p>
          </div>
        )}
      </main>
    </div>
  );
}
