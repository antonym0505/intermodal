import { Shield, Radio, Wallet, Zap } from 'lucide-react';

export function AboutCard() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-12 mb-8">
            <div className="bg-slate-900 p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-500/20 p-2 rounded-lg backdrop-blur-sm border border-purple-500/30">
                        <Shield className="w-6 h-6 text-purple-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-xl">Intermodal Unit Tracking POC</h2>
                        <p className="text-purple-200 text-sm">Decentralized Chain of Custody</p>
                    </div>
                </div>

                <p className="text-slate-300 leading-relaxed max-w-2xl">
                    A proof-of-concept demonstrating how blockchain can serve as a <strong>single, immutable source of truth</strong> for global supply chains.
                    By representing containers as NFTs and possession as dynamic states, we eliminate data silos and trust gaps.
                </p>
            </div>

            <div className="p-6 grid gap-8 md:grid-cols-3">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Zap className="w-5 h-5 text-amber-500" />
                        <h3>Future Vision</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Beyond simple tracking, this infrastructure enables <strong>automated payments</strong> via smart contracts, instant <strong>parametric insurance</strong>, and seamless cross-border <strong>customs integration</strong> without paperwork.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Radio className="w-5 h-5 text-green-500" />
                        <h3>Current Status</h3>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Deployed on <strong>Base Sepolia</strong> (Testnet)
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Live Subgraph Indexing
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            ERC-4907 Dual-Role Standard
                        </li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-900 font-semibold">
                        <Wallet className="w-5 h-5 text-blue-500" />
                        <h3>Requirements</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        <strong>Tracking is open to all.</strong>
                        <br /><br />
                        To simulate Admin actions or Handoffs, you will need an Ethereum wallet (like MetaMask or Coinbase Wallet) configured for Base Sepolia, and some testnet ETH.
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between items-center">
                <span>v0.1.0-alpha</span>
                <span className="font-mono">Contracts Verified on BaseScan</span>
            </div>
        </div>
    );
}
