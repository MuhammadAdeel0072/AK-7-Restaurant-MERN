import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const ETAIndicator = ({ estimatedTime }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!estimatedTime) return;

        const calculateTimeLeft = () => {
            const diff = new Date(estimatedTime) - new Date();
            return Math.max(0, Math.floor(diff / 60000));
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) clearInterval(interval);
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [estimatedTime]);

    if (!estimatedTime || timeLeft === 0) return null;

    return (
        <div className="bg-gold/10 border border-gold/20 rounded-[2rem] px-8 py-6 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center border border-gold/30">
                    <Clock className="w-5 h-5 text-gold animate-pulse" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-0.5">Estimated Arrival</p>
                    <AnimatePresence mode="wait">
                        <motion.h4
                            key={timeLeft}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-2xl font-bold text-white tracking-tight"
                        >
                            Arriving in {timeLeft} mins
                        </motion.h4>
                    </AnimatePresence>
                </div>
            </div>
            
            <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">
                    {new Date(estimatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
            </div>
        </div>
    );
};

export default ETAIndicator;
