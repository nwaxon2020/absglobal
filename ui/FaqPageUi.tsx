"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiHelpCircle, FiSmartphone, FiCreditCard, FiTruck, FiShield } from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const FAQPageUi = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const docRef = doc(db, "siteContent", "legalAndHelp");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setContent(docSnap.data());
      } catch (error) {
        console.error("FAQ Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFaq();
  }, []);

  const getIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('order') || cat.includes('device')) return <FiSmartphone />;
    if (cat.includes('finance') || cat.includes('pay')) return <FiCreditCard />;
    if (cat.includes('ship') || cat.includes('deliver')) return <FiTruck />;
    return <FiShield />;
  };

  if (loading || !content) return <div className="min-h-screen bg-[#F5F5F5] animate-pulse" />;

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600/10 rounded-full text-blue-600">
              <FiHelpCircle size={32} />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
            Common <span className="text-blue-600">Inquiries</span>
          </h1>
          <p className="text-gray-500 mt-4 text-[10px] font-bold uppercase tracking-[0.3em]">
            {content.faqSubtitle || "Everything you need to know about ABST standards"}
          </p>
        </div>

        {content.faqCategories?.map((category: any, catIndex: number) => (
          <div key={catIndex} className="mb-12">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
              <span className="text-blue-600 text-xl">{getIcon(category.category)}</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0B2A4A]">
                {category.category}
              </h2>
            </div>

            <div className="space-y-4">
              {category.questions?.map((item: any, qIndex: number) => {
                const globalIndex = catIndex * 100 + qIndex; 
                const isOpen = activeIndex === globalIndex;

                return (
                  <div key={qIndex} className={`bg-white rounded-xl border transition-all duration-300 ${isOpen ? 'border-yellow-400 shadow-lg' : 'border-gray-100'}`}>
                    <button onClick={() => toggleAccordion(globalIndex)} className="w-full flex items-center justify-between p-5 text-left">
                      <span className={`text-xs md:text-sm font-bold uppercase tracking-tight transition-colors ${isOpen ? 'text-blue-600' : 'text-[#0B2A4A]'}`}>
                        {item.q}
                      </span>
                      <div className={`p-1 rounded-md transition-all ${isOpen ? 'bg-yellow-400 text-[#0B2A4A] rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                        {isOpen ? <FiMinus size={14} /> : <FiPlus size={14} />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-5 pb-5 pt-0 text-[11px] md:text-xs text-gray-500 leading-relaxed border-t border-gray-50 mx-5 mt-2 pt-4">
                            {item.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="mt-20 p-8 bg-[#0B2A4A] rounded-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />
          <h3 className="text-white font-black uppercase text-sm mb-2 italic">Still have questions?</h3>
          <p className="text-white/60 text-[10px] mb-6 font-bold uppercase tracking-widest">Our support team is active 24/7</p>
          <button onClick={() => window.location.href = '/contact'} className="bg-yellow-400 text-[#0B2A4A] px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">
            Contact CEO Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQPageUi;