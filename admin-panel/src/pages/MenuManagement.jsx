import React, { useState, useEffect } from 'react';
import api, { socket } from '../services/api';
import { Plus, Edit, Trash2, Search, X, Image as ImageIcon, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Food',
    image: '',
    countInStock: 0,
    isSpecial: false,
    isVegetarian: false,
    spicyLevel: 0
  });

  useEffect(() => {
    fetchItems();
    fetchCategories();
    
    // Listen for real-time updates from other admin sessions or system
    socket.on('menuUpdated', fetchItems);
    
    // Listen for admin actions (in case multiple admins are working)
    socket.on('adminAction', (data) => {
      if (data?.type?.includes('category')) {
        fetchCategories();
      }
      if (data?.type === 'menuUpdate') {
        fetchItems();
      }
    });
    
    return () => {
      socket.off('menuUpdated');
      socket.off('adminAction');
    };
  }, []);

  const fetchItems = async () => {
    try {
      const { data } = await api.get('/products');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
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
      setCategories([]);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty ❌');
      return;
    }
    
    if (categories.includes(newCategoryName)) {
      toast.error('Category already exists ❌');
      return;
    }

    const loadingToast = toast.loading('Adding category...');
    try {
      // Save category to backend
      await api.post('/categories', { name: newCategoryName });
      
      // Update local state
      setCategories([...categories, newCategoryName]);
      const categoryName = newCategoryName;
      setNewCategoryName('');
      
      // Broadcast socket event to all clients
      socket.emit('adminAction', { type: 'categoryAdded', category: categoryName });
      
      toast.dismiss(loadingToast);
      toast.success(`${categoryName} category added successfully ✅`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to add category ❌');
    }
  };

  const handleEditCategory = (index, categoryName) => {
    setEditingCategoryId(index);
    setEditingCategoryName(categoryName);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryName.trim()) {
      toast.error('Category name cannot be empty ❌');
      return;
    }

    if (categories.includes(editingCategoryName) && editingCategoryName !== categories[editingCategoryId]) {
      toast.error('Category name already exists ❌');
      return;
    }

    const loadingToast = toast.loading('Updating category...');
    try {
      const oldName = categories[editingCategoryId];
      const updatedCategories = [...categories];
      updatedCategories[editingCategoryId] = editingCategoryName;
      setCategories(updatedCategories);

      // Update all products that use this category
      const productsToUpdate = items.filter(item => item.category === oldName);
      for (const product of productsToUpdate) {
        await api.put(`/products/${product._id}`, { ...product, category: editingCategoryName });
      }

      // Delete old category from backend and add new one
      await api.delete(`/categories/${oldName}`);
      await api.post('/categories', { name: editingCategoryName });

      // Broadcast socket event
      socket.emit('adminAction', { type: 'categoryUpdated', oldCategory: oldName, newCategory: editingCategoryName });
      
      toast.dismiss(loadingToast);
      toast.success(`Category updated to "${editingCategoryName}" ✅`);
      setEditingCategoryId(null);
      setEditingCategoryName('');
      fetchItems();
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.message || 'Failed to update category ❌');
    }
  };

  const handleDeleteCategory = async (index) => {
    const categoryName = categories[index];
    const productsInCategory = items.filter(item => item.category === categoryName);

    if (productsInCategory.length > 0) {
      toast.error(`Cannot delete "${categoryName}" - it has ${productsInCategory.length} product(s) ❌`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${categoryName}" category?`)) {
      const loadingToast = toast.loading('Deleting category...');
      try {
        // Delete from backend
        await api.delete(`/categories/${categoryName}`);
        
        // Update local state
        const updatedCategories = categories.filter((_, i) => i !== index);
        setCategories(updatedCategories);
        
        // Broadcast socket event
        socket.emit('adminAction', { type: 'categoryDeleted', category: categoryName });
        
        toast.dismiss(loadingToast);
        toast.success(`Category "${categoryName}" deleted successfully 🗑️`);
        setEditingCategoryId(null);
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error(error.response?.data?.message || 'Failed to delete category ❌');
      }
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        countInStock: item.countInStock || 0,
        isSpecial: item.isSpecial || false,
        isVegetarian: item.isVegetarian || false,
        spicyLevel: item.spicyLevel || 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'Food',
        image: '',
        countInStock: 10,
        isSpecial: false,
        isVegetarian: false,
        spicyLevel: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const loadingToast = toast.loading(editingItem ? 'Updating product...' : 'Adding product...');
      if (editingItem) {
        await api.put(`/products/${editingItem._id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      toast.dismiss(loadingToast);
      toast.success(editingItem ? 'Product updated successfully ✅' : 'Product added successfully ✅');
      socket.emit('adminAction', { type: 'menuUpdate' });
      fetchItems();
      handleCloseModal();
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || 'Failed to save product ❌');
      console.error('Failed to save item', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exquisite item?')) {
      try {
        const loadingToast = toast.loading('Deleting product...');
        await api.delete(`/products/${id}`);
        toast.dismiss(loadingToast);
        toast.success('Product deleted successfully 🗑️');
        socket.emit('adminAction', { type: 'menuUpdate' });
        fetchItems();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || 'Failed to delete product ❌');
        console.error('Failed to delete item', error);
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black text-soft-white tracking-tighter">Menu <span className="text-gold">Registry</span></h1>
          <p className="text-soft-white/50 mt-1 sm:mt-2 uppercase text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-[0.2em]">AK-7 REST CULINARY DATABASE</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn-gold flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Add Category</span>
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="btn-gold flex items-center justify-center space-x-2 py-3 px-6 rounded-2xl w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-widest">Add Masterpiece</span>
          </button>
        </div>
      </header>

      <div className="glass rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold w-5 h-5 opacity-70" />
            <input
              type="text"
              placeholder="Search delicacies..."
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
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold">Item Details</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold">Category</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-center">Price</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-center">In Stock</th>
                <th className="px-4 sm:px-8 py-4 sm:py-5 font-bold text-right">Refinement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center text-soft-white/30 italic">No delicacies match your search.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center space-x-3 sm:space-x-5">
                        <div className="relative group/img">
                          <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover glass-gold p-1 flex-shrink-0" onerror="this.src='https://placehold.co/100x100?text=Food'"/>
                          <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl sm:rounded-2xl"></div>
                        </div>
                        <div>
                          <p className="font-bold text-soft-white group-hover:text-gold transition-colors text-base sm:text-lg">{item.name}</p>
                          <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 sm:mt-2">
                            {item.isVegetarian && <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 uppercase tracking-tighter">VEG</span>}
                            {item.isSpecial && <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 uppercase tracking-tighter">SPECIAL</span>}
                            {item.spicyLevel > 0 && <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-crimson/10 text-crimson border border-crimson/20 uppercase tracking-tighter">SPICY {item.spicyLevel}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-[10px] sm:text-sm">
                      <span className="text-soft-white/60 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 font-bold text-gold text-center text-base sm:text-lg">
                      Rs. {item.price}
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center">
                      <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold ${item.countInStock < 5 ? 'bg-crimson/10 text-crimson border border-crimson/10' : 'bg-white/5 text-soft-white/60'}`}>
                        {item.countInStock}
                      </span>
                    </td>
                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                      <div className="flex justify-end gap-2 sm:gap-4">
                        <button 
                          onClick={() => handleOpenModal(item)}
                          className="p-2 sm:p-2.5 text-soft-white/40 hover:text-gold hover:bg-gold/10 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item._id)}
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
                  {editingItem ? 'Refine Delicacy' : 'New Culinary Piece'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-soft-white/50 hover:text-soft-white">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Item Name</label>
                    <input 
                      required
                      placeholder="e.g., Truffle-Infused Risotto"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all text-xl" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Category</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                    >
                      {categories.map(cat => (
                        <option key={cat} className="bg-charcoal" value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Price (Rs.)</label>
                    <input 
                      type="number"
                      required
                      placeholder="0.00"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-gold focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all text-xl" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Description</label>
                    <textarea 
                      required
                      placeholder="The artistic vision behind this dish..."
                      rows="4"
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all resize-none" 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>

                  <div className="space-y-4 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70">Visual Identity (Image URL)</label>
                    <div className="flex gap-4 items-center">
                      <input 
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-soft-white text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                      />
                      <div className="w-16 h-16 rounded-2xl glass-gold p-1 flex items-center justify-center border border-white/10 overflow-hidden flex-shrink-0">
                         {formData.image ? <img src={formData.image} className="object-cover w-full h-full rounded-xl" /> : <ImageIcon className="text-gold/30 w-8 h-8"/>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 glass p-6 rounded-2xl border border-white/5">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70 block mb-4">Culinary Traits</label>
                    <div className="flex flex-col gap-5">
                      <label className="flex items-center space-x-4 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isVegetarian ? 'bg-gold border-gold' : 'border-white/20'}`}>
                           {formData.isVegetarian && <div className="w-2 h-2 bg-charcoal rounded-full"></div>}
                        </div>
                        <input type="checkbox" className="hidden" checked={formData.isVegetarian} onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})}/>
                        <span className="text-soft-white/70 group-hover:text-soft-white transition-colors">Vegetarian Mastery</span>
                      </label>
                      <label className="flex items-center space-x-4 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.isSpecial ? 'bg-gold border-gold' : 'border-white/20'}`}>
                           {formData.isSpecial && <div className="w-2 h-2 bg-charcoal rounded-full"></div>}
                        </div>
                        <input type="checkbox" className="hidden" checked={formData.isSpecial} onChange={(e) => setFormData({...formData, isSpecial: e.target.checked})}/>
                        <span className="text-soft-white/70 group-hover:text-soft-white transition-colors">Midnight Special</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6 glass p-6 rounded-2xl border border-white/5">
                    <label className="text-xs font-bold uppercase tracking-widest text-gold opacity-70 block mb-4">Master Metrics</label>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-soft-white/40 tracking-tighter">Inventory</span>
                        <input 
                          type="number"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gold font-bold focus:outline-none focus:border-gold/30" 
                          value={formData.countInStock}
                          onChange={(e) => setFormData({...formData, countInStock: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-soft-white/40 tracking-tighter">Spiciness</span>
                        <input 
                          type="number" min="0" max="3"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-crimson font-bold focus:outline-none focus:border-crimson/30" 
                          value={formData.spicyLevel}
                          onChange={(e) => setFormData({...formData, spicyLevel: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 flex flex-col-reverse sm:flex-row justify-end gap-4 md:gap-6 sticky bottom-0 bg-charcoal/90 backdrop-blur-md p-5 md:p-8 border-t border-white/5">
                  <button 
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-none px-8 py-3 text-soft-white/50 hover:text-soft-white transition-colors font-bold uppercase tracking-widest text-xs md:text-sm"
                  >
                    Discard
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 sm:flex-none btn-gold px-12 py-3 text-sm md:text-lg flex items-center justify-center gap-3 rounded-2xl"
                  >
                    <Save className="w-5 h-5 md:w-6 md:h-6" />
                    <span>{editingItem ? 'Update Piece' : 'Seal Creation'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategoryId(null);
              }}
              className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
            ></motion.div>
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="glass rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 shadow-[0_32px_128px_rgba(0,0,0,0.5)] border border-white/10"
            >
              <div className="bg-charcoal/80 backdrop-blur-xl p-5 md:p-8 border-b border-white/5 flex items-center justify-between sticky top-0">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-gold tracking-tighter">
                  Manage Categories
                </h2>
                <button 
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategoryId(null);
                  }} 
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-soft-white/50 hover:text-soft-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-8">
                {/* Add New Category Section */}
                <div className="glass p-6 rounded-2xl border border-white/5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold opacity-70 mb-4">Add New Category</h3>
                  <form onSubmit={handleAddCategory} className="flex gap-4">
                    <input 
                      required
                      placeholder="e.g., Appetizers, Desserts"
                      className="flex-1 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all" 
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button 
                      type="submit"
                      className="btn-gold px-8 py-3 text-sm flex items-center justify-center gap-2 rounded-2xl whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </form>
                </div>

                {/* Categories List Section */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gold opacity-70 mb-4">
                    All Categories ({categories.length})
                  </h3>
                  
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {categories.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="py-8 text-center text-soft-white/30 italic glass p-6 rounded-2xl border border-white/5"
                        >
                          No categories yet. Create one to get started.
                        </motion.div>
                      ) : (
                        categories.map((category, index) => (
                          <motion.div
                            layout
                            key={`${category}-${index}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="glass p-5 rounded-2xl border border-white/5 hover:border-gold/20 transition-all group flex items-center justify-between"
                          >
                            <div className="flex-1">
                              {editingCategoryId === index ? (
                                <div className="flex items-center gap-3">
                                  <input 
                                    autoFocus
                                    type="text"
                                    value={editingCategoryName}
                                    onChange={(e) => setEditingCategoryName(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-gold/30 text-soft-white focus:outline-none focus:ring-2 focus:ring-gold/30 transition-all"
                                    placeholder="Category name"
                                  />
                                  <button
                                    onClick={handleUpdateCategory}
                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-500 rounded-lg transition-all"
                                    title="Save changes"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCategoryId(null);
                                      setEditingCategoryName('');
                                    }}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-soft-white/50 rounded-lg transition-all"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <span className="text-soft-white font-medium group-hover:text-gold transition-colors">{category}</span>
                                  <span className="text-[10px] text-soft-white/40 font-bold uppercase tracking-tighter ml-auto">
                                    ({items.filter(item => item.category === category).length} products)
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {editingCategoryId !== index && (
                              <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => handleEditCategory(index, category)}
                                  className="p-2 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition-all"
                                  title="Edit category"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCategory(index)}
                                  className="p-2 bg-crimson/20 hover:bg-crimson/30 text-crimson rounded-lg transition-all"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end pt-4 border-t border-white/5">
                  <button 
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      setEditingCategoryId(null);
                    }}
                    className="px-8 py-3 bg-gold hover:bg-yellow-400 text-charcoal font-bold uppercase tracking-widest text-sm rounded-2xl transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MenuManagement;
