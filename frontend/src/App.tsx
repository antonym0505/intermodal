import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { api, type Container, type HandoffStatus, type CustodyEvent } from './api';
import { ContainerCard } from './components/ContainerCard';
import { HandoffStatusCard } from './components/HandoffStatusCard';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutCard } from './components/AboutCard';
import { clsx } from 'clsx';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [container, setContainer] = useState<Container | null>(null);
  const [handoffStatus, setHandoffStatus] = useState<HandoffStatus | null>(null);
  const [history, setHistory] = useState<CustodyEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'container' | 'handoff'>('container');
  const [showAdmin, setShowAdmin] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setContainer(null);
    setHandoffStatus(null);

    try {
      // Parallel fetch using Promise.allSettled to handle partial failures
      const [containerResult, handoffResult] = await Promise.allSettled([
        api.getContainer(searchQuery),
        api.getHandoffStatus(searchQuery)
      ]);

      if (containerResult.status === 'fulfilled') {
        setContainer(containerResult.value);
      } else {
        throw new Error('Container not found or API unavailable');
      }

      if (handoffResult.status === 'fulfilled') {
        setHandoffStatus(handoffResult.value);
      }

      // We need the Token ID for history lookup.
      // If container call succeeded, use that.
      if (containerResult.status === 'fulfilled' && containerResult.value) {
        const events = await api.getContainerHistory(containerResult.value.tokenId);
        setHistory(events);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch container details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmHandoff = async () => {
    if (!container || !handoffStatus?.bookingReference) return;

    // In a real app, these would be form inputs or taken from logged-in user context
    const location = "Terminal Gate 4";

    try {
      setLoading(true);
      await api.confirmHandoff(container.unitNumber, handoffStatus.bookingReference, location);

      // Refresh data
      const newStatus = await api.getHandoffStatus(container.unitNumber);
      setHandoffStatus(newStatus);
      const newContainer = await api.getContainer(container.unitNumber);
      setContainer(newContainer);

      alert('Handoff confirmed successfully!');
    } catch (err: any) {
      alert(`Failed to confirm: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 relative">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Intermodal<span className="text-blue-600">Trace</span>
            </h1>
            <button
              onClick={() => setShowAdmin(!showAdmin)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-2 py-1"
            >
              {showAdmin ? 'Close Admin' : 'Admin'}
            </button>
          </div>
          <p className="text-slate-500">Decentralized Container Custody Tracking</p>
        </header>

        {showAdmin ? (
          <AdminDashboard />
        ) : (
          <>

            {/* Search */}
            <div className="bg-white p-2 rounded-xl shadow-lg shadow-slate-200/50 max-w-lg mx-auto border border-slate-100">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter Unit Number (e.g. MSCU1234567)"
                    className="w-full pl-10 pr-4 py-3 rounded-lg bg-transparent outline-none text-slate-800 placeholder:text-slate-400 font-mono"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Track'}
                </button>
              </form>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Results */}
            {container ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex justify-center border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('container')}
                    className={clsx(
                      "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === 'container'
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Container Details
                  </button>
                  <button
                    onClick={() => setActiveTab('handoff')}
                    className={clsx(
                      "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                      activeTab === 'handoff'
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Custody & Handoffs
                  </button>
                </div>

                <div className="max-w-2xl mx-auto">
                  {activeTab === 'container' ? (
                    <ContainerCard container={container} history={history} />
                  ) : (
                    <div className="space-y-4">
                      <ContainerCard container={container} className="opacity-75 blur-[0.5px] scale-95 origin-top" />
                      <div className="-mt-12 relative z-10">
                        <HandoffStatusCard
                          status={handoffStatus || { hasPendingHandoff: false }}
                          onConfirm={handleConfirmHandoff}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) :
              <AboutCard />
            }
          </>
        )}
      </div>
    </div >
  );
}

export default App;
