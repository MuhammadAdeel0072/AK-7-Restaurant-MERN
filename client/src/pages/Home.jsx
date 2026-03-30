import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Utensils, Pizza, Cake } from 'lucide-react';

const Home = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center">
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tight">
            Exquisite Taste, <br />
            <span className="text-gold">Premium Experience</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Order your favorite food easily and quickly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/menu" className="btn-primary flex items-center justify-center gap-2 text-lg">
              Menu <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-md font-bold hover:bg-white/20 transition-all border border-white/20">
              Order Now
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-charcoal px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 underline decoration-gold underline-offset-8">
            Our Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <CategoryCard icon={<Coffee className="w-10 h-10" />} title="Drinks" color="bg-gold" />
            <CategoryCard icon={<Utensils className="w-10 h-10" />} title="Food" color="bg-crimson" />
            <CategoryCard icon={<Pizza className="w-10 h-10" />} title="Dishes" color="bg-gold" />
            <CategoryCard icon={<Cake className="w-10 h-10" />} title="Sweets" color="bg-crimson" />
          </div>
        </div>
      </section>
    </div>
  );
};

const CategoryCard = ({ icon, title, color }) => (
  <div className="flex flex-col items-center p-8 rounded-xl bg-white/5 border border-white/10 hover:border-gold group cursor-pointer transition-all">
    <div className={`${color} p-4 rounded-full mb-4 group-hover:scale-110 transition-transform text-charcoal shadow-lg shadow-gold/20`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold group-hover:text-gold transition-colors">{title}</h3>
  </div>
);

export default Home;
