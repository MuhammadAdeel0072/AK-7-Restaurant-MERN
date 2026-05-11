import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    MapPin, 
    Phone, 
    User, 
    Clock, 
    ShoppingBag, 
    Navigation, 
    CheckCircle,
    Truck,
    AlertCircle,
    Banknote,
    CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useRider } from '../hooks/useRider';
import toast from 'react-hot-toast';
import RiderMap from '../components/RiderMap';

const OrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { 
        myOrders, 
        availableOrders, 
        refreshData,
        claim,
        accept,
        pickup,
        arrive,
        deliver,
        location
    } = useRider();
    
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [codConfirmed, setCodConfirmed] = useState(false);

    useEffect(() => {
        const foundOrder = [...myOrders, ...availableOrders].find(o => o._id === id);
        if (foundOrder) {
            setOrder(foundOrder);
            setLoading(false);
        } else if (!loading) {
            toast.error('Mission data not found');
            navigate('/orders');
        }
    }, [id, myOrders, availableOrders, navigate, loading]);

    const handleCollectCash = () => {
        setCodConfirmed(true);
        toast.success(`Rs. ${order.totalPrice} collected successfully! ✅`, {
            duration: 3000,
            style: { background: '#121212', color: '#D4AF37', border: '1px solid #D4AF37' }
        });
    };

    const handleAction = async (type) => {
        setActionLoading(true);
        const loadingToast = toast.loading(`Processing...`);
        try {
            switch(type) {
                case 'claim': await claim(order._id); break;
                case 'accept': await accept(order._id); break;
                case 'pickup': await pickup(order._id); break;
                case 'arrive': await arrive(order._id); break;
                case 'deliver': await deliver(order._id, codConfirmed); break;
                default: throw new Error("Invalid action");
            }
            toast.dismiss(loadingToast);
            if (type === 'deliver') {
                toast.success('Successfully Delivered! 🎉', {
                    duration: 5000,
                    style: { background: '#121212', color: '#22c55e', border: '1px solid #22c55e' }
                });
            } else {
                toast.success(`Order ${type} complete!`);
            }
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!order) return null;

    const openNavigation = () => {
        if (order.shippingAddress?.lat && order.shippingAddress?.lng) {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.shippingAddress.lat},${order.shippingAddress.lng}`, '_blank');
        } else {
            const addr = encodeURIComponent(order.shippingAddress.address);
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${addr}`, '_blank');
        }
    };

    const getStatusBadge = (status) => {
        const map = {
            'READY_FOR_DELIVERY': { label: 'Dispatch Ready', style: 'bg-gold/10 text-gold border-gold/20' },
            'DISPATCHED': { label: 'Dispatched', style: 'bg-gold/10 text-gold border-gold/20' },
            'ASSIGNED': { label: 'Assigned', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            'ACCEPTED': { label: 'Accepted', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
            'PICKED_UP': { label: 'Out for Delivery', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
            'ARRIVED': { label: 'Arrived', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
            'DELIVERED': { label: 'Delivered', style: 'bg-green-500/10 text-green-500 border-green-500/20' },
        };
        return map[status] || { label: status, style: 'bg-white/5 text-white/40 border-white/10' };
    };

    const currentBadge = getStatusBadge(order.status);

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <header className="flex items-center gap-6">
                <Link to="/orders" className="btn-close-gold w-12 h-12 flex items-center justify-center rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-serif font-black tracking-tighter text-white">
                        Order <span className="text-gold">Details</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-soft-white/40 mt-1">
                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                    </p>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${currentBadge.style}`}>
                    {currentBadge.label}
                </span>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column — Order Items + Timeline */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Order Items */}
                    <section className="glass rounded-[2rem] border border-white/5 p-6 md:p-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gold flex items-center gap-2">
                            <ShoppingBag className="w-4 h-4" /> Order Items
                        </h3>
                        <div className="space-y-3">
                            {order.orderItems?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 group hover:border-gold/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                                        <div>
                                            <p className="text-sm font-bold text-white tracking-tight">{item.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[9px] text-gold/40 font-black uppercase tracking-widest">Qty: {item.qty}</p>
                                                {item.variantName && (
                                                    <span className="text-[8px] text-soft-white/20 font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                        {item.variantName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-serif font-black text-gold">Rs. {item.price * item.qty}</p>
                                </div>
                            ))}
                        </div>

                        {/* Total + Payment */}
                        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-end">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest mb-2 text-soft-white/30">Payment</p>
                                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                    order.isPaid 
                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-gold/10 text-gold border-gold/20'
                                }`}>
                                    {order.isPaid 
                                        ? <><CreditCard className="w-3.5 h-3.5" /> Prepaid</>
                                        : <><Banknote className="w-3.5 h-3.5" /> Cash on Delivery</>
                                    }
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-soft-white/30">Total</p>
                                <p className="text-3xl font-serif font-black text-white">Rs. {order.totalPrice}</p>
                            </div>
                        </div>
                    </section>

                    {/* Timeline */}
                    <section className="glass rounded-[2rem] border border-white/5 p-6 md:p-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gold flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Status Timeline
                        </h3>
                        <div className="space-y-5 relative ml-4">
                            <div className="absolute left-[-17px] top-2 bottom-2 w-0.5 bg-white/5" />
                            {order.statusHistory?.map((entry, idx) => (
                                <div key={idx} className="relative flex flex-col gap-1">
                                    <div className={`absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full border ${
                                        idx === order.statusHistory.length - 1 
                                            ? 'bg-gold border-gold/40 animate-pulse' 
                                            : 'bg-white/10 border-white/5'
                                    }`} />
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                        {entry.status.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-[9px] font-bold text-soft-white/20 uppercase">
                                        {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Right Column — Customer + Actions */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Customer Info */}
                    <section className="glass rounded-[2rem] border border-white/5 p-6 md:p-8 space-y-6">
                        <div className="text-center pb-6 border-b border-white/5">
                            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                <User className="w-7 h-7 text-gold/40" />
                            </div>
                            <h4 className="text-lg font-serif font-black text-white uppercase tracking-tighter leading-none">
                                {order.user?.firstName} {order.user?.lastName}
                            </h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <MapPin className="w-4 h-4 text-crimson shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-soft-white/30 mb-0.5">Address</p>
                                    <p className="text-xs font-bold text-white leading-relaxed">{order.shippingAddress?.address}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gold shrink-0" />
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-soft-white/30 mb-0.5">Phone</p>
                                    <p className="text-xs font-bold text-white">{order.shippingAddress?.phoneNumber}</p>
                                </div>
                            </div>
                        </div>

                        {/* Advanced Map Integration */}
                        <div className="pt-4 border-t border-white/5">
                            <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-gold/40 mb-4 flex items-center gap-2">
                                <MapPin className="w-3 h-3" /> Live Delivery Route
                            </h5>
                            <RiderMap order={order} riderLoc={location} allOrders={myOrders} />
                        </div>
                    </section>

                    {/* Action Panel — ALL buttons use btn-gold */}
                    <div className="space-y-4">
                        {order.status === 'READY_FOR_DELIVERY' && (
                            <button 
                                onClick={() => handleAction('claim')} 
                                disabled={actionLoading}
                                className="btn-gold w-full py-5 rounded-2xl text-[10px] flex items-center justify-center gap-3"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : (
                                    <><PackageCheck className="w-5 h-5" /> Accept Order</>
                                )}
                            </button>
                        )}

                        {order.status === 'ASSIGNED' && (
                            <button 
                                onClick={() => handleAction('accept')} 
                                disabled={actionLoading}
                                className="btn-gold w-full py-5 rounded-2xl text-[10px] flex items-center justify-center gap-3"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : (
                                    <><CheckCircle className="w-5 h-5" /> Confirm Assignment</>
                                )}
                            </button>
                        )}

                        {order.status === 'ACCEPTED' && (
                            <button 
                                onClick={() => handleAction('pickup')} 
                                disabled={actionLoading}
                                className="btn-gold w-full py-5 rounded-2xl text-[10px] flex items-center justify-center gap-3"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : (
                                    <><Truck className="w-5 h-5" /> Start Delivery</>
                                )}
                            </button>
                        )}

                        {order.status === 'PICKED_UP' && (
                            <button 
                                onClick={() => handleAction('arrive')} 
                                disabled={actionLoading}
                                className="btn-gold w-full py-5 rounded-2xl text-[10px] flex items-center justify-center gap-3"
                            >
                                {actionLoading ? <div className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" /> : (
                                    <><Navigation className="w-5 h-5" /> Mark Arrived</>
                                )}
                            </button>
                        )}

                        {order.status === 'ARRIVED' && (
                            <div className="space-y-4">
                                {/* COD Flow: Step 1 — Collect Cash */}
                                {order.paymentMethod === 'cod' && !codConfirmed && (
                                    <>
                                        <div className="glass-gold p-6 rounded-2xl border border-gold/20 flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                                                <Banknote className="w-6 h-6 text-gold" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-1">Payment to Collect</p>
                                                <h4 className="text-2xl font-serif font-black text-white leading-none">Rs. {order.totalPrice}</h4>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleCollectCash} 
                                            className="w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl bg-gold text-charcoal shadow-gold/20 hover:bg-gold/90 hover:scale-[1.02] active:scale-95"
                                        >
                                            <Banknote className="w-5 h-5" /> Collect Rs. {order.totalPrice}
                                        </button>
                                    </>
                                )}

                                {/* COD Flow: Step 2 — Mark Delivered (after collection) */}
                                {order.paymentMethod === 'cod' && codConfirmed && (
                                    <>
                                        <div className="glass p-4 rounded-2xl border border-green-500/20 flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Rs. {order.totalPrice} Collected</p>
                                        </div>
                                        <button 
                                            onClick={() => handleAction('deliver')} 
                                            disabled={actionLoading}
                                            className="w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl bg-green-500 text-white shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95"
                                        >
                                            {actionLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                <><CheckCircle className="w-5 h-5" /> Mark Delivered</>
                                            )}
                                        </button>
                                    </>
                                )}

                                {/* Non-COD: Direct Deliver */}
                                {order.paymentMethod !== 'cod' && (
                                    <button 
                                        onClick={() => handleAction('deliver')} 
                                        disabled={actionLoading}
                                        className="w-full py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-2xl bg-green-500 text-white shadow-green-500/20 hover:bg-green-600 hover:scale-[1.02] active:scale-95"
                                    >
                                        {actionLoading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                            <><CheckCircle className="w-5 h-5" /> Mark Delivered</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Info Notice */}
                        <div className="glass rounded-2xl border border-white/5 p-5 text-center">
                            <AlertCircle className="w-5 h-5 text-soft-white/15 mx-auto mb-2" />
                            <p className="text-[8px] text-soft-white/30 font-black uppercase tracking-widest leading-relaxed">
                                Verify customer identity before completing delivery
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
