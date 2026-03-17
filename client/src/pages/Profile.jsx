import React, { useState } from 'react';
import { useProfile } from '../context/UserContext';
import { User, MapPin, Award, Heart, Edit3, Save, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { profile, updateProfile, loading } = useProfile();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
  });

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // toast handled in context
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
        <p className="text-gold font-medium">Loading your profile...</p>
    </div>
  );

  const tierStats = {
    Silver: { color: 'text-gray-300', next: 'Gold', target: 500 },
    Gold: { color: 'text-gold', next: 'Platinum', target: 2000 },
    Platinum: { color: 'text-blue-300', next: 'Elite', target: 5000 },
  };

  const currentTier = profile?.loyaltyTier || 'Silver';
  const progress = Math.min((profile?.loyaltyPoints || 0) / (tierStats[currentTier]?.target || 1000) * 100, 100);

  const deleteAddress = async (index) => {
    const newAddresses = profile.addresses.filter((_, i) => i !== index);
    try {
      await updateProfile({ ...formData, addresses: newAddresses });
    } catch (error) {
      // toast in context
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      {/* Profile Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
        <div className="lg:col-span-1 bg-white/[0.02] backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] text-center relative overflow-hidden">
            <div className="w-24 h-24 bg-charcoal border-4 border-gold rounded-full flex items-center justify-center mx-auto mb-4 relative z-10 shadow-2xl">
              <User className="w-12 h-12 text-gold" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-1">{profile?.firstName}</h2>
            <p className="text-gray-500 text-xs mb-4">{profile?.email}</p>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${tierStats[currentTier]?.color} border-current bg-white/5 text-[8px] font-black uppercase tracking-widest`}>
              <Award className="w-3 h-3" /> {currentTier} Member
            </div>
        </div>

        <div className="lg:col-span-3 grid grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-white mb-1">{profile?.totalOrders || 0}</span>
                <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest">Total Orders</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-white mb-1">Rs. {profile?.totalSpent || 0}</span>
                <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest">Money Spent</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] flex flex-col items-center justify-center">
                <span className="text-4xl font-serif font-bold text-white mb-1">{profile?.loyaltyPoints || 0}</span>
                <span className="text-gold/60 text-[10px] uppercase font-black tracking-widest">Reward Points</span>
            </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-4 mb-8 justify-center">
          {['info', 'addresses', 'favorites'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                    activeTab === tab 
                    ? 'bg-gold text-charcoal shadow-lg shadow-gold/20 scale-105' 
                    : 'bg-white/5 text-gray-500 hover:text-white'
                }`}
              >
                  {tab === 'info' ? 'My Details' : tab === 'addresses' ? 'My Addresses' : 'Favorites'}
              </button>
          ))}
      </div>

      {/* Tab Content */}
      <div className="max-w-4xl mx-auto">
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
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">First Name</label>
                        <input 
                            disabled={!isEditing}
                            className={`w-full bg-white/5 border rounded-2xl p-4 outline-none transition-all ${isEditing ? 'border-gold/30 focus:border-gold text-white' : 'border-white/5 text-gray-500'}`}
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gold/40 ml-1">Last Name</label>
                        <input 
                            disabled={!isEditing}
                            className={`w-full bg-white/5 border rounded-2xl p-4 outline-none transition-all ${isEditing ? 'border-gold/30 focus:border-gold text-white' : 'border-white/5 text-gray-500'}`}
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
                <h3 className="text-2xl font-serif font-bold text-white mb-8">Delivery Locations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profile?.addresses?.length > 0 ? profile.addresses.map((addr, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl relative group hover:border-gold transition-all">
                            <p className="text-white font-bold mb-1">{addr.address}</p>
                            <p className="text-gray-500 text-xs">{addr.city}</p>
                            <button 
                                onClick={() => deleteAddress(i)}
                                className="absolute top-4 right-4 text-gray-600 hover:text-crimson opacity-0 group-hover:opacity-100 transition-all p-2 rounded-lg"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )) : (
                        <div className="md:col-span-2 text-center py-12 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <p className="text-gray-500 italic mb-4">You haven't added any addresses yet</p>
                            <button className="text-gold font-bold text-xs uppercase tracking-widest">+ Add New</button>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3rem]">
                <h3 className="text-2xl font-serif font-bold text-white mb-8">My Favorite Foods</h3>
                <div className="text-center py-12">
                     <Heart className="w-12 h-12 text-crimson/20 mx-auto mb-4" />
                     <p className="text-gray-500 italic">Save your favorite dishes from the menu to see them here.</p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Profile;
