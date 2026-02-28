'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  FiCreditCard, 
  FiClock, 
  FiCheckCircle, 
  FiPercent, 
  FiInfo, 
  FiChevronRight 
} from 'react-icons/fi';
import FinancingModal from './FinancingModal'; 

const InstallmentSection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState<any>(null);

  // Map the static icons to the indices of the features array
  const featureIcons = [FiCreditCard, FiClock, FiCheckCircle, FiPercent];

  useEffect(() => {
    // Listen to the financeSection document in real-time
    const unsubscribe = onSnapshot(doc(db, "siteContent", "financeSection"), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data());
      } else {
        // Fallback to initial defaults if no data exists in Firebase yet
        setContent({
          title: "Secure Your Future Tech",
          policyLabel: "The ABST Layaway Policy",
          description: "Our installment plan follows a Layaway Model. This allows you to lock in the current price of any flagship phone. You pay in bits at 0% interest.",
          note: "Note: To maintain our security standards, the device remains in our Global Vault until the final installment is completed.",
          steps: [
            "Choose your dream device",
            "Select a timeframe (3-12 months)",
            "Complete monthly installments",
            "Pick up your brand new device"
          ],
          features: [
            { title: "Zero Interest", desc: "Transparency is our core. No hidden fees or interest charges." },
            { title: "Flexible Terms", desc: "Choose 3, 6, or 12 month layaway schedules." },
            { title: "Guaranteed Hold", desc: "We lock the current price and stock for you immediately." },
            { title: "Loyalty Bonus", desc: "Get a free screen protector and case upon final payment." }
          ]
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Show nothing or a skeleton until content loads
  if (!content) return <div className="py-20 bg-[#F8F9FA] text-center font-black animate-pulse uppercase italic text-slate-300">Loading Terms...</div>;

  return (
    <section id='finance' className="py-10 md:py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto md:px-6">
        
        {/* Main Explanation Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="md:mb-16 bg-[#1A1A1A] md:rounded-lg p-6 md:p-8 md:p-12 text-white relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 grid md:grid-cols-2 gap-4 md:gap-8 items-center">
            <div>
              <div className="flex items-center space-x-2 mb-2 md:mb-4">
                <FiInfo className="text-amber-500" />
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-amber-500">
                  {content.policyLabel}
                </span>
              </div>
              <h2 className="text-xl md:text-4xl font-bold mb-4">{content.title}</h2>
              <div className="text-sm md:text-base text-white/60 leading-relaxed mb-4 md:mb-6">
                <p>{content.description}</p>
                <br />
                <span className="text-xs md:text-sm text-white font-semibold italic">
                  {content.note}
                </span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 md:p-6 md:rounded-lg backdrop-blur-md">
              <ul className="space-y-2 md:space-y-4">
                {content.steps?.map((step: string, i: number) => (
                  <li key={i} className="flex items-center space-x-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Background Branding */}
          <div className="absolute top-0 right-0 text-[12rem] font-black text-white/[0.02] select-none pointer-events-none uppercase">
            ABST
          </div>
        </motion.div>

        {/* Dynamic Feature Cards */}
        <div className="p-3 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {content.features?.map((feature: any, index: number) => {
            const Icon = featureIcons[index] || FiCheckCircle;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -10 }}
                className="bg-white border border-black/5 rounded-lg p-5 md:p-8 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="mb-6 text-amber-500">
                  <Icon size={32} className="md:w-10 md:h-10" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3 text-[#1A1A1A]">{feature.title}</h3>
                <p className="text-xs md:text-sm text-[#1A1A1A]/50 leading-relaxed">
                  {feature.desc || feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
        
        <div className="mt-8 md:mt-16 text-center">
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