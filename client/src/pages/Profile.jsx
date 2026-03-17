import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/UserContext';
import { User, MapPin, Award, Heart, Edit3, Save, X, Trash2, ShoppingBag, Calendar, Clock, Users, ChevronRight } from 'lucide-react';
import { getMyOrders } from '../services/orderService';
import { getMyReservations } from '../services/reservationService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Profile = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
  });

  // Orders & reservations for tabs + stats calculations
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setOrdersLoading(true);
        const data = await getMyOrders();
        setOrders(data || []);
      } catch { /* no-op */ } finally { setOrdersLoading(false); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reservations') {
      const fetchRes = async () => {
        try {
          setReservationsLoading(true);
          const data = await getMyReservations();
          setReservations(data || []);
        } catch { /* no-op */ } finally { setReservationsLoading(false); }
      };
      fetchRes();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch { /* toast handled in context */ }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
      <p className="text-gold font-medium">Loading your profile...</p>
    </div>
  );

  // Compute stats from live order data
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const loyaltyPoints = profile?.loyaltyPoints || 0;

  // Loyalty tier progress
  const tierTargets = { Bronze: 200, Silver: 500, Gold: 2000, Platinum: 5000 };
  const tierColors = {
    Bronze:   'text-amber-600 border-amber-600/40',
    Silver:   'text-gray-300 border-gray-300/40',
    Gold:     'text-gold border-gold/40',
    Platinum: 'text-blue-300 border-blue-300/40',
  };
  const tierNextMap = { Bronze: 'Silver', Silver: 'Gold', Gold: 'Platinum', Platinum: 'Elite' };
  const currentTier = profile?.loyaltyTier || 'Bronze';
  const tierTarget = tierTargets[currentTier] || 200;
  const progress = Math.min((loyaltyPoints / tierTarget) * 100, 100);

  const deleteAddress = async (index) => {
    const newAddresses = profile.addresses.filter((_, i) => i !== index);
    try { await updateProfile({ ...formData, addresses: newAddresses }); } catch { /* no-op */ }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'delivered':        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'out-for-delivery': return 'text-gold bg-gold/10 border-gold/20';
      case 'ready':            return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'preparing':        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'cancelled':        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:                 return 'text-gray-400 bg-white/5 border-white/10';
    }
  };

  const getResStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':  return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'Cancelled':  return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Completed':  return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default:           return 'text-gold bg-gold/10 border-gold/20';
    }
  };

  const tabs = [
    { id: 'info',         label: 'My Details' },
    { id: 'orders',       label: 'My Orders' },
    { id: 'reservations', label: 'Bookings' },
    { id: 'addresses',    label: 'Addresses' },
    { id: 'favorites',    label: 'Favourites' },
  ];

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">

      {/* ── Profile Header ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
        {/* Avatar + tier */}
        <div className="lg:col-span-1 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] text-center relative overflow-hidden">
          <div className="w-24 h-24 bg-charcoal border-4 border-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
            {profile?.avatar
              ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
              : <User className="w-12 h-12 text-gold" />
            }
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mb-0.5">
            {profile?.firstName} {profile?.lastName}
          </h2>
          <p className="text-gray-500 text-xs mb-5">{profile?.email}</p>
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-white/5 text-[9px] font-black uppercase tracking-widest ${tierColors[currentTier]}`}>
            <Award className="w-3 h-3" /> {currentTier} Member
          </div>

          {/* Loyalty progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-[9px] text-gray-500 font-black uppercase tracking-widest mb-2">
              <span>{loyaltyPoints} pts</span>
              <span>{tierNextMap[currentTier]}: {tierTarget}</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold/60 to-gold rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center hover:border-gold/20 transition-all">
            <span className="text-4xl font-serif font-bold text-white mb-1">{totalOrders}</span>
            <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest text-center">Total Orders</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center hover:border-gold/20 transition-all">
            <span className="text-3xl font-serif font-bold text-white mb-1">Rs.{totalSpent.toFixed(0)}</span>
            <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest text-center">Total Spent</span>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center hover:border-gold/20 transition-all">
            <span className="text-4xl font-serif font-bold text-white mb-1">{loyaltyPoints}</span>
            <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest text-center">Reward Points</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-3 mb-8 flex-wrap justify-center">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-gold text-charcoal shadow-lg shadow-gold/20 scale-105'
                : 'bg-white/5 text-gray-500 hover:text-white border border-white/5 hover:border-white/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-5xl mx-auto">

        {/* MY DETAILS */}
        {activeTab === 'info' && (
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-serif font-bold text-white">Profile Details</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-gold hover:text-white transition-all text-xs font-black uppercase tracking-widest">
                  <Edit3 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-4">
                  <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                  <button onClick={handleSave} className="text-gold hover:text-white transition-all">
                    <Save className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { label: 'First Name', key: 'firstName' },
                { label: 'Last Name',  key: 'lastName'  },
                { label: 'Phone',      key: 'phone'      },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">{label}</label>
                  <input
                    disabled={!isEditing}
                    className={`w-full bg-white/5 border rounded-2xl p-4 outline-none transition-all ${
                      isEditing ? 'border-gold/30 focus:border-gold text-white' : 'border-white/5 text-gray-500'
                    }`}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">Email</label>
                <input
                  disabled
                  className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 outline-none text-gray-600"
                  value={profile?.email || ''}
                />
              </div>
            </div>
          </div>
        )}

        {/* MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-white">Order History</h3>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-28 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 p-16 rounded-[3rem] text-center">
                <ShoppingBag className="w-12 h-12 text-gold/20 mx-auto mb-6" />
                <p className="text-gray-500 font-medium">No orders yet.</p>
                <Link to="/menu" className="mt-4 inline-block text-gold text-xs font-black uppercase tracking-widest underline underline-offset-4">
                  Browse the Menu
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 hover:border-gold/20 transition-all group">
                  {/* Item thumbnails */}
                  <div className="flex gap-2 shrink-0">
                    {order.orderItems.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {order.orderItems.length > 3 && (
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400 font-black">
                        +{order.orderItems.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="text-white font-bold">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</h4>
                      <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-5 text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3 h-3" /> {order.orderItems.length} item{order.orderItems.length > 1 ? 's' : ''}
                      </span>
                      <span className="font-bold text-white">Rs. {order.totalPrice?.toFixed(0)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/track/${order._id}`}
                    className="flex items-center gap-2 bg-white/5 hover:bg-gold hover:text-charcoal border border-white/10 hover:border-gold px-5 py-3 rounded-2xl font-bold text-xs transition-all whitespace-nowrap"
                  >
                    View Details <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* MY RESERVATIONS */}
        {activeTab === 'reservations' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-white">My Bookings</h3>
            {reservationsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/[0.03] rounded-3xl animate-pulse border border-white/5" />
                ))}
              </div>
            ) : reservations.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 p-16 rounded-[3rem] text-center">
                <Calendar className="w-12 h-12 text-gold/20 mx-auto mb-6" />
                <p className="text-gray-500 font-medium">No bookings yet.</p>
                <Link to="/reservations" className="mt-4 inline-block text-gold text-xs font-black uppercase tracking-widest underline underline-offset-4">
                  Book a Table
                </Link>
              </div>
            ) : (
              reservations.map((res) => (
                <div key={res._id} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gold/20 transition-all">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gold/10 rounded-2xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-gold font-black text-lg leading-none">
                        {new Date(res.reservationDate).getDate()}
                      </span>
                      <span className="text-gold/60 text-[8px] uppercase font-black">
                        {new Date(res.reservationDate).toLocaleString('default', { month: 'short' })}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">{res.occasion || 'Regular Visit'}</h4>
                      <div className="flex flex-wrap gap-4 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gold/40" /> {res.reservationTime}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gold/40" /> {res.numberOfGuests} Guests</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${getResStatusColor(res.status)}`}>
                      {res.status}
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-widest ${res.paymentStatus === 'Paid' ? 'text-green-400' : 'text-amber-400'}`}>
                      {res.paymentStatus === 'Paid' ? 'Advance Paid ✓' : 'Advance Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
            <h3 className="text-2xl font-serif font-bold text-white mb-8">Delivery Locations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile?.addresses?.length > 0 ? profile.addresses.map((addr, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:border-gold transition-all">
                  <MapPin className="w-4 h-4 text-gold/40 mb-2" />
                  <p className="text-white font-bold mb-1">{addr.street || addr.address}</p>
                  <p className="text-gray-500 text-xs">{addr.city}</p>
                  <button
                    onClick={() => deleteAddress(i)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                  <MapPin className="w-10 h-10 text-gold/20 mx-auto mb-4" />
                  <p className="text-gray-500 italic mb-4">No saved addresses yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAVOURITES */}
        {activeTab === 'favorites' && (
          <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
            <h3 className="text-2xl font-serif font-bold text-white mb-8">My Favourite Foods</h3>
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-red-500/20 mx-auto mb-4" />
              <p className="text-gray-500 italic">Save your favourite dishes from the menu to see them here.</p>
              <Link to="/menu" className="mt-4 inline-block text-gold text-xs font-black uppercase tracking-widest underline underline-offset-4">
                Browse Menu
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
