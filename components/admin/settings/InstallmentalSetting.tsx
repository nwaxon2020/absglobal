'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSave, FiInfo, FiList, FiLayout, FiRefreshCw, 
  FiChevronDown, FiDollarSign 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FinanceEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Track changes
  
  const [content, setContent] = useState({
    title: "Secure Your Future Tech",
    policyLabel: "The ABST Layaway Policy",
    description: "Our installment plan follows a Layaway Model...",
    note: "Note: To maintain our security standards, the device remains in our Global Vault...",
    steps: ["", "", "", ""],
    features: [
      { title: "Zero Interest", desc: "" },
      { title: "Flexible Terms", desc: "" },
      { title: "Guaranteed Hold", desc: "" },
      { title: "Loyalty Bonus", desc: "" },
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "siteContent", "financeSection");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching finance content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Centralized change handler to trigger the red button
  const handleChange = (newContent: any) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "financeSection"), content);
      toast.success("Finance section updated live!");
      setHasUnsavedChanges(false); // Reset back to blue/black
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4">
        <div className="h-16 bg-slate-100 animate-pulse rounded-md md:rounded-lg w-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:p-4">
      <div className="bg-white rounded-md md:rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
              <FiDollarSign size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 italic">Finance & Layaway Editor</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage frontend policy and terms</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                <FiChevronDown className="text-slate-400" size={20} />
             </motion.div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="px-4 py-6 md:p-6 pt-0 space-y-8 border-t border-slate-100">
                
                {/* Save Button Row */}
                <div className="flex justify-end pt-6">
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className={`${hasUnsavedChanges ? 'bg-red-600 animate-pulse' : 'bg-black'} text-white px-8 py-3 rounded-md md:rounded-lg font-black text-[10px] uppercase flex items-center gap-2 transition-all shadow-lg disabled:opacity-50`}
                    >
                        {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={16} />}
                        {saving ? "Publishing..." : hasUnsavedChanges ? "Publish Changes" : "Save Finance Settings"}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  
                  {/* Hero Content Section */}
                  <section className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase text-amber-600 flex items-center gap-2 tracking-widest">
                      <FiInfo /> Hero Header Content
                    </h2>
                    <div className="grid gap-3">
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg font-bold text-sm outline-none transition-all"
                        value={content.policyLabel}
                        onChange={(e) => handleChange({...content, policyLabel: e.target.value})}
                        placeholder="Policy Label"
                      />
                      <input 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg font-black text-lg outline-none transition-all"
                        value={content.title}
                        onChange={(e) => handleChange({...content, title: e.target.value})}
                        placeholder="Main Title"
                      />
                      <textarea 
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md md:rounded-lg font-medium h-28 outline-none transition-all text-sm"
                        value={content.description}
                        onChange={(e) => handleChange({...content, description: e.target.value})}
                        placeholder="Main Description"
                      />
                      <textarea 
                        className="w-full p-3 bg-amber-50 border border-amber-100 rounded-md md:rounded-lg font-bold text-[11px] italic text-amber-800 outline-none transition-all"
                        value={content.note}
                        onChange={(e) => handleChange({...content, note: e.target.value})}
                        placeholder="Security Note"
                      />
                    </div>
                  </section>

                  {/* Steps Section */}
                  <section className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2 tracking-widest">
                      <FiList /> Process Steps
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {content.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 bg-slate-50 p-2 px-3 rounded-md md:rounded-lg border border-slate-200 transition-all">
                          <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-[10px] shrink-0">{i+1}</span>
                          <input 
                            className="flex-1 bg-transparent outline-none font-bold text-xs py-2"
                            value={step}
                            onChange={(e) => {
                              const newSteps = [...content.steps];
                              newSteps[i] = e.target.value;
                              handleChange({...content, steps: newSteps});
                            }}
                            placeholder={`Step ${i+1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Features Section */}
                  <section className="space-y-4">
                    <h2 className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-2 tracking-widest">
                      <FiLayout /> Feature Cards
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {content.features.map((feature, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-md md:rounded-lg border border-slate-200 space-y-3 transition-all">
                          <input 
                            className="w-full bg-transparent font-black uppercase text-[11px] border-b border-slate-200 pb-1 outline-none"
                            value={feature.title}
                            onChange={(e) => {
                              const newFeatures = [...content.features];
                              newFeatures[i].title = e.target.value;
                              handleChange({...content, features: newFeatures});
                            }}
                          />
                          <textarea 
                            className="w-full bg-transparent text-[11px] font-medium h-16 outline-none resize-none"
                            value={feature.desc}
                            onChange={(e) => {
                              const newFeatures = [...content.features];
                              newFeatures[i].desc = e.target.value;
                              handleChange({...content, features: newFeatures});
                            }}
                            placeholder="Feature description..."
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}