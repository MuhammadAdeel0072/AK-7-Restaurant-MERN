import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import { 
  Clock, CheckCircle, Truck, Package, MapPin, ArrowLeft, 
  RefreshCw, Smartphone, Navigation, Bike, MoreHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useSocket } from '../context/SocketContext';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '2rem'
};

const mapOptions = {
    styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
          featureType: "administrative.locality",
          elementType: "labels.text.fill",
          stylers: [{ color: "#d59563" }],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#38414e" }],
        },
        {
          featureType: "road",
          elementType: "geometry.stroke",
          stylers: [{ color: "#212a37" }],
        },
        {
          featureType: "road",
          elementType: "labels.text.fill",
          stylers: [{ color: "#9ca5b3" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
    ],
    disableDefaultUI: true,
    zoomControl: true,
};

const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState(null);
  const { socket, notifications } = useSocket();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  const fetchOrder = async () => {
    try {
      const data = await getOrderById(id);
      setOrder(data);
      if (data.riderLocation) {
        setRiderLocation({ lat: data.riderLocation.lat, lng: data.riderLocation.lng });
      }
    } catch (error) {
      toast.error('Failed to synchronize order trajectory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join', id);
      
      socket.on('orderUpdate', (updatedOrder) => {
        if (updatedOrder._id === id) {
          setOrder(updatedOrder);
          toast.success(`Order Status: ${updatedOrder.status.toUpperCase()}`);
        }
      });

      socket.on('riderLocationUpdate', (data) => {
        if (data.orderId === id) {
          setRiderLocation({ lat: data.lat, lng: data.lng });
        }
      });

      return () => {
        socket.off('orderUpdate');
        socket.off('riderLocationUpdate');
      };
    }
  }, [socket, id]);

  const steps = [
    { status: 'placed', label: 'Order Received', icon: Package, desc: 'We have received your order.' },
    { status: 'preparing', label: 'Preparing', icon: Clock, desc: 'Our chefs are cooking your meal.' },
    { status: 'ready', label: 'Ready', icon: CheckCircle, desc: 'Order is ready for pickup.' },
    { status: 'picked-up', label: 'Picked by Rider', icon: Bike, desc: 'Rider has picked up your order.' },
    { status: 'out-for-delivery', label: 'Out for Delivery', icon: Navigation, desc: 'Rider is on the way.' },
    { status: 'delivered', label: 'Delivered', icon: MapPin, desc: 'Order delivered.' },
  ];

  const currentStep = steps.findIndex(s => s.status === order?.status);

  // Calculations
  const getETA = () => {
    if (!order) return '-- mins';
    const orderTime = new Date(order.createdAt);
    const minETA = new Date(orderTime.getTime() + 35 * 60000);
    return minETA.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-charcoal">
      <div className="relative">
        <RefreshCw className="w-16 h-16 text-gold animate-spin" />
        <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full"></div>
      </div>
      <p className="text-gold font-serif text-2xl italic tracking-widest animate-pulse">UPDATING STATUS...</p>
    </div>
  );

  if (!order) return <div className="text-center py-24 text-white font-serif italic text-2xl">Order Not Found.</div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
            <Link to="/orders" className="flex items-center gap-2 text-gold/40 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-4 group">
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Return to Archives
            </Link>
            <h1 className="text-5xl font-serif font-black text-white italic tracking-tighter">
                ORDER <span className="text-gold">#{order.orderNumber}</span>
            </h1>
        </div>
        <div className="card-premium bg-gold/10 border-gold/20 p-6 flex items-center gap-6 shadow-[0_0_50px_rgba(212,175,55,0.1)]">
            <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-gold/60 mb-1">Estimated Arrival</p>
                <p className="text-3xl font-serif font-black text-white italic">{getETA()}</p>
            </div>
            <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center border border-gold/30">
                <Navigation className="text-gold w-6 h-6 animate-pulse" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Tracker Sidebar */}
        <div className="lg:col-span-1 space-y-4">
            <div className="card-premium p-8 space-y-8">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold/40 border-b border-white/5 pb-4">Order Status</h3>
                <div className="space-y-8 relative">
                    <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-white/5"></div>
                    {steps.map((s, i) => (
                        <div key={i} className={`flex gap-6 relative z-10 transition-all duration-500 ${i <= currentStep ? 'opacity-100' : 'opacity-20'}`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-700 ${
                                i === currentStep ? 'bg-gold border-gold text-charcoal scale-110 shadow-[0_0_30px_rgba(212,175,55,0.3)]' : 
                                i < currentStep ? 'bg-gold/10 border-gold/40 text-gold' : 'bg-white/5 border-white/10 text-gray-500'
                            }`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <h4 className={`font-black text-xs uppercase tracking-widest ${i === currentStep ? 'text-white' : 'text-gray-500'}`}>{s.label}</h4>
                                <p className="text-[10px] text-gray-600 mt-1 font-medium">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="card-premium p-8 bg-charcoal/40">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <Smartphone className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gold/40">Help Center</p>
                        <p className="text-white font-bold text-sm">+92 300 0000000</p>
                    </div>
                </div>
                <button className="w-full py-4 rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                    Call for Help
                </button>
            </div>
        </div>

        {/* Center/Right: Map & Info */}
        <div className="lg:col-span-2 space-y-12">
            <div className="card-premium p-4 h-[450px] relative overflow-hidden group">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={riderLocation || { lat: 33.6844, lng: 73.0479 }} // Default to Islamabad
                    zoom={14}
                    options={mapOptions}
                  >
                    {/* Restaurant Marker */}
                    <Marker 
                        position={{ lat: 33.6844, lng: 73.0479 }} 
                        label="AK-7 REST"
                    />
                    
                    {/* Rider Marker */}
                    {riderLocation && (
                        <Marker 
                            position={riderLocation}
                            icon={{
                                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 6,
                                fillColor: "#D4AF37",
                                fillOpacity: 0.9,
                                strokeWeight: 2,
                                rotation: 0,
                            }}
                        />
                    )}
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full bg-white/5 rounded-[2rem] flex items-center justify-center italic text-gold/20">
                    Initializing Satellite Uplink...
                  </div>
                )}
                
                <div className="absolute top-8 left-8 card-premium bg-black/80 backdrop-blur-xl p-6 border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-2 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        Live Tracking
                    </p>
                    <p className="text-white font-serif italic text-lg leading-tight uppercase font-black tracking-tighter">
                        {order.status.replace('-', ' ')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold/40 border-b border-white/5 pb-4">Delivery Details</h3>
                    <div className="flex gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-3xl flex items-center justify-center shrink-0">
                            <MapPin className="text-gold w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-serif text-xl font-bold leading-snug">
                                {order.shippingAddress.fullName}
                            </p>
                            <p className="text-gray-500 text-sm mt-1">
                                {order.shippingAddress.streetAddress}, {order.shippingAddress.area}<br/>
                                {order.shippingAddress.city} - {order.shippingAddress.postalCode}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gold/40 border-b border-white/5 pb-4">Payment Details</h3>
                    <div className="space-y-4">
                        {order.orderItems.map((item, i) => (
                            <div key={i} className="flex justify-between items-center group">
                                <span className="text-gray-400 text-sm group-hover:text-white transition-colors">{item.qty}x {item.name}</span>
                                <span className="text-white font-bold tracking-tighter italic">Rs. {item.price}</span>
                            </div>
                        ))}
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gold/40">Order Total</p>
                            <p className="text-4xl font-serif font-black text-gold italic">Rs. {order.totalPrice.toFixed(0)}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.isPaid ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gold/10 text-gold border border-gold/20'}`}>
                            {order.isPaid ? 'Paid Online' : 'COD Active'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracker;
