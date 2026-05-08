import React, { useState, useMemo } from 'react';
import { 
    CheckCircle2, 
    ShoppingBag, 
    Navigation, 
    Route as RouteIcon,
    Zap,
    Map as MapIcon,
    LayoutList,
    MapPin,
    ExternalLink,
    Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRider } from '../hooks/useRider';
import OrderCard from '../components/OrderCard';
import DeliveryMap from '../components/DeliveryMap';
import toast from 'react-hot-toast';

const Orders = () => {
    const { 
        myOrders, 
        availableOrders, 
        loading, 
        claim, 
        accept, 
        pickup, 
        arrive, 
        deliver,
        batchToRoute,
        location,
        routeInfo
    } = useRider();
    
    const [actionLoading, setActionLoading] = useState(false);
    const [tab, setTab] = useState('new'); // 'new' | 'active' | 'history'
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

    const handleAction = async (orderId, type) => {
        let payload = {};
        
        if (type === 'deliver') {
            const order = myOrders.find(o => o._id === orderId);
            if (order && order.paymentMethod === 'cod') {
                const confirmed = window.confirm(`CASH COLLECTION VERIFICATION:\n\nHave you collected Rs. ${order.totalPrice} from the customer?`);
                if (!confirmed) return;
                payload.cashCollected = true;
            }
        }

        setActionLoading(true);
        try {
            switch(type) {
                case 'claim': await claim(orderId); break;
                case 'batch': await batchToRoute(orderId); break;
                case 'accept': await accept(orderId); break;
                case 'pickup': await pickup(orderId); break;
                case 'arrive': await arrive(orderId); break;
                case 'deliver': await deliver(orderId, payload.cashCollected); break;
                default: throw new Error("Invalid action");
            }
            toast.success(`Mission updated! ✅`);
            if (['claim', 'batch', 'accept', 'pickup'].includes(type)) setTab('active');
        } catch (error) {
            toast.error(error.response?.data?.message || `Operation failed ❌`);
        } finally {
            setActionLoading(false);
        }
    };

    const activeOrders = useMemo(() => {
        return myOrders.filter(o => o.status !== 'DELIVERED');
    }, [myOrders]);

    const completedOrders = myOrders.filter(o => o.status === 'DELIVERED');

    const handleNavigateAll = () => {
        if (!location || activeOrders.length === 0) return;
        
        const lastOrder = activeOrders[activeOrders.length - 1];
        const waypoints = activeOrders
            .slice(0, -1)
            .map(o => `${o.shippingAddress.lat},${o.shippingAddress.lng}`)
            .join('|');

        const url = `https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${lastOrder.shippingAddress.lat},${lastOrder.shippingAddress.lng}&waypoints=${waypoints}&travelmode=driving`;
        
        window.open(url, '_blank');
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-24 max-w-4xl mx-auto px-4 pt-6">
            <header className="flex flex-col gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black tracking-tight text-white mb-1 uppercase">
                        Mission <span className="text-gold">Terminal</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Operational Route Logistics</p>
                </div>

                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 shadow-2xl">
                    {[
                        { id: 'new', label: 'Queue', icon: ShoppingBag },
                        { id: 'active', label: 'Active', icon: Navigation },
                        { id: 'history', label: 'History', icon: CheckCircle2 }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${
                                tab === t.id ? 'bg-gold text-charcoal shadow-xl shadow-gold/20' : 'text-white/30 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <t.icon className="w-4 h-4" />
                            {t.label}
                        </button>
                    ))}
                </div>
            </header>

            <AnimatePresence mode="wait">
                {tab === 'new' && (
                    <motion.div
                        key="new"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                                <Zap className="w-4 h-4" /> Available Signals
                            </h2>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                {availableOrders.length} Potential Missions
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {availableOrders.length === 0 ? (
                                <div className="py-24 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-6">
                                    <ShoppingBag className="w-16 h-16 text-white/5 mb-6" />
                                    <h3 className="text-xl font-serif text-white/20 uppercase tracking-widest">No Signals Detected</h3>
                                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest mt-4">Deep scan in progress...</p>
                                </div>
                            ) : (
                                availableOrders.map((order) => (
                                    <OrderCard 
                                        key={order._id}
                                        order={order}
                                        onAction={handleAction}
                                        actionLoading={actionLoading}
                                        isNearby={order.onRoute}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}

                {tab === 'active' && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-6"
                    >
                        {activeOrders.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="glass p-6 rounded-2xl border border-gold/20 bg-gold/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-gold uppercase tracking-widest mb-2">Total Route</p>
                                    <h4 className="text-3xl font-serif font-black text-white leading-none">{routeInfo.totalDistance} <span className="text-sm font-sans text-gold/40">KM</span></h4>
                                </div>
                                <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center text-center">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Stops Remaining</p>
                                    <h4 className="text-3xl font-serif font-black text-white leading-none">{activeOrders.length} <span className="text-sm font-sans text-white/20">STOPS</span></h4>
                                </div>
                                <button 
                                    onClick={handleNavigateAll}
                                    className="btn-gold h-full flex flex-col items-center justify-center gap-2 rounded-2xl group"
                                >
                                    <Compass className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                                    <span>Navigate All</span>
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold flex items-center gap-2">
                                <RouteIcon className="w-4 h-4" /> Optimized Deployment
                            </h2>
                            <div className="flex bg-white/5 p-1.5 rounded-xl border border-white/10">
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-gold text-charcoal shadow-lg' : 'text-white/20 hover:text-white'}`}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('map')}
                                    className={`p-2.5 rounded-lg transition-all ml-1 ${viewMode === 'map' ? 'bg-gold text-charcoal shadow-lg' : 'text-white/20 hover:text-white'}`}
                                >
                                    <MapIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {activeOrders.length === 0 ? (
                            <div className="py-24 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-6">
                                <Navigation className="w-16 h-16 text-white/5 mb-6" />
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No active deployments found</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {viewMode === 'map' && (
                                    <div className="h-[450px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative">
                                        <DeliveryMap riderLoc={location} activeOrders={activeOrders} />
                                        <div className="absolute top-6 left-6 z-[1000]">
                                            <div className="glass p-4 rounded-2xl border border-gold/20 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gold text-charcoal flex items-center justify-center font-black text-sm">
                                                    {activeOrders.length}
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gold uppercase tracking-widest">Live Route</p>
                                                    <p className="text-xs font-bold text-white uppercase">{routeInfo.totalDistance} KM Total</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 gap-8 relative">
                                    {activeOrders.map((order, idx) => (
                                        <div key={order._id} className="relative pl-12">
                                            {/* Step Indicator */}
                                            <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] shadow-xl z-10 border-2 ${
                                                    idx === 0 ? 'bg-gold text-charcoal border-white/20' : 'bg-white/5 text-white/30 border-white/5'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                {idx < activeOrders.length - 1 && (
                                                    <div className="flex-1 w-0.5 bg-gradient-to-b from-white/10 to-transparent my-2" />
                                                )}
                                            </div>

                                            {idx === 0 && (
                                                <div className="absolute -top-4 left-14 bg-near/20 text-near text-[7px] font-black px-2 py-0.5 rounded border border-near/30 uppercase tracking-[0.2em] animate-pulse">
                                                    Current Priority
                                                </div>
                                            )}

                                            <OrderCard 
                                                order={order}
                                                onAction={handleAction}
                                                actionLoading={actionLoading}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {tab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Mission Logs
                            </h2>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-white/40 uppercase tracking-widest">
                                {completedOrders.length} Successful
                            </span>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {completedOrders.length === 0 ? (
                                <div className="py-24 glass rounded-[2.5rem] border border-dashed border-white/10 flex flex-col items-center justify-center text-center px-6">
                                    <CheckCircle2 className="w-16 h-16 text-white/5 mb-6" />
                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">No mission history found</p>
                                </div>
                            ) : (
                                completedOrders.map((order) => (
                                    <div key={order._id} className="glass p-6 rounded-[2rem] border border-white/5 flex flex-col gap-6 group hover:bg-white/[0.04] transition-all duration-500">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-near/5 flex items-center justify-center border border-near/10">
                                                    <CheckCircle2 className="w-7 h-7 text-near" />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-bold text-white uppercase tracking-tight">
                                                        {order.user?.firstName} {order.user?.lastName}
                                                    </h4>
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mt-1">
                                                        ID: {order.orderNumber || order._id.slice(-6).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-serif font-black text-gold">Rs. {order.totalPrice}</p>
                                                <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-2">
                                                    {new Date(order.deliveredAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent w-full" />
                                        
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-white/20" />
                                                <p className="text-sm font-medium text-white/60">
                                                    {order.shippingAddress?.area || 'Delivery Complete'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5">
                                                <Zap size={12} className="text-gold" />
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Protocol Success</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Orders;


