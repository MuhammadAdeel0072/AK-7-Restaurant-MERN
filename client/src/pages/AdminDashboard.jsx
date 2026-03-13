import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LayoutDashboard, ShoppingBag, Users, Plus, Edit, Trash2 } from 'lucide-react';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          axios.get('/api/orders'),
          axios.get('/api/products')
        ]);
        setOrders(ordersRes.data);
        setProducts(productsRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-10 text-gold flex items-center gap-4">
        <LayoutDashboard className="w-10 h-10" /> Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
            <ShoppingBag className="w-12 h-12 text-gold mx-auto mb-4" />
            <div className="text-3xl font-bold">{orders.length}</div>
            <div className="text-gray-400">Total Orders</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
            <Plus className="w-12 h-12 text-crimson mx-auto mb-4" />
            <div className="text-3xl font-bold">{products.length}</div>
            <div className="text-gray-400">Menu Items</div>
        </div>
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center">
            <Users className="w-12 h-12 text-gold mx-auto mb-4" />
            <div className="text-3xl font-bold">2</div>
            <div className="text-gray-400">Total Users</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
        {/* Orders Table */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gold">Incoming Orders</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="py-4">ID</th>
                            <th className="py-4">Date</th>
                            <th className="py-4">Total</th>
                            <th className="py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 font-mono text-sm">{order._id.substring(0, 8)}...</td>
                                <td className="py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="py-4 text-gold font-bold">${order.totalPrice.toFixed(2)}</td>
                                <td className="py-4">
                                    <span className="bg-gold/20 text-gold px-3 py-1 rounded-full text-xs">Processing</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Products Table */}
        <div className="bg-white/5 border border-white/10 p-8 rounded-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gold">Menu Management</h2>
                <button className="bg-gold text-charcoal px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90">
                    <Plus className="w-5 h-5" /> Add New
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/10 text-gray-400">
                            <th className="py-4">Product</th>
                            <th className="py-4">Category</th>
                            <th className="py-4">Price</th>
                            <th className="py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4">{product.name}</td>
                                <td className="py-4">{product.category}</td>
                                <td className="py-4 text-gold font-bold">${product.price.toFixed(2)}</td>
                                <td className="py-4">
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:text-gold transition-colors"><Edit className="w-5 h-5" /></button>
                                        <button className="p-2 hover:text-crimson transition-colors"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
