import React, { useEffect, useState } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';

const NextDeliveryBanner = () => {
  const [nextSub, setNextSub] = useState(null);

  useEffect(() => {
    const fetchNext = async () => {
      try {
        const { data } = await apiClient.get('/subscriptions');
        if (data && data.length > 0) {
          // Find the earliest active subscription
          const active = data.filter(s => s.status === 'ACTIVE');
          if (active.length > 0) {
             setNextSub(active[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch next delivery');
      }
    };
    fetchNext();
  }, []);

  if (!nextSub) return null;

  return (
    <div className="bg-gold/10 border border-gold/20 rounded-[2rem] p-6 mb-12 flex items-center justify-between group">
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center text-gold">
          <Clock className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 mb-1">Upcoming Subscription Order</p>
          <h3 className="text-xl font-serif font-bold text-white">
            {nextSub.schedule[0].day} <span className="text-gold/40 mx-1">@</span> {nextSub.schedule[0].time}
          </h3>
        </div>
      </div>
      <Link to="/plans" className="flex items-center gap-2 bg-gold text-charcoal px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all">
        Manage Plans <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default NextDeliveryBanner;
