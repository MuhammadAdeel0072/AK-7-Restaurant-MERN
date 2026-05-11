import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, X, Check, Minus, Plus, Info } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { dispatch } = useCart();
    const { user: profile, isSignedIn } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deals, setDeals] = useState([]);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [qty, setQty] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const prodRes = await fetch(`${API_BASE_URL}/products/${id}`);
                if (!prodRes.ok) throw new Error("Failed to load product");
                const prodData = await prodRes.json();
                setProduct(prodData);

                if (prodData.variants && prodData.variants.length > 0) {
                    setSelectedVariant(prodData.variants[0]);
                }

                const dealsRes = await fetch(`${API_BASE_URL}/deals?isActive=true`);
                if (dealsRes.ok) {
                    const dealsData = await dealsRes.json();
                    setDeals(Array.isArray(dealsData) ? dealsData : []);
                }
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const deal = useMemo(() => {
        if (!product || !deals.length) return null;
        return deals.find(d =>
            (d.productId && (d.productId._id === product._id || d.productId === product._id)) ||
            (d.category === product.category && !d.productId)
        );
    }, [product, deals]);

    const calculateCurrentPrice = () => {
        if (!product) return 0;
        let basePrice = selectedVariant ? selectedVariant.price : product.price;

        if (deal) {
            if (deal.discountPercentage > 0) {
                basePrice = basePrice - (basePrice * (deal.discountPercentage / 100));
            } else if (deal.discountAmount > 0) {
                basePrice = basePrice - deal.discountAmount;
            }
        }

        let optionsPrice = 0;
        Object.values(selectedOptions).forEach(options => {
            options.forEach(opt => { optionsPrice += opt.price; });
        });

        return (basePrice + optionsPrice) * qty;
    };

    const handleOptionToggle = (group, option) => {
        const groupName = group.name;
        const isSingle = group.type === 'single';
        setSelectedOptions(prev => {
            const curr = prev[groupName] || [];
            if (isSingle) {
                return { ...prev, [groupName]: [{ name: option.name, price: option.price }] };
            }
            const isSelected = curr.some(o => o.name === option.name);
            if (isSelected) {
                return { ...prev, [groupName]: curr.filter(o => o.name !== option.name) };
            }
            return { ...prev, [groupName]: [...curr, { name: option.name, price: option.price }] };
        });
    };

    const addToCartHandler = () => {
        if (product.hasVariants && product.variants?.length > 0 && !selectedVariant) {
            toast.error('Please select a variation');
            return;
        }
        if (product.variationGroups) {
            for (const group of product.variationGroups) {
                if (group.required && (!selectedOptions[group.name] || selectedOptions[group.name].length === 0)) {
                    toast.error(`Please select an option for ${group.name}`);
                    return;
                }
            }
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
        toast.success(`${product.name} added to cart!`, { icon: '🛒' });
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
                <div className="w-full max-w-3xl animate-pulse">
                    <div className="flex flex-col md:flex-row gap-6 bg-white/[0.02] rounded-[2.5rem] overflow-hidden border border-white/5">
                        <div className="w-full md:w-[45%] h-72 md:h-[420px] bg-white/5" />
                        <div className="flex-1 p-8 space-y-6">
                            <div className="h-6 w-3/4 bg-white/5 rounded-xl" />
                            <div className="h-8 w-1/3 bg-white/5 rounded-lg" />
                            <div className="h-10 w-full bg-white/5 rounded-xl" />
                            <div className="h-14 w-full bg-white/5 rounded-2xl mt-auto" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (!product) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
                <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                        <Info className="w-8 h-8 text-gold/40" />
                    </div>
                    <h2 className="text-2xl font-serif font-black text-white mb-3">Product Not Found</h2>
                    <p className="text-gray-500 mb-6 text-sm">This item may have been removed or is temporarily unavailable.</p>
                    <Link to="/menu" className="btn-primary inline-flex items-center gap-2 text-sm rounded-full">
                        Back to Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal flex items-start justify-center px-4 py-10 md:py-20">
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-3xl relative"
            >
                {/* ── Main Card ── */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] flex flex-col md:flex-row">

                    {/* ── LEFT: Image ── */}
                    <div className="relative w-full md:w-[45%] h-64 sm:h-72 md:h-auto md:min-h-[420px] shrink-0 overflow-hidden">
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#121212]/30 hidden md:block" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/60 via-transparent to-transparent md:hidden" />

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {deal && (
                                <span className="bg-crimson text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                                    {deal.discountPercentage > 0 ? `${deal.discountPercentage}% OFF` : `Rs. ${deal.discountAmount} OFF`}
                                </span>
                            )}
                            {product.isBestSeller && (
                                <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                                    Popular
                                </span>
                            )}
                        </div>

                        {/* Veg/Non-Veg */}
                        <div className="absolute bottom-4 left-4">
                            <div className={`w-4 h-4 border-2 rounded-[3px] flex items-center justify-center bg-charcoal/50 backdrop-blur-sm ${product.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT: Content ── */}
                    <div className="flex-1 flex flex-col p-6 sm:p-8 relative">

                        {/* X Close Button — top right */}
                        <button
                            onClick={() => navigate('/menu')}
                            className="absolute top-5 right-5 md:top-6 md:right-6 w-9 h-9 rounded-xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-charcoal hover:border-gold hover:bg-gold transition-all duration-300 z-10 group"
                            title="Back to menu"
                        >
                            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        {/* Product Name */}
                        <div className="mb-5 pr-12">
                            <span className="text-gold/50 font-black text-[9px] uppercase tracking-[0.35em] block mb-1.5">{product.category}</span>
                            <h1 className="text-2xl sm:text-3xl font-serif font-black text-white leading-tight tracking-tight">{product.name}</h1>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-6">
                            {deal && (
                                <span className="text-gray-600 font-bold text-sm line-through">
                                    Rs. {(selectedVariant ? selectedVariant.price : product.price) * qty}
                                </span>
                            )}
                            <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter">
                                Rs. {Math.round(calculateCurrentPrice())}
                            </span>
                            {qty > 1 && (
                                <span className="text-white/25 text-[10px] font-bold uppercase tracking-wider">× {qty}</span>
                            )}
                        </div>

                        {/* ── Variants ── */}
                        {product.variants && product.variants.length > 0 && (
                            <div className="mb-5">
                                <div className="flex justify-between items-center mb-2.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Size</label>
                                    <span className="text-[8px] font-black text-crimson/70 uppercase tracking-widest">Required</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.variants.map((v, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`px-4 py-2.5 rounded-xl border transition-all text-[11px] font-black uppercase tracking-wider ${selectedVariant?.name === v.name
                                                    ? 'bg-gold/10 border-gold/60 text-gold'
                                                    : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/15 hover:text-white/60'
                                                }`}
                                        >
                                            {v.name}
                                            <span className="ml-1.5 opacity-50 text-[10px]">Rs.{v.price}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Customization Groups ── */}
                        {product.variationGroups && product.variationGroups.map((group, gIdx) => (
                            <div key={gIdx} className="mb-5">
                                <div className="flex justify-between items-center mb-2.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">{group.name}</label>
                                    {group.required && <span className="text-[8px] font-black text-crimson/70 uppercase tracking-widest">Required</span>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {group.options.map((opt, oIdx) => {
                                        const isSelected = selectedOptions[group.name]?.some(o => o.name === opt.name);
                                        return (
                                            <button
                                                key={oIdx}
                                                onClick={() => handleOptionToggle(group, opt)}
                                                className={`px-3.5 py-2 rounded-xl border transition-all text-[11px] font-bold flex items-center gap-1.5 ${isSelected
                                                        ? 'bg-white/8 border-gold/40 text-white'
                                                        : 'bg-white/[0.01] border-white/[0.06] text-gray-600 hover:border-white/10 hover:text-gray-400'
                                                    }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 text-gold" />}
                                                <span>{opt.name}</span>
                                                <span className={`text-[9px] ${isSelected ? 'text-gold/60' : 'text-gray-700'}`}>
                                                    {opt.price > 0 ? `+${opt.price}` : 'Free'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* ── Spacer to push bottom section down ── */}
                        <div className="flex-1 min-h-4" />

                        {/* ── Quantity + Add to Cart ── */}
                        <div className="pt-5 border-t border-white/[0.05] space-y-4">

                            {/* Quantity */}
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Qty</span>
                                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] p-1 rounded-xl">
                                    <button
                                        onClick={() => setQty(Math.max(1, qty - 1))}
                                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-crimson/20 hover:text-crimson transition-all"
                                    >
                                        <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-base font-black text-white w-5 text-center">{qty}</span>
                                    <button
                                        onClick={() => setQty(qty + 1)}
                                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white hover:bg-gold/20 hover:text-gold transition-all"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Add to Cart Button */}
                            <button
                                onClick={addToCartHandler}
                                className="w-full bg-gold hover:bg-yellow-400 text-charcoal font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-sm uppercase tracking-[0.15em] transition-all shadow-[0_12px_35px_rgba(212,175,55,0.15)] hover:shadow-[0_18px_45px_rgba(212,175,55,0.25)] hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Add to Cart — Rs. {Math.round(calculateCurrentPrice())}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Rounded bottom decorative edge ── */}
                <div className="h-6 bg-gradient-to-b from-white/[0.02] to-transparent rounded-b-[3rem] -mt-1 border-x border-b border-white/[0.03]" />
            </motion.div>
        </div>
    );
};

export default ProductDetail;
