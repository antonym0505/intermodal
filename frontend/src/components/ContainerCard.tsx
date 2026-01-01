import { type Container, type CustodyEvent } from '../api';
import { Box, Truck, Scale, Calendar, User, History as HistoryIcon, CheckCircle2, Clock } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ContainerCardProps {
    container: Container;
    history?: CustodyEvent[];
    className?: string;
}

export function ContainerCard({ container, className, history }: ContainerCardProps) {
    return (
        <div className={twMerge("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}>
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Box className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900">{container.unitNumber}</h3>
                        <p className="text-sm text-slate-500">{container.isoType} • {container.ownerCode}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                </div>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <div>
                            <p className="text-xs text-slate-400">Owner</p>
                            <p className="text-sm font-medium font-mono truncate w-32 md:w-48" title={container.owner}>
                                {container.owner}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                        <Truck className="w-4 h-4" />
                        <div>
                            <p className="text-xs text-slate-400">Current Possessor</p>
                            <p className="text-sm font-medium font-mono truncate w-32 md:w-48" title={container.possessor || 'None'}>
                                {container.possessor || 'In Owner Custody'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-3">
                    <div className="flex items-center gap-2 text-slate-600">
                        <Scale className="w-4 h-4" />
                        <div>
                            <p className="text-xs text-slate-400">Weights</p>
                            <p className="text-sm">
                                Tare: <span className="font-medium">{container.tareWeight}kg</span>
                                <br />
                                Max: <span className="font-medium">{container.maxGrossWeight}kg</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <div>
                            <p className="text-xs text-slate-400">Registered</p>
                            <p className="text-sm font-medium">
                                {new Date(container.registeredAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {history && history.length > 0 && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-4">
                        <HistoryIcon className="w-4 h-4 text-slate-500" />
                        <h4 className="font-semibold text-slate-700 text-sm">Custody History</h4>
                    </div>

                    <div className="relative pl-4 border-l-2 border-slate-200 space-y-6">
                        {history.map((event) => (
                            <div key={event.id} className="relative">
                                {/* Dot */}
                                <div className={twMerge(
                                    "absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 bg-white",
                                    event.status === 'CONFIRMED' || event.status === 'CONFIRMED_EVENT' ? "border-green-500" : "border-amber-400"
                                )} />

                                <div className="space-y-1">
                                    <div className="flex items-start justify-between">
                                        <p className="font-medium text-sm text-slate-900">
                                            {event.from.slice(0, 6)}...{event.from.slice(-4)}
                                            <span className="text-slate-400 mx-2">→</span>
                                            {event.to.slice(0, 6)}...{event.to.slice(-4)}
                                        </p>
                                        <span className={twMerge(
                                            "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                                            event.status === 'CONFIRMED' || event.status === 'CONFIRMED_EVENT'
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                        )}>
                                            {event.status === 'CONFIRMED_EVENT' ? 'CONFIRMED' : event.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(Number(event.initiatedAt) * 1000).toLocaleDateString()}
                                        </span>
                                        {event.confirmedAt && (
                                            <span className="flex items-center gap-1 text-green-600">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Confirmed
                                            </span>
                                        )}
                                        <a
                                            href={`https://sepolia.basescan.org/tx/${event.txHash}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Tx
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
