import { useState } from 'react';
import { api } from '../api';
import { Warehouse, Container, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'facility' | 'container'>('facility');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Facility Form State
    const [facilityForm, setFacilityForm] = useState({
        code: '',
        name: '',
        address: '',
        location: '',
        type: '0' // TERMINAL default
    });

    // Container Form State
    const [containerForm, setContainerForm] = useState({
        unitNumber: '',
        ownerCode: '',
        isoType: '22G1',
        tareWeight: '',
        maxWeight: '',
        ownerAddress: ''
    });

    const handleFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await api.registerFacility(
                facilityForm.address,
                facilityForm.code,
                parseInt(facilityForm.type),
                facilityForm.name,
                facilityForm.location
            );
            setMessage({ type: 'success', text: `Facility ${facilityForm.code} registered successfully!` });
            setFacilityForm({ code: '', name: '', address: '', location: '', type: '0' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleContainerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            if (!containerForm.ownerAddress) {
                throw new Error("Owner Address is required");
            }
            await api.registerContainer(
                containerForm.unitNumber,
                containerForm.ownerCode,
                containerForm.isoType,
                parseInt(containerForm.tareWeight),
                parseInt(containerForm.maxWeight),
                containerForm.ownerAddress
            );
            setMessage({ type: 'success', text: `Container ${containerForm.unitNumber} minted successfully!` });
            setContainerForm(prev => ({ ...prev, unitNumber: '', tareWeight: '', maxWeight: '' }));
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Warehouse className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-lg">Platform Admin</h2>
                    <p className="text-blue-200 text-xs">Registry Management</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('facility')}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                        activeTab === 'facility'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <Warehouse className="w-4 h-4" />
                    Register Facility
                </button>
                <button
                    onClick={() => setActiveTab('container')}
                    className={clsx(
                        "flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                        activeTab === 'container'
                            ? "border-blue-600 text-blue-600 bg-blue-50/50"
                            : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    )}
                >
                    <Container className="w-4 h-4" />
                    Mint Container
                </button>
            </div>

            <div className="p-6">
                {message && (
                    <div className={clsx(
                        "mb-6 p-4 rounded-lg flex items-center gap-3",
                        message.type === 'success' ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                    )}>
                        {message.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                {activeTab === 'facility' ? (
                    <form onSubmit={handleFacilitySubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="USLAX-01"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={facilityForm.code}
                                    onChange={e => setFacilityForm({ ...facilityForm, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={facilityForm.type}
                                    onChange={e => setFacilityForm({ ...facilityForm, type: e.target.value })}
                                >
                                    <option value="0">Terminal</option>
                                    <option value="1">Port Authority</option>
                                    <option value="2">Depot</option>
                                    <option value="4">Rail</option>
                                    <option value="5">Truck</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Name</label>
                            <input
                                type="text"
                                required
                                placeholder="Pacific Terminal Operations"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={facilityForm.name}
                                onChange={e => setFacilityForm({ ...facilityForm, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Wallet Address</label>
                            <input
                                type="text"
                                required
                                placeholder="0x..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                value={facilityForm.address}
                                onChange={e => setFacilityForm({ ...facilityForm, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Location</label>
                            <input
                                type="text"
                                required
                                placeholder="Los Angeles, CA"
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={facilityForm.location}
                                onChange={e => setFacilityForm({ ...facilityForm, location: e.target.value })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Register Facility
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleContainerSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Unit Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="MSCU1234567"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={containerForm.unitNumber}
                                    onChange={e => setContainerForm({ ...containerForm, unitNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Owner Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="MSC"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={containerForm.ownerCode}
                                    onChange={e => setContainerForm({ ...containerForm, ownerCode: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Legal Owner Address</label>
                            <input
                                type="text"
                                required
                                placeholder="0x..."
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                value={containerForm.ownerAddress}
                                onChange={e => setContainerForm({ ...containerForm, ownerAddress: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">ISO Type</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="22G1"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={containerForm.isoType}
                                    onChange={e => setContainerForm({ ...containerForm, isoType: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Tare (kg)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="2300"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={containerForm.tareWeight}
                                    onChange={e => setContainerForm({ ...containerForm, tareWeight: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Max (kg)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="30480"
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={containerForm.maxWeight}
                                    onChange={e => setContainerForm({ ...containerForm, maxWeight: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Mint Container
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
