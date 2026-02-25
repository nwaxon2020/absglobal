"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiShield, FiEye, FiLock, FiRefreshCw, 
  FiTruck, FiCheckCircle, FiChevronRight, FiInfo, FiClock 
} from 'react-icons/fi';

const PrivacyPageUi = () => {
  const [activeSection, setActiveSection] = useState('collection');

  const sections = [
    { id: 'collection', title: 'Data Collection', icon: <FiEye /> },
    { id: 'usage', title: 'Usage Policy', icon: <FiShield /> },
    { id: 'payback', title: 'Payback & Refunds', icon: <FiRefreshCw /> },
    { id: 'security', title: 'Data Security', icon: <FiLock /> },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-28 pb-20 px- md:px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-6xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
              Privacy & <span className="text-blue-600">Trust</span>
            </h1>
            <p className="text-gray-500 mt-4 text-[10px] font-bold uppercase tracking-[0.4em]">
              ABST Global Concept / Legal & Operations Manual
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Left: Sticky Navigation (Desktop) */}
          <div className="hidden lg:block sticky top-32 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between p-4 md:rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  activeSection === section.id 
                  ? 'bg-[#0B2A4A] text-white shadow-lg' 
                  : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">
                  {section.icon} {section.title}
                </span>
                <FiChevronRight />
              </button>
            ))}
          </div>

          {/* Right: Content Area */}
          <div className="lg:col-span-3 space-y-12 bg-white p-6 md:p-12 md:rounded-3xl shadow-xl border border-gray-100">
            
            {/* Section 1: Data Collection */}
            <section id="collection" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 md:rounded-xl"><FiEye size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">1. Information Collection</h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                To facilitate wholesale transactions and technical support, we collect essential identifiers including:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['Google Account Data', 'Phone & Email', 'Delivery Addresses', 'Support Ticket History'].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <FiCheckCircle className="text-blue-600" />
                    <span className="text-xs font-black text-[#0B2A4A] uppercase tracking-tighter">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Usage */}
            <section id="usage" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6 text-blue-600">
                <div className="p-3 bg-blue-50 md:rounded-xl"><FiShield size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">2. Usage Policy</h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Your data is used strictly for internal management. We verify your identity via **Google Auth** to prevent unauthorized access to your store orders and complaint threads. We never share your wholesale pricing or purchase history with third-party vendors.
              </p>
            </section>

            {/* Section 3: Payback & Refunds - HIGHLIGHTED */}
            <section id="payback" className="scroll-mt-32 p-8 bg-[#0B2A4A] md:rounded-3xl text-white relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-5 text-white">
                <FiRefreshCw size={200} />
              </div>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/10 text-yellow-400 md:rounded-xl"><FiRefreshCw size={24}/></div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">3. Payback & Refund Policy</h2>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <FiTruck className="text-yellow-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-xs uppercase mb-1">Eligibility Criteria</h4>
                    <p className="text-white/70 text-xs leading-relaxed">Refunds are exclusively for verified factory defects or incorrect model specifications. Complaints must be logged in "My Tickets" within 48 hours.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FiClock className="text-yellow-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-xs uppercase mb-1">Processing Timeline</h4>
                    <p className="text-white/70 text-xs leading-relaxed">Once approved by the ABST Management Team, paybacks are processed back to the original payment source within 3–5 business days.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Security */}
            <section id="security" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6 text-blue-600">
                <div className="p-3 bg-blue-50 md:rounded-xl"><FiLock size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">4. Data Security</h2>
              </div>
              <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-4">
                <FiInfo className="text-red-500 mt-1" />
                <p className="text-[#0B2A4A] text-xs font-bold leading-relaxed uppercase">
                  All communication between your terminal and ABST Global is encrypted via Firebase SSL. Access to sensitive complaint files is locked behind CEO-level authentication.
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* System Footer */}
        <div className="mt-20 text-center border-t border-gray-200 pt-10">
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-300">
            ABST Global Concept © 2026 / Privacy Framework v1.0
          </p>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPageUi;