import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { Plus, Edit, Trash2, Search, X, Tag, Save, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DealManagement = () => {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercentage: 0,
    discountAmount: 0,
    productId: '',
    category: '',
    isActive: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    image: ''
  });

  useEffect(() => {
    fetchDeals();
    fetchProducts();
    fetchCategories();
    
    socket.on('dealCreated', fetchDeals);
    socket.on('dealUpdated', fetchDeals);
    socket.on('dealDeleted', fetchDeals);
    
    return () => {
      socket.off('dealCreated');
      socket.off('dealUpdated');
      socket.off('dealDeleted');
    };
  }, []);

  const fetchDeals = async () => {
    try {
      const { data } = await api.get('/deals');
      setDeals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch deals', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      if (Array.isArray(data)) {
        setCategories(data.map(cat => typeof cat === 'string' ? cat : cat.name));
      }
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const handleOpenModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      setFormData({
        title: deal.title,
        description: deal.description || '',
        discountPercentage: deal.discountPercentage || 0,
        discountAmount: deal.discountAmount || 0,
        productId: deal.productId?._id || deal.productId || '',
        category: deal.category || '',
        isActive: deal.isActive !== false,
        startDate: deal.startDate ? deal.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: deal.endDate ? deal.endDate.split('T')[0] : '',
        image: deal.image || ''
      });
    } else {
      setEditingDeal(null);
      setFormData({
        title: '',
        description: '',
        discountPercentage: 0,
        discountAmount: 0,
        productId: '',
        category: '',
        isActive: true,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        image: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.title || (formData.discountPercentage === 0 && formData.discountAmount === 0)) {
        toast.error('Please provide title and at least one discount type ❌');
        return;
      }

      const loadingToast = toast.loading(editingDeal ? 'Updating deal...' : 'Creating deal...');
      const payload = {
        ...formData,
        discountPercentage: parseFloat(formData.discountPercentage),
        discountAmount: parseFloat(formData.discountAmount),
        productId: formData.productId || null,
        category: formData.category || null
      };

      if (editingDeal) {
        await api.put(`/deals/${editingDeal._id}`, payload);
      } else {
        await api.post('/deals', payload);
      }
      
      toast.dismiss(loadingToast);
      toast.success(editingDeal ? 'Deal updated successfully ✅' : 'Deal created successfully 🎉');
      socket.emit('adminAction', { type: 'dealUpdate' });
      fetchDeals();
      handleCloseModal();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to save deal ❌');
      console.error('Failed to save deal', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this deal?')) {
      try {
        const loadingToast = toast.loading('Deleting deal...');
        await api.delete(`/deals/${id}`);
        toast.dismiss(loadingToast);
        toast.success('Deal deleted successfully 🗑️');
        socket.emit('adminAction', { type: 'dealUpdate' });
        fetchDeals();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || 'Failed to delete deal ❌');
        console.error('Failed to delete deal', error);
      }
    }
  };

  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.productId?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (deal.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductName = (productId) => {
    if (!productId) return 'Category Deal';
    const product = products.find(p => p._id === productId._id || p._id === productId);
    return product?.name || 'Unknown Product';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">Deal <span className="text-gold">Management</span></h1>
          <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">CREATE PROMOTIONS & SPECIAL OFFERS</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-gold flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Create Deal</span>
        </button>
      </header>

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5 opacity-70" />
            <input
              type="text"
              placeholder="Search deals..."
              className="w-full pl-12 pr-6 py-3 rounded-2xl bg-charcoal border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-soft-white/40 text-[8px] sm:text-[10px] uppercase tracking-[0.2em]">
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold">Deal Title</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold">Target</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-center">Discount</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-center">Status</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredDeals.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-soft-white/30 italic">No deals created yet.</td></tr>
              ) : (
                filteredDeals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center space-x-3">
                        <Tag className="w-5 h-5 text-gold flex-shrink-0" />
                        <div>
                          <p className="font-bold text-soft-white group-hover:text-gold transition-colors text-base">{deal.title}</p>
                          <p className="text-soft-white/50 text-sm mt-1">{deal.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-[10px] sm:text-sm">
                      <span className="text-soft-white/60 font-medium">
                        {deal.productId ? getProductName(deal.productId) : (deal.category || 'All Products')}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-gold text-center text-base">
                      {deal.discountPercentage > 0 ? `${deal.discountPercentage}%` : `Rs. ${deal.discountAmount}`}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${deal.isActive ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                      <div className="flex justify-end gap-2 sm:gap-4">
                        <button 
                          onClick={() => handleOpenModal(deal)}
                          className="p-2 sm:p-2.5 text-soft-white/40 hover:text-gold hover:bg-gold/10 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(deal._id)}
                          className="p-2 sm:p-2.5 text-soft-white/40 hover:text-crimson hover:bg-crimson/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="glass rounded-[32px] w-full max-w-4xl max-h-full overflow-y-auto relative z-10 shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="sticky top-0 bg-charcoal/80 backdrop-blur-xl p-5 md:p-8 border-b border-white/5 flex items-center justify-between z-20">
                <h2 className="text-xl md:text-3xl font-serif font-bold text-gold tracking-tighter">
                  {editingDeal ? 'Edit Deal' : 'Create New Deal'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-soft-white/50 hover:text-soft-white">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Deal Title</label>
                    <input 
                      required
                      placeholder="e.g., Summer Feast Sale"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all text-xl" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Description</label>
                    <textarea 
                      placeholder="Describe this amazing deal..."
                      rows="3"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all resize-none" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Apply To (Product or Category)</label>
                    <div className="space-y-3">
                      <select 
                        className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all [&>option]:bg-black [&>option]:text-white"
                        value={formData.productId}
                        onChange={(e) => setFormData({...formData, productId: e.target.value})}
                      >
                        <option value="">Select Product (Optional)</option>
                        {products.map(product => (
                          <option key={product._id} value={product._id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Or Category</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all [&>option]:bg-black [&>option]:text-white"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="">Select Category (Optional)</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Discount %</label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-gold focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                      value={formData.discountPercentage}
                      onChange={(e) => setFormData({...formData, discountPercentage: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Or Fixed Amount (Rs.)</label>
                    <input 
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-gold focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({...formData, discountAmount: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Start Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">End Date</label>
                    <input 
                      type="date"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-6 glass p-6 rounded-2xl border border-white/5 md:col-span-2">
                    <label className="flex items-center space-x-4 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isActive ? 'bg-gold border-gold' : 'border-white/20'}`}>
                         {formData.isActive && <div className="w-2 h-2 bg-charcoal rounded-full"></div>}
                      </div>
                      <input type="checkbox" className="hidden" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})}/>
                      <span className="text-soft-white/70 group-hover:text-soft-white transition-colors">Activate Deal Now</span>
                    </label>
                  </div>
                </div>

                <div className="pt-10 flex flex-col-reverse sm:flex-row justify-end gap-4 md:gap-6 sticky bottom-0 bg-charcoal/90 backdrop-blur-md p-5 md:p-8 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-none px-8 py-3 text-soft-white/50 hover:text-soft-white transition-colors font-bold uppercase tracking-widest text-xs md:text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 sm:flex-none btn-gold px-12 py-3 text-sm md:text-lg flex items-center justify-center gap-3 rounded-2xl"
                  >
                    <Save className="w-5 h-5 md:w-6 md:h-6" />
                    <span>{editingDeal ? 'Update Deal' : 'Create Deal'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DealManagement;
