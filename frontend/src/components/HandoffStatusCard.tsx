import { type HandoffStatus } from '../api';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface HandoffStatusCardProps {
    status: HandoffStatus;
    className?: string;
    onConfirm?: () => void;
}

export function HandoffStatusCard({ status, className, onConfirm }: HandoffStatusCardProps) {
    if (!status.hasPendingHandoff) {
        return (
            <div className={twMerge("bg-slate-50 rounded-xl border border-slate-200 p-6 flex items-center justify-center text-slate-500", className)}>
                <p>No pending handoff operations</p>
            </div>
        );
    }

    return (
        <div className={twMerge("bg-white rounded-xl shadow-sm border overflow-hidden",
            status.status === 'PENDING' ? "border-amber-200" : "border-green-200",
            className
        )}>
            <div className={twMerge("px-4 py-3 border-b flex items-center gap-2",
                status.status === 'PENDING' ? "bg-amber-50 border-amber-100 text-amber-800" : "bg-green-50 border-green-100 text-green-800"
            )}>
                {status.status === 'PENDING' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                <h3 className="font-semibold">
                    {status.status === 'PENDING' ? 'Handoff in Progress' : 'Handoff Confirmed'}
                </h3>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">From</p>
                        <p className="font-mono text-sm bg-slate-50 p-1.5 rounded border mt-1 truncate" title={status.from}>
                            {status.from}
                        </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">To</p>
                        <p className="font-mono text-sm bg-slate-50 p-1.5 rounded border mt-1 truncate" title={status.to}>
                            {status.to}
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Booking Reference</p>
                    <p className="text-lg font-mono font-bold text-slate-800 tracking-wider">
                        {status.bookingReference || 'Wait for owner...'}
                    </p>
                </div>

                {status.status === 'PENDING' && onConfirm && (
                    <button
                        onClick={onConfirm}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm Physical Receipt
                    </button>
                )}
            </div>
        </div>
    );
}
