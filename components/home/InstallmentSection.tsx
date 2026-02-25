'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCreditCard, FiClock, FiCheckCircle, FiPercent, FiInfo, FiChevronRight } from 'react-icons/fi';
import FinancingModal from './FinancingModal'; 

const InstallmentSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans = [
    {
      icon: FiCreditCard,
      title: "Zero Interest",
      description: "Transparency is our core. No hidden fees or interest charges.",
      accent: "text-amber-500"
    },
    {
      icon: FiClock,
      title: "Flexible Terms",
      description: "Choose 3, 6, or 12 month layaway schedules.",
      accent: "text-amber-500"
    },
    {
      icon: FiCheckCircle,
      title: "Guaranteed Hold",
      description: "We lock the current price and stock for you immediately.",
      accent: "text-amber-500"
    },
    {
      icon: FiPercent,
      title: "Loyalty Bonus",
      description: "Get a free screen protector and case upon final payment.",
      accent: "text-amber-500"
    }
  ];

  return (
    <section id='finance' className="py-10 md:py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-aut md:px-6">
        
        {/* Proper Explanation Card Above */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="md:mb-16 bg-[#1A1A1A] md:rounded-lg p-6 md:p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2 md:mb-4">
                <FiInfo className="text-amber-500" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500">The ABST Layaway Policy</span>
              </div>
              <h2 className="text-xl md:text-4xl font-bold mb-4">Secure Your Future Tech</h2>
              <p className="text-sm md:text-base text-white/60 leading-relaxed mb-4 md:mb-6">
                Our installment plan follows a **Layaway Model**. This allows you to lock in the current price of any flagship phone. You pay in bits at 0% interest. 
                <br /><br />
                <span className="text-xs md:text-sm text-white font-semibold italic">Note: To maintain our security standards, the device remains in our Global Vault until the final installment is completed.</span>
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 md:p-6 md:rounded-lg backdrop-blur-md">
              <ul className="space-y-2 md:space-y-4">
                {[
                  "Choose your dream device",
                  "Select a timeframe (3-12 months)",
                  "Complete monthly installments",
                  "Pick up your brand new device"
                ].map((step, i) => (
                  <li key={i} className="flex items-center space-x-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs">{i+1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Subtle Background Branding */}
          <div className="absolute top-0 right-0 text-[12rem] font-black text-white/[0.02] select-none pointer-events-none">ABST</div>
        </motion.div>

        {/* Feature Cards */}
        <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-4md:gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-white border border-black/5 rounded-lg p-3 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className={`mb-6 ${plan.accent}`}>
                  <Icon size={40} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">{plan.title}</h3>
                <p className="text-sm text-[#1A1A1A]/50 leading-relaxed">{plan.description}</p>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-3 md:mt-16 text-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#1A1A1A] text-white px-10 py-4 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-black transition shadow-xl flex items-center mx-auto space-x-2"
          >
            <span>Start Financing Application</span>
            <FiChevronRight />
          </button>
        </div>
      </div>

      <FinancingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default InstallmentSection;