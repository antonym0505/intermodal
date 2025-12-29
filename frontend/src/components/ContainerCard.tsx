import { type Container } from '../api';
import { Box, Truck, Scale, Calendar, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface ContainerCardProps {
    container: Container;
    className?: string;
}

export function ContainerCard({ container, className }: ContainerCardProps) {
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
        </div>
    );
}
