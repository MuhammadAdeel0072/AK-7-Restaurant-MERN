import React from 'react';
import { motion } from 'framer-motion';
import { Check, Package, Clock, ShoppingBag, Truck, MapPin } from 'lucide-react';

const STAGES = [
    { status: 'RECEIVED', label: 'Order Received', icon: ShoppingBag },
    { status: 'PREPARING', label: 'Preparing', icon: Clock },
    { status: 'PACKED', label: 'Packed', icon: Package },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Truck },
    { status: 'DELIVERED', label: 'Delivered', icon: MapPin },
];

const OrderStatusStepper = ({ currentStatus }) => {
    // Determine current index, handling fallbacks for transitional statuses
    const getStatusIndex = (status) => {
        const normalized = status?.toUpperCase();
        if (['PENDING', 'RECEIVED'].includes(normalized)) return 0;
        if (['PREPARING', 'COOKED'].includes(normalized)) return 1;
        if (['PACKED', 'READY_FOR_DELIVERY'].includes(normalized)) return 2;
        if (['OUT_FOR_DELIVERY', 'DISPATCHED', 'PICKED_UP'].includes(normalized)) return 3;
        if (normalized === 'DELIVERED') return 4;
        return 0;
    };

    const currentIndex = getStatusIndex(currentStatus);

    return (
        <div className="py-12 px-4">
            <div className="relative flex justify-between">
                {/* Progress Line */}
                <div className="absolute top-[22px] left-0 right-0 h-[2px] bg-white/5 z-0">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
                        className="h-full bg-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                    />
                </div>

                {STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentIndex;
                    const isActive = idx === currentIndex;
                    const Icon = stage.icon;

                    return (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-4 group">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isActive || isCompleted ? '#D4AF37' : 'rgba(255,255,255,0.05)',
                                    scale: isActive ? 1.2 : 1,
                                    borderColor: isActive ? '#D4AF37' : 'rgba(255,255,255,0.1)'
                                }}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                                    isActive ? 'text-charcoal shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 
                                    isCompleted ? 'text-charcoal' : 'text-gray-600'
                                }`}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 stroke-[3]" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </motion.div>
                            
                            <div className="text-center">
                                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${
                                    isActive ? 'text-white' : isCompleted ? 'text-gold/60' : 'text-gray-600'
                                }`}>
                                    {stage.label}
                                </p>
                            </div>

                            {isActive && (
                                <motion.div 
                                    layoutId="active-glow"
                                    className="absolute -inset-4 bg-gold/10 blur-2xl rounded-full -z-10"
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderStatusStepper;
