import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Navigation, 
    Clock, 
    Map as MapIcon, 
    ChevronRight, 
    RotateCcw,
    MapPin,
    AlertCircle
} from 'lucide-react';

const NavigationPanel = ({ routeInfo, nextStop, onRecalculate, onCenter }) => {
    if (!routeInfo) return null;

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2000] w-[95%] max-w-md pointer-events-none"
        >
            <div className="glass p-5 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-2xl pointer-events-auto">
                <div className="flex flex-col gap-5">
                    
                    {/* Top Section: Real-time Stats */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20">
                                <Navigation className="w-6 h-6 text-gold animate-pulse" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-0.5">Estimated Arrival</p>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-sans font-bold text-white tracking-tight">{routeInfo.duration} min</h3>
                                    <span className="text-soft-white/30 font-bold text-sm">({routeInfo.distance} km)</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onRecalculate}
                            className="p-3 rounded-xl bg-white/5 text-soft-white/40 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                            title="Recalculate Route"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Middle Section: Next Stop Info */}
                    <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-crimson/10 flex items-center justify-center border border-crimson/20">
                                <MapPin className="w-5 h-5 text-crimson" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-soft-white/30 uppercase tracking-widest mb-0.5">Next Stop</p>
                                <h4 className="text-sm font-bold text-white leading-none">
                                    {nextStop?.name || 'Loading next stop...'}
                                </h4>
                                <p className="text-[10px] text-white/40 mt-1 truncate max-w-[150px]">
                                    {nextStop?.address || 'Calculating route...'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={onCenter}
                                className="w-10 h-10 rounded-xl bg-gold text-charcoal flex items-center justify-center shadow-lg shadow-gold/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <MapIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Bottom Section: Start Button (Redirect to Google) */}
                    <button 
                        onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${nextStop?.lat},${nextStop?.lng}&travelmode=driving`;
                            window.open(url, '_blank');
                        }}
                        className="w-full btn-gold py-4 rounded-2xl flex items-center justify-center gap-3 group/btn"
                    >
                        <Navigation className="w-5 h-5 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Open Google Navigation</span>
                        <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                    </button>
                </div>
            </div>

            {/* Floating Status Warning (Recalculating...) */}
            <AnimatePresence>
                {!routeInfo.distance && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-xs"
                    >
                        <div className="bg-charcoal/90 border border-gold/20 backdrop-blur-xl px-4 py-2 rounded-full flex items-center gap-2 shadow-2xl justify-center">
                            <div className="w-2 h-2 rounded-full bg-gold animate-ping" />
                            <span className="text-[9px] font-black text-gold uppercase tracking-widest">Optimizing Road Path...</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default NavigationPanel;
