import React, { useState, useEffect } from 'react';
import { getProducts } from '../services/menuService';
import { useCart } from '../context/CartContext';
import { useProfile } from '../context/UserContext';
import { ShoppingCart, Heart, Search, Filter, Plus, Minus, X, Package, Clock, Flame, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const { dispatch } = useCart();
  const { profile, isSignedIn } = useProfile();

  const fallbackItems = [
    // Drinks (12 items)
    { _id: 'd1',  name: 'Mint Margarita',       category: 'Drinks', price: 250,  description: 'Cool and refreshing mint drink with a touch of lime.',             image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd2',  name: 'Cold Coffee',           category: 'Drinks', price: 350,  description: 'Classic creamy cold coffee topped with vanilla ice cream.',         image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500', preparationTime: 8,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd3',  name: 'Fresh Orange Juice',    category: 'Drinks', price: 300,  description: '100% freshly squeezed seasonal oranges.',                          image: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd4',  name: 'Classic Lemonade',      category: 'Drinks', price: 200,  description: 'Zesty lemon juice with a hint of mint and soda.',                  image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd5',  name: 'Strawberry Shake',      category: 'Drinks', price: 400,  description: 'Thick and sweet strawberry and fresh milk shake.',                 image: 'https://images.unsplash.com/photo-1579739678182-3651a0842740?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },
    { _id: 'd6',  name: 'Mango Smoothie',        category: 'Drinks', price: 450,  description: 'Thick mango smoothie blended with yogurt and honey.',              image: 'https://images.unsplash.com/photo-1546173159-315724a9d669?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },
    { _id: 'd7',  name: 'Green Tea',             category: 'Drinks', price: 150,  description: 'Premium organic green tea leaves brewed to perfection.',           image: 'https://images.unsplash.com/photo-1544787210-2213d84ad96b?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd8',  name: 'Black Coffee',          category: 'Drinks', price: 200,  description: 'Strong roasted black coffee for an instant energy boost.',         image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd9',  name: 'Iced Caramel Latte',   category: 'Drinks', price: 480,  description: 'Iced milk coffee with rich caramel syrup.',                        image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500', preparationTime: 8,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd10', name: 'Peach Iced Tea',        category: 'Drinks', price: 320,  description: 'Refreshing black tea brewed with peach essence.',                  image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd11', name: 'Blue Lagoon Mocktail',  category: 'Drinks', price: 380,  description: 'Curacao syrup with lemonade and crushed ice.',                     image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 'd12', name: 'Oreo Milkshake',        category: 'Drinks', price: 450,  description: 'Decadent milkshake blended with Oreo cookies.',                   image: 'https://images.unsplash.com/photo-1579739678182-3651a0842740?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },

    // Food (12 items)
    { _id: 'f1',  name: 'Zinger Deluxe',          category: 'Food', price: 480, description: 'Extra crispy chicken fillet with spicy mayo and cheese.',               image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', preparationTime: 15, isVegetarian: false, countInStock: 50, isBestSeller: true },
    { _id: 'f2',  name: 'Grilled Chicken Sandwich',category: 'Food', price: 380, description: 'Juicy grilled chicken breast with fresh lettuce and tomatoes.',         image: 'https://images.unsplash.com/photo-1521390188846-e2a3a97453a0?w=500', preparationTime: 12, isVegetarian: false, countInStock: 50 },
    { _id: 'f3',  name: 'Gourmet Club Sandwich',  category: 'Food', price: 580, description: 'Triple-decker sandwich with chicken, egg, bacon, and cheese.',           image: 'https://images.unsplash.com/photo-1509722747041-619f3936863d?w=500', preparationTime: 15, isVegetarian: false, countInStock: 50 },
    { _id: 'f4',  name: 'Peri Peri Fries',        category: 'Food', price: 280, description: 'Crispy golden fries tossed in spicy Peri Peri seasoning.',               image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500', preparationTime: 8,  isVegetarian: true,  countInStock: 50 },
    { _id: 'f5',  name: 'Cheesy Loaded Fries',    category: 'Food', price: 550, description: 'Fries topped with melted cheddar and jalapeños.',                        image: 'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=500', preparationTime: 15, isVegetarian: false, countInStock: 50 },
    { _id: 'f6',  name: 'Chicken Hot Wings',       category: 'Food', price: 450, description: '8 pieces of crispy wings tossed in buffalo sauce.',                     image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500', preparationTime: 12, isVegetarian: false, countInStock: 50 },
    { _id: 'f7',  name: 'Classic Beef Burger',     category: 'Food', price: 650, description: 'Handmade beef patty with caramelized onions and pickles.',               image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', preparationTime: 20, isVegetarian: false, countInStock: 50 },
    { _id: 'f8',  name: 'Chicken Shawarma Wrap',   category: 'Food', price: 320, description: 'Grilled chicken strips wrapped in pita with garlic sauce.',              image: 'https://images.unsplash.com/photo-1626700051175-651bf415ec84?w=500', preparationTime: 10, isVegetarian: false, countInStock: 50 },
    { _id: 'f9',  name: 'Alfredo Pasta',           category: 'Food', price: 850, description: 'Fettuccine in a rich and creamy parmesan sauce.',                        image: 'https://images.unsplash.com/photo-1612491789661-97af1926c06a?w=500', preparationTime: 18, isVegetarian: true,  countInStock: 50 },
    { _id: 'f10', name: 'Garlic Parmesan Bread',   category: 'Food', price: 280, description: 'Toasted baguette with garlic butter and parmesan cheese.',               image: 'https://images.unsplash.com/photo-1573140285932-e0969796016e?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },
    { _id: 'f11', name: 'Crispy Spring Rolls',     category: 'Food', price: 300, description: 'Vegetable filled crispy rolls served with plum sauce.',                  image: 'https://images.unsplash.com/photo-1626700051175-651bf415ec84?w=500', preparationTime: 12, isVegetarian: true,  countInStock: 50 },
    { _id: 'f12', name: 'Spicy Dynamite Shrimp',   category: 'Food', price: 950, description: 'Crispy battered shrimp tossed in sweet and spicy dynamite sauce.',       image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500', preparationTime: 15, isVegetarian: false, countInStock: 50 },

    // Sweets (10 items)
    { _id: 's1',  name: 'Molten Lava Cake',        category: 'Sweets', price: 550, description: 'Warm chocolate cake with a gooey center, served with vanilla scoop.', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', preparationTime: 15, isVegetarian: true,  countInStock: 50 },
    { _id: 's2',  name: 'Classic Fudge Brownie',   category: 'Sweets', price: 320, description: 'Dense and fudgy chocolate brownie with walnuts.',                       image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's3',  name: 'Tiramisu Slice',           category: 'Sweets', price: 650, description: 'Italian coffee-flavored dessert with mascarpone cream.',               image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's4',  name: 'Gulab Jamun (2pcs)',       category: 'Sweets', price: 220, description: 'Deep fried milk solids soaked in cardamom syrup.',                     image: 'https://images.unsplash.com/photo-1601303116539-2ee283027382?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's5',  name: 'Glazed Blueberry Donut',  category: 'Sweets', price: 280, description: 'Freshly baked donut with blueberry glaze.',                            image: 'https://images.unsplash.com/photo-1527515545081-5db817172677?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's6',  name: 'Red Velvet Cheesecake',   category: 'Sweets', price: 700, description: 'Rich cheesecake on a red velvet cake base.',                           image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's7',  name: 'Assorted Macarons',        category: 'Sweets', price: 450, description: 'Box of 5 delicate French macarons in various flavors.',               image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500', preparationTime: 5,  isVegetarian: true,  countInStock: 50 },
    { _id: 's8',  name: 'Almond Pistachio Kheer',  category: 'Sweets', price: 280, description: 'Slow-cooked rice pudding garnished with nuts.',                        image: 'https://images.unsplash.com/photo-1589113103503-4948869163a3?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },
    { _id: 's9',  name: 'Premium Ras Malai',        category: 'Sweets', price: 380, description: 'Soft cottage cheese balls in thickened creamy milk.',                 image: 'https://images.unsplash.com/photo-1601303116539-2ee283027382?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },
    { _id: 's10', name: 'Classic Fruit Trifle',     category: 'Sweets', price: 350, description: 'Traditional layers of custard, sponge cake, and fresh fruit.',        image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=500', preparationTime: 10, isVegetarian: true,  countInStock: 50 },

    // Dishes (10 items)
    { _id: 'di1',  name: 'Chicken Karahi',          category: 'Dishes', price: 1350, description: 'Traditional wok-cooked chicken with ginger and tomatoes.',           image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', preparationTime: 25, isVegetarian: false, countInStock: 50 },
    { _id: 'di2',  name: 'Mutton Peshawari Karahi', category: 'Dishes', price: 2450, description: 'Slow cooked mutton in a black pepper and tomato base.',               image: 'https://images.unsplash.com/photo-1545231027-63b6f2a3c1ad?w=500', preparationTime: 35, isVegetarian: false, countInStock: 50 },
    { _id: 'di3',  name: 'Sindhi Chicken Biryani',  category: 'Dishes', price: 650,  description: 'Fragrant basmati rice cooked with spicy marinated chicken.',         image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a4f8?w=500', preparationTime: 20, isVegetarian: false, countInStock: 50, isSpecial: true },
    { _id: 'di4',  name: 'Beef Kabuli Pulao',        category: 'Dishes', price: 750,  description: 'Sweet and savory rice dish with beef and raisins.',                  image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc9?w=500', preparationTime: 20, isVegetarian: false, countInStock: 50 },
    { _id: 'di5',  name: 'Mixed BBQ Platter',        category: 'Dishes', price: 2800, description: 'Combination of seekh kabab, boti, and malai tikka.',                 image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500', preparationTime: 30, isVegetarian: false, countInStock: 50 },
    { _id: 'di6',  name: 'Butter Chicken Handi',     category: 'Dishes', price: 1100, description: 'Boneless chicken in a creamy tomato butter gravy.',                  image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', preparationTime: 25, isVegetarian: false, countInStock: 50 },
    { _id: 'di7',  name: 'Special Beef Nihari',      category: 'Dishes', price: 850,  description: 'Slow-cooked traditional beef shank stew with ginger and lemon.',    image: 'https://images.unsplash.com/photo-1545231027-63b6f2a3c1ad?w=500', preparationTime: 40, isVegetarian: false, countInStock: 50 },
    { _id: 'di8',  name: 'Shahi Mutton Haleem',      category: 'Dishes', price: 450,  description: 'High-protein lentil and mutton stew served with fried onions.',      image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', preparationTime: 40, isVegetarian: false, countInStock: 50 },
    { _id: 'di9',  name: 'Chicken White Handi',      category: 'Dishes', price: 1400, description: 'Creamy chicken base with white pepper and yogurt.',                  image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=500', preparationTime: 25, isVegetarian: false, countInStock: 50 },
    { _id: 'di10', name: 'Full Chicken Tikka',        category: 'Dishes', price: 950,  description: 'Full charcoal grilled chicken marinated in house spices.',           image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500', preparationTime: 25, isVegetarian: false, countInStock: 50 },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getProducts();
        if (data && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(fallbackItems);
        }
      } catch (error) {
        setProducts(fallbackItems);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const addToCartHandler = (product, quantity = 1, e) => {
    if (e) e.stopPropagation();
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        ...product,
        product: product._id,
        qty: quantity,
        customizations: []
      },
    });
    toast.success(`${product.name} added to cart!`, {
      icon: '🛒',
      duration: 3000,
    });
    if (selectedProduct) {
      setSelectedProduct(null);
      setQty(1);
    }
  };

  const toggleFavoriteHandler = async (productId, e) => {
    if (e) e.stopPropagation();
    if (!isSignedIn) {
      toast.error('Please sign in to save favourites');
      return;
    }
    const isFavorite = profile?.favorites?.includes(productId);
    toast.success(isFavorite ? 'Removed from favourites' : 'Added to favourites', { icon: '❤️' });
  };

  const categories = ['All', 'Food', 'Dishes', 'Sweets', 'Drinks'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-6 mb-12 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/50 w-5 h-5" />
          <input
            type="text"
            placeholder="Search for food or drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-gold/20 rounded-2xl py-4 pl-12 pr-6 focus:border-gold outline-none text-white transition-all placeholder:text-gray-500 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest ${
                activeCategory === cat
                  ? 'bg-gold text-charcoal shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-105'
                  : 'bg-white/5 text-gray-400 hover:text-gold border border-white/5 hover:border-gold/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
          {filteredProducts.map(product => {
            const isFav = profile?.favorites?.includes(product._id);
            return (
              <div
                key={product._id}
                onClick={() => setSelectedProduct(product)}
                className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-gold/40 group transition-all duration-700 transform hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative cursor-pointer flex flex-col h-full"
              >
                <div className="h-64 overflow-hidden relative shrink-0">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80"></div>

                  {/* Favourite button */}
                  <button
                    onClick={(e) => toggleFavoriteHandler(product._id, e)}
                    className={`absolute top-4 left-4 p-2.5 rounded-2xl backdrop-blur-xl transition-all duration-300 ${
                      isFav ? 'bg-gold text-charcoal' : 'bg-charcoal/60 text-white hover:text-gold border border-white/10'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {product.isBestSeller && (
                      <div className="bg-crimson text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                        Popular
                      </div>
                    )}
                    {product.isSpecial && (
                      <div className="bg-gold text-charcoal px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                        Chef Special
                      </div>
                    )}
                  </div>

                  {/* Veg indicator + prep time */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${product.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${product.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-white/50 text-[10px] font-medium">{product.preparationTime} mins</div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-serif font-bold text-white group-hover:text-gold transition-colors leading-tight pr-2">{product.name}</h3>
                    <span className="text-gold font-black text-base tracking-tighter shrink-0">Rs. {product.price}</span>
                  </div>
                  <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed font-medium italic">"{product.description}"</p>

                  {/* Dietary tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {product.dietaryInfo?.map(info => (
                      <span key={info} className="px-2 py-0.5 bg-gold/10 border border-gold/20 text-gold text-[8px] font-black uppercase tracking-widest rounded-md">
                        {info}
                      </span>
                    ))}
                  </div>

                  {/* Add to Cart button — actual button at bottom */}
                  <button
                    onClick={(e) => addToCartHandler(product, 1, e)}
                    className="mt-auto w-full flex items-center justify-between bg-white/5 hover:bg-gold/10 border border-white/5 group-hover:border-gold/30 hover:border-gold/50 px-5 py-3.5 rounded-2xl transition-all duration-300 group/btn"
                  >
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover/btn:text-gold transition-colors">Add to Cart</span>
                    <ShoppingCart className="w-4 h-4 text-gold/40 group-hover/btn:text-gold group-hover/btn:scale-110 transition-all" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-white/5">
          <Filter className="w-16 h-16 text-gold/20 mx-auto mb-6" />
          <h2 className="text-2xl font-serif text-white mb-2">No food found</h2>
          <p className="text-gray-500">Try a different search</p>
          <button
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
            className="mt-6 text-gold underline underline-offset-4 hover:text-white transition-colors"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-charcoal/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-charcoal border border-white/10 rounded-[3rem] overflow-hidden max-w-4xl w-full shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row relative"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-8 right-8 z-10 p-3 bg-charcoal/60 hover:bg-gold text-white hover:text-charcoal rounded-2xl transition-all backdrop-blur-xl border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="md:w-1/2 h-80 md:h-auto overflow-hidden">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="md:w-1/2 p-10 md:p-14 flex flex-col">
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-gold font-black text-xs uppercase tracking-widest">{selectedProduct.category}</span>
                    <div className="w-1 h-1 rounded-full bg-white/20"></div>
                    <div className="flex gap-2">
                      <div className={`w-3 h-3 border-2 rounded-sm flex items-center justify-center ${selectedProduct.isVegetarian ? 'border-green-500' : 'border-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${selectedProduct.isVegetarian ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      {selectedProduct.spicyLevel > 0 && (
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rotate-45 ${i < selectedProduct.spicyLevel ? 'bg-crimson shadow-[0_0_10px_rgba(220,20,60,0.5)]' : 'bg-white/10'}`}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <h2 className="text-4xl font-serif font-black text-white mb-4 leading-tight">{selectedProduct.name}</h2>
                  <p className="text-gray-400 text-base italic leading-relaxed mb-6 font-medium">"{selectedProduct.description}"</p>
                  <div className="text-3xl font-black text-gold tracking-tighter mb-8">Rs. {selectedProduct.price}</div>
                </div>

                <div className="mt-auto space-y-6">
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/10">
                    <span className="text-xs font-black uppercase tracking-widest text-gold/60 ml-2">Portions</span>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={(e) => { e.stopPropagation(); setQty(Math.max(1, qty - 1)); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-gold hover:text-charcoal transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-xl font-bold text-white w-4 text-center">{qty}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setQty(Math.min(selectedProduct.countInStock || 20, qty + 1)); }}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white hover:bg-gold hover:text-charcoal transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={(e) => addToCartHandler(selectedProduct, qty, e)}
                    className="w-full bg-gold text-charcoal font-black py-5 rounded-[2rem] flex items-center justify-center gap-4 text-lg shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-95 transition-all group"
                  >
                    <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    ADD TO CART
                  </button>

                  <div className="flex justify-center gap-8 text-[10px] items-center">
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest">
                      <Clock className="w-3 h-3" /> {selectedProduct.preparationTime || 25} MINS READY
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div>
                    <div className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest">
                      <Package className="w-3 h-3" /> SAFE PACKING
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-hidden">
    <div className="h-64 relative bg-white/[0.05] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
    </div>
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <div className="h-5 bg-white/[0.05] rounded-lg w-1/2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.1s]"></div>
        </div>
        <div className="h-5 bg-white/[0.05] rounded-lg w-1/4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.2s]"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/[0.05] rounded-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/2 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.3s]"></div>
        </div>
        <div className="h-4 bg-white/[0.05] rounded-lg w-5/6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/2 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.4s]"></div>
        </div>
      </div>
      <div className="h-12 bg-white/[0.05] rounded-2xl w-full mt-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite_0.5s]"></div>
      </div>
    </div>
  </div>
);

export default Menu;
