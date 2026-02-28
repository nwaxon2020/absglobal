"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiEye, FiLock, FiRefreshCw, FiTruck, FiCheckCircle, FiChevronRight, FiInfo, FiClock, FiCalendar } from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const PrivacyPageUi = () => {
  const [activeSection, setActiveSection] = useState('collection');
  const [loading, setLoading] = useState(true);
  const [legal, setLegal] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchLegal = async () => {
      try {
        const docRef = doc(db, "siteContent", "legalAndHelp");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLegal(data);
          
          // Logic to handle "Last Updated" display
          if (data.updatedAt) {
            const date = data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt);
            setLastUpdated(date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
          } else {
            // Fallback to today's date if no timestamp exists
            setLastUpdated(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLegal();
  }, []);

  if (loading || !legal) return <div className="min-h-screen bg-[#F5F5F5] animate-pulse" />;

  const sections = [
    { id: 'collection', title: 'Data Collection', icon: <FiEye /> },
    { id: 'usage', title: 'Usage Policy', icon: <FiShield /> },
    { id: 'payback', title: 'Payback & Refunds', icon: <FiRefreshCw /> },
    { id: 'security', title: 'Data Security', icon: <FiLock /> },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-28 pb-20 px-2 md:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* LAST UPDATED BADGE */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full mb-4 border border-blue-100">
              <FiCalendar className="text-xs" />
              <span className="text-[9px] font-black uppercase tracking-widest">Last Updated: {lastUpdated}</span>
            </div>

            <h1 className="text-3xl md:text-6xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
              {legal.policyTitle?.split(' ')[0]} <span className="text-blue-600">{legal.policyTitle?.split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-gray-500 mt-4 text-[10px] font-bold uppercase tracking-[0.4em]">
              {legal.policySubtitle}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <div className="hidden lg:block sticky top-32 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  activeSection === section.id ? 'bg-[#0B2A4A] text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <span className="flex items-center gap-3">{section.icon} {section.title}</span>
                <FiChevronRight />
              </button>
            ))}
          </div>

          <div className="lg:col-span-3 space-y-12 bg-white p-6 md:p-12 md:rounded-3xl shadow-xl border border-gray-100">
            {/* 1. Collection */}
            <section id="collection" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FiEye size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">1. Information Collection</h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{legal.policySections?.collection?.intro}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {legal.policySections?.collection?.checklist?.map((item: string) => (
                  <div key={item} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <FiCheckCircle className="text-blue-600" />
                    <span className="text-xs font-black text-[#0B2A4A] uppercase tracking-tighter">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Usage */}
            <section id="usage" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6 text-blue-600">
                <div className="p-3 bg-blue-50 rounded-xl"><FiShield size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">2. Usage Policy</h2>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{legal.policySections?.usage?.content}</p>
            </section>

            {/* 3. Payback */}
            <section id="payback" className="scroll-mt-32 p-8 bg-[#0B2A4A] md:rounded-3xl text-white relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-white/10 text-yellow-400 rounded-xl"><FiRefreshCw size={24}/></div>
                <h2 className="text-xl font-black uppercase italic tracking-tighter">3. Payback & Refund Policy</h2>
              </div>
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <FiTruck className="text-yellow-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-xs uppercase mb-1">Eligibility Criteria</h4>
                    <p className="text-white/70 text-xs leading-relaxed">{legal.policySections?.payback?.eligibility}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <FiClock className="text-yellow-400 mt-1" size={20} />
                  <div>
                    <h4 className="font-black text-xs uppercase mb-1">Processing Timeline</h4>
                    <p className="text-white/70 text-xs leading-relaxed">{legal.policySections?.payback?.timeline}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Security */}
            <section id="security" className="scroll-mt-32">
              <div className="flex items-center gap-4 mb-6 text-blue-600">
                <div className="p-3 bg-blue-50 rounded-xl"><FiLock size={24}/></div>
                <h2 className="text-xl font-black text-[#0B2A4A] uppercase tracking-tight">4. Data Security</h2>
              </div>
              <div className="p-6 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-4">
                <FiInfo className="text-red-500 mt-1" />
                <p className="text-[#0B2A4A] text-xs font-bold leading-relaxed uppercase">{legal.policySections?.security?.content}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPageUi;