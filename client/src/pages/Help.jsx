import React from 'react';
import { ShoppingBag, Calendar, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const Help = () => {
    const Section = ({ title, icon: Icon, children }) => (
        <div className="card-premium p-8 sm:p-10 mb-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gold/20 group-hover:bg-gold/50 transition-colors"></div>
            <div className="flex items-center gap-5 mb-10">
                <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                    <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                    <h2 className="text-2xl font-serif font-black text-white tracking-tight">{title}</h2>
                    <p className="text-[9px] text-gold/40 font-black uppercase tracking-[0.2em] mt-0.5">How we can help</p>
                </div>
            </div>
            {children}
        </div>
    );

    const FAQItem = ({ question, answer }) => (
        <div className="mb-6 last:mb-0 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-gold/30 transition-all">
            <h3 className="text-white font-bold text-lg mb-2">{question}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
        </div>
    );

    return (
        <div className="container mx-auto px-6 py-16 max-w-4xl">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-14 text-center sm:text-left"
            >
                <h1 className="text-6xl font-serif font-black text-white mb-3">Help Center</h1>
                <div className="flex items-center justify-center sm:justify-start gap-4">
                    <span className="h-[1px] w-12 bg-gold/40"></span>
                    <p className="text-gold/60 text-[10px] font-black uppercase tracking-[0.4em]">
                        Premium Member Support
                    </p>
                </div>
            </motion.div>

            <div className="space-y-4">
                <Section title="Orders" icon={ShoppingBag}>
                    <FAQItem 
                        question="How to place an order" 
                        answer="To place an order, browse our menu, add items to your cart, and proceed to checkout. Follow the prompts to provide your details and confirm your purchase."
                    />
                    <FAQItem 
                        question="How to track an order" 
                        answer="Once ordered, you can track your status in the 'Orders' section or use the tracking link provided in your confirmation."
                    />
                </Section>

                <Section title="Booking" icon={Calendar}>
                    <FAQItem 
                        question="How to book a table" 
                        answer="Navigate to the 'Table' section in the menu, select your preferred date, time, and guest count, then confirm your reservation."
                    />
                    <FAQItem 
                        question="How to cancel booking" 
                        answer="You can manage or cancel your existing bookings through the 'Table' section or by contacting our support team."
                    />
                </Section>

                <Section title="Settings" icon={SettingsIcon}>
                    <FAQItem 
                        question="How to update account" 
                        answer="Go to the 'Settings' page to update your profile information, including your name and profile visibility."
                    />
                    <FAQItem 
                        question="How to delete account" 
                        answer="Within the 'Settings' page, navigate to the Account Security section and select 'Delete Account'. This action is permanent and requires confirmation."
                    />
                </Section>
            </div>
        </div>
    );
};

export default Help;
