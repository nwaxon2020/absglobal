'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  FiSave, FiInfo, FiList, FiLayout, FiCheckCircle, 
  FiCreditCard, FiClock, FiPercent, FiRefreshCw 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FinanceEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State for all editable content
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

  // Fetch current data from Firebase
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "financeSection"), content);
      toast.success("Finance section updated live!");
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-slate-400">LOADING CONTENT...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8 space-y-8 pb-20">
      {/* Header */}
      <div className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase italic italic text-slate-900">Finance Editor</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Layaway Policy & Terms</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={16} />}
          {saving ? "Saving..." : "Publish Changes"}
        </button>
      </div>

      {/* Main Hero Content */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-black uppercase text-amber-600 flex items-center gap-2">
          <FiInfo /> Hero Header Content
        </h2>
        <div className="grid gap-4">
          <input 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold"
            value={content.policyLabel}
            onChange={(e) => setContent({...content, policyLabel: e.target.value})}
            placeholder="Policy Label (e.g. ABST Layaway Policy)"
          />
          <input 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg"
            value={content.title}
            onChange={(e) => setContent({...content, title: e.target.value})}
            placeholder="Main Title"
          />
          <textarea 
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium h-32"
            value={content.description}
            onChange={(e) => setContent({...content, description: e.target.value})}
            placeholder="Main Description"
          />
          <textarea 
            className="w-full p-3 bg-amber-50 border border-amber-100 rounded-xl font-bold text-xs italic text-amber-800"
            value={content.note}
            onChange={(e) => setContent({...content, note: e.target.value})}
            placeholder="Security Note"
          />
        </div>
      </section>

      {/* Steps Editor */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-black uppercase text-blue-600 flex items-center gap-2">
          <FiList /> Process Steps (1-4)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">{i+1}</span>
              <input 
                className="flex-1 bg-transparent outline-none font-bold text-sm"
                value={step}
                onChange={(e) => {
                  const newSteps = [...content.steps];
                  newSteps[i] = e.target.value;
                  setContent({...content, steps: newSteps});
                }}
                placeholder={`Step ${i+1}`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Features Editor */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-sm font-black uppercase text-emerald-600 flex items-center gap-2">
          <FiLayout /> Feature Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.features.map((feature, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <input 
                className="w-full bg-transparent font-black uppercase text-sm border-b border-slate-200 pb-1"
                value={feature.title}
                onChange={(e) => {
                  const newFeatures = [...content.features];
                  newFeatures[i].title = e.target.value;
                  setContent({...content, features: newFeatures});
                }}
              />
              <textarea 
                className="w-full bg-transparent text-xs font-medium h-20 outline-none"
                value={feature.desc}
                onChange={(e) => {
                  const newFeatures = [...content.features];
                  newFeatures[i].desc = e.target.value;
                  setContent({...content, features: newFeatures});
                }}
                placeholder="Feature description..."
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}