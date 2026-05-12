import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Plus, Minus, Star, Clock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductDetailModal = ({ product, isOpen, onClose }) => {
    const { dispatch } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [qty, setQty] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState({});

    useEffect(() => {
        if (product) {
            if (product.variants && product.variants.length > 0) {
                setSelectedVariant(product.variants[0]);
            } else {
                setSelectedVariant(null);
            }
            setQty(1);
            setSelectedOptions({});
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleOptionToggle = (group, option) => {
        const groupName = group.name;
        const isSingle = group.type === 'single';

        setSelectedOptions(prev => {
            const currentGroupSelections = prev[groupName] || [];

            if (isSingle) {
                return { ...prev, [groupName]: [{ name: option.name, price: option.price }] };
            } else {
                const isSelected = currentGroupSelections.some(o => o.name === option.name);
                if (isSelected) {
                    return { ...prev, [groupName]: currentGroupSelections.filter(o => o.name !== option.name) };
                } else {
                    return { ...prev, [groupName]: [...currentGroupSelections, { name: option.name, price: option.price }] };
                }
            }
        });
    };

    const calculateCurrentPrice = () => {
        let basePrice = selectedVariant ? selectedVariant.price : product.price;
        
        // Fetch applicable deal
        const deal = deals.find(d => 
            (d.productId && (d.productId._id === product._id || d.productId === product._id)) || 
            (d.category === product.category && !d.productId)
        );

        if (deal) {
            if (deal.discountPercentage > 0) {
                basePrice = basePrice - (basePrice * (deal.discountPercentage / 100));
            } else if (deal.discountAmount > 0) {
                basePrice = basePrice - deal.discountAmount;
            }
        }

        let optionsPrice = 0;
        Object.values(selectedOptions).forEach(options => {
            options.forEach(opt => {
                optionsPrice += opt.price;
            });
        });
        return (basePrice + optionsPrice) * qty;
    };

    const addToCartHandler = () => {
        if (product.hasVariants && product.variants?.length > 0 && !selectedVariant) {
            toast.error(`Please select a variation`);
            return;
        }

        const finalOptions = [];
        Object.entries(selectedOptions).forEach(([groupName, options]) => {
            options.forEach(opt => {
                finalOptions.push({ groupName, optionName: opt.name, price: opt.price });
            });
        });

        const currentUnitPrice = calculateCurrentPrice() / qty;

        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                ...product,
                product: product._id,
                price: Math.round(currentUnitPrice),
                qty: qty,
                selectedOptions: finalOptions,
                variantName: selectedVariant?.name
            },
        });

        toast.success(`${product.name} added!`, { icon: '🛒' });
        onClose();
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-charcoal/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-2xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col md:flex-row"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-charcoal/40 text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Image Section */}
                    <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-64 md:h-auto shrink-0 relative overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 flex items-center gap-2">
                            <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${product.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            </div>
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{product.preparationTime} MINS</span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-8 md:p-10 flex flex-col max-h-[80vh] overflow-y-auto no-scrollbar">
                        <div className="mb-8">
                            <span className="text-gold font-black text-[10px] uppercase tracking-[0.4em] mb-3 block">{product.category}</span>
                            <h2 className="text-3xl md:text-4xl font-serif font-black text-white mb-4 leading-tight">{product.name}</h2>
                            <p className="text-white/40 text-xs leading-relaxed font-medium line-clamp-3 italic">"{product.description}"</p>
                        </div>

                        {/* Variants */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-8">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 mb-4 block">Select Size</label>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((v, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${selectedVariant?.name === v.name ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20'}`}
                                        >
                                            {v.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Options */}
                        {product.variationGroups && product.variationGroups.map((group, gIdx) => (
                            <div key={gIdx} className="mb-8">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 mb-4 block">{group.name}</label>
                                <div className="flex flex-wrap gap-2">
                                    {group.options.map((opt, oIdx) => {
                                        const isSelected = selectedOptions[group.name]?.some(o => o.name === opt.name);
                                        return (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleOptionToggle(group, opt)}
                                                className={`px-4 py-2 rounded-lg border text-[9px] font-bold transition-all flex items-center gap-3 ${isSelected ? 'bg-white/10 border-gold/50 text-white' : 'bg-white/[0.01] border-white/5 text-white/20'}`}
                                            >
                                                {opt.name}
                                                {opt.price > 0 && <span className="text-gold/50">+{opt.price}</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Footer Action */}
                        <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 bg-white/5 p-1.5 rounded-xl border border-white/5">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white"><Minus className="w-3.5 h-3.5" /></button>
                                    <span className="text-sm font-black text-white w-4 text-center">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white"><Plus className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Total Amount</p>
                                    <div className="flex items-center justify-end gap-2">
                                        {deals.some(d => (d.productId?._id === product._id || d.productId === product._id) || (d.category === product.category && !d.productId)) && (
                                            <span className="text-xs text-white/30 line-through font-bold">
                                                Rs. {(selectedVariant ? selectedVariant.price : product.price) * qty}
                                            </span>
                                        )}
                                        <p className="text-2xl font-black text-white tracking-tighter">Rs Total {Math.round(calculateCurrentPrice())}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={addToCartHandler}
                                className="w-full bg-gold hover:bg-yellow-400 text-charcoal font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] transition-all"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ProductDetailModal;
