"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiMinus, FiHelpCircle, FiSmartphone, FiCreditCard, FiTruck } from 'react-icons/fi';

const FAQPageUi = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqData = [
    {
      category: "Ordering & Devices",
      icon: <FiSmartphone />,
      questions: [
        {
          q: "Are all your devices brand new and original?",
          a: "Absolutely. Every device sold at ABST Global is 100% original, brand new, and comes with the manufacturer's global warranty. We do not deal in refurbished or 'open-box' units."
        },
        {
          q: "Do you sell international versions of iPhones and Samsung?",
          a: "We stock both local and international variants. Our team will always specify the region of the device (USA, UK, or Middle East) before you complete your purchase."
        }
      ]
    },
    {
      category: "Financing (Layaway Plan)",
      icon: <FiCreditCard />,
      questions: [
        {
          q: "How does the Layaway Plan work?",
          a: "Our Layaway Plan allows you to lock in a price and pay in installments. The amount increases slightly with the timeframe (3, 6, or 9 months). Please note that the device is only released once the final payment is cleared."
        },
        {
          q: "Can I cancel my installment plan mid-way?",
          a: "Yes, you can. However, a small administrative fee is deducted from the refunded amount. Alternatively, you can swap the accumulated credit for a different, lower-priced device."
        }
      ]
    },
    {
      category: "Shipping & Delivery",
      icon: <FiTruck />,
      questions: [
        {
          q: "How long does delivery take within Nigeria?",
          a: "Deliveries within Lagos and Abuja typically take 24-48 hours. For other states, please allow 3-5 business days via our secure logistics partners."
        }
      ]
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
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
            Everything you need to know about ABST standards
          </p>
        </div>

        {/* FAQ Categories */}
        {faqData.map((category, catIndex) => (
          <div key={catIndex} className="mb-12">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
              <span className="text-blue-600 text-xl">{category.icon}</span>
              <h2 className="text-sm font-black uppercase tracking-widest text-[#0B2A4A]">
                {category.category}
              </h2>
            </div>

            <div className="space-y-4">
              {category.questions.map((item, qIndex) => {
                const globalIndex = catIndex * 10 + qIndex; // Unique ID
                const isOpen = activeIndex === globalIndex;

                return (
                  <div 
                    key={qIndex}
                    className={`bg-white rounded-xl border transition-all duration-300 ${
                      isOpen ? 'border-yellow-400 shadow-lg' : 'border-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => toggleAccordion(globalIndex)}
                      className="w-full flex items-center justify-between p-5 text-left"
                    >
                      <span className={`text-xs md:text-sm font-bold uppercase tracking-tight transition-colors ${
                        isOpen ? 'text-blue-600' : 'text-[#0B2A4A]'
                      }`}>
                        {item.q}
                      </span>
                      <div className={`p-1 rounded-md transition-all ${
                        isOpen ? 'bg-yellow-400 text-[#0B2A4A] rotate-180' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isOpen ? <FiMinus size={14} /> : <FiPlus size={14} />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
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

        {/* Bottom Support Callout */}
        <div className="mt-20 p-8 bg-[#0B2A4A] rounded-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400" />
          <h3 className="text-white font-black uppercase text-sm mb-2 italic">Still have questions?</h3>
          <p className="text-white/60 text-[10px] mb-6 font-bold uppercase tracking-widest">Our support team is active 24/7</p>
          <button 
            onClick={() => window.location.href = '/contact'}
            className="bg-yellow-400 text-[#0B2A4A] px-8 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            Contact CEO Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default FAQPageUi;