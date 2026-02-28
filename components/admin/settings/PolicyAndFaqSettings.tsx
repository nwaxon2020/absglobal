'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSave, FiHelpCircle, FiShield, FiChevronDown, FiPlus, 
  FiTrash2, FiRefreshCw, FiEye, FiLock, FiBriefcase, FiTruck, FiClock, FiCheckCircle, FiAward, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function LegalEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [isMasterOpen, setIsMasterOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [isWhatWeDoOpen, setIsWhatWeDoOpen] = useState(false);

  const [legalData, setLegalData] = useState<any>({
    faqSubtitle: "",
    faqCategories: [], 
    policyTitle: "",
    policySubtitle: "",
    policySections: {
      collection: { intro: "", checklist: ["", "", "", ""] },
      usage: { content: "" },
      payback: { eligibility: "", timeline: "" },
      security: { content: "" }
    },
    whatWeDo: [
      { id: 1, title: "100% Authentic", icon: "shield" },
      { id: 2, title: "1 Year Warranty", icon: "award" },
      { id: 3, title: "Free Delivery", icon: "truck" },
      { id: 4, title: "Easy Returns", icon: "refresh" }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "siteContent", "legalAndHelp");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setLegalData((prev: any) => ({
            ...prev,
            ...data,
            faqCategories: data.faqCategories || [],
            policySections: {
                ...prev.policySections,
                ...(data.policySections || {})
            },
            whatWeDo: data.whatWeDo || prev.whatWeDo
          }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (newData: any) => {
    setLegalData(newData);
    setHasUnsavedChanges(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    try {
      await setDoc(doc(db, "siteContent", "legalAndHelp"), legalData);
      toast.success("Master Legal Hub Updated!");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const addFaqCategory = () => {
    const newCat = {
      category: "New Category",
      questions: [{ q: "", a: "" }]
    };
    handleChange({
      ...legalData,
      faqCategories: [...(legalData.faqCategories || []), newCat]
    });
  };

  if (loading) return <div className="p-4 h-16 bg-slate-50 animate-pulse rounded-xl" />;

  return (
    <div className="max-w-4xl mx-auto py-6 px-2 md:p-4 space-y-4 pb-20">
      
      <div className="bg-white rounded-md shadow-xl border-2 border-slate-100 overflow-hidden">
        <div 
          onClick={() => setIsMasterOpen(!isMasterOpen)}
          className="w-full flex items-center justify-between p-6 bg-slate-900 text-white cursor-pointer transition-all hover:bg-black"
        >
          <div className="flex items-center gap-5">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
              <FiBriefcase size={24} className="text-blue-400" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-black uppercase italic tracking-tighter">Support & Legal Hub</h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Master Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {isMasterOpen && (
               <button 
                 onClick={handleSave} 
                 disabled={saving} 
                 className={`${hasUnsavedChanges ? 'bg-red-600 animate-pulse' : 'bg-blue-600'} px-4 py-2 rounded-lg text-[9px] font-black uppercase flex items-center gap-2 hover:opacity-80 transition-all`}
               >
                 {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />} 
                 {hasUnsavedChanges ? "Publish Changes" : "Publish All"}
               </button>
             )}
             <motion.div animate={{ rotate: isMasterOpen ? 180 : 0 }}><FiChevronDown size={24} /></motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isMasterOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="p-6 bg-[#F8FAFC] space-y-6">
              
              {/* 1. WHAT WE DO SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div onClick={() => setIsWhatWeDoOpen(!isWhatWeDoOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FiCheckCircle className="text-emerald-500" />
                    <span className="text-xs font-black uppercase italic text-slate-700">1. "What We Do" Cards</span>
                  </div>
                  <motion.div animate={{ rotate: isWhatWeDoOpen ? 180 : 0 }}><FiChevronDown /></motion.div>
                </div>
                <AnimatePresence>
                  {isWhatWeDoOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-4 pt-0 space-y-4 border-t border-slate-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {legalData.whatWeDo.map((item: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 rounded-xl border space-y-2">
                             <div className="flex items-center gap-2">
                               <label className="text-[8px] font-black uppercase text-slate-400">Icon Type</label>
                               <input 
                                 className="bg-white border rounded p-1 text-[10px] flex-1 font-mono"
                                 value={item.icon}
                                 onChange={(e) => {
                                   const n = [...legalData.whatWeDo];
                                   n[i].icon = e.target.value;
                                   handleChange({...legalData, whatWeDo: n});
                                 }}
                                 placeholder="shield, award, truck, refresh..."
                               />
                             </div>
                             <input 
                              className="w-full p-2 bg-white border rounded-lg font-black text-xs uppercase"
                              value={item.title}
                              onChange={(e) => {
                                const n = [...legalData.whatWeDo];
                                n[i].title = e.target.value;
                                handleChange({...legalData, whatWeDo: n});
                              }}
                             />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. FAQ MANAGER - UPDATED SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div onClick={() => setIsFaqOpen(!isFaqOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3"><FiHelpCircle className="text-amber-500" /><span className="text-xs font-black uppercase italic text-slate-700">2. FAQ Manager</span></div>
                  <motion.div animate={{ rotate: isFaqOpen ? 180 : 0 }}><FiChevronDown /></motion.div>
                </div>
                <AnimatePresence>
                  {isFaqOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-4 pt-0 space-y-4 border-t border-slate-50">
                      <div className="pt-4 space-y-4">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">FAQ Page Subtitle</label>
                        <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-[10px]" value={legalData.faqSubtitle || ""} onChange={e => handleChange({...legalData, faqSubtitle: e.target.value})} placeholder="e.g. Find answers to common questions" />
                        
                        {legalData.faqCategories?.map((cat: any, catIdx: number) => (
                          <div key={catIdx} className="p-4 bg-white border-2 border-slate-100 rounded-2xl space-y-4 shadow-sm">
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                               <input className="font-black uppercase text-[11px] text-amber-600 bg-transparent outline-none w-full" value={cat.category} onChange={e => {
                                 const d = [...legalData.faqCategories]; d[catIdx].category = e.target.value; handleChange({...legalData, faqCategories: d});
                               }} placeholder="Category Name" />
                               <button onClick={() => handleChange({...legalData, faqCategories: legalData.faqCategories.filter((_: any, i: number) => i !== catIdx)})} className="text-red-500 p-1 hover:bg-red-50 rounded"><FiTrash2 size={16}/></button>
                            </div>

                            <div className="space-y-4 pl-2 border-l-2 border-slate-100">
                              {cat.questions?.map((q: any, qIdx: number) => (
                                <div key={qIdx} className="p-3 bg-slate-50 rounded-xl space-y-3 relative group">
                                   <button onClick={() => {
                                     const d = [...legalData.faqCategories];
                                     d[catIdx].questions = d[catIdx].questions.filter((_:any, i:number) => i !== qIdx);
                                     handleChange({...legalData, faqCategories: d});
                                   }} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-opacity"><FiTrash2 size={12}/></button>
                                   
                                   <div className="space-y-1">
                                      <label className="text-[8px] font-black uppercase text-slate-400">Question Title</label>
                                      <input className="w-full bg-white border p-2 rounded-lg font-black text-[11px] outline-none text-slate-700" value={q.q} onChange={e => {
                                        const d = [...legalData.faqCategories]; d[catIdx].questions[qIdx].q = e.target.value; handleChange({...legalData, faqCategories: d});
                                      }} placeholder="Enter Question" />
                                   </div>

                                   <div className="space-y-1">
                                      <label className="text-[8px] font-black uppercase text-slate-400">Answer Content</label>
                                      <textarea className="w-full bg-white border p-2 rounded-lg text-[10px] h-24 outline-none font-medium text-slate-600" value={q.a} onChange={e => {
                                        const d = [...legalData.faqCategories]; d[catIdx].questions[qIdx].a = e.target.value; handleChange({...legalData, faqCategories: d});
                                      }} placeholder="Enter detailed answer..." />
                                   </div>
                                </div>
                              ))}
                              <button onClick={() => { const d = [...legalData.faqCategories]; d[catIdx].questions.push({q: "", a: ""}); handleChange({...legalData, faqCategories: d}); }} className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-600 hover:text-blue-800"><FiPlus size={14}/> Add Question</button>
                            </div>
                          </div>
                        ))}

                        <button onClick={addFaqCategory} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-400 hover:border-amber-400 hover:text-amber-500 transition-all font-black uppercase text-[10px]">
                          <FiPlus /> Add New Category
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. PRIVACY & POLICY SECTION */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div onClick={() => setIsPolicyOpen(!isPolicyOpen)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3"><FiShield className="text-indigo-500" /><span className="text-xs font-black uppercase italic text-slate-700">3. Privacy & Policy Settings</span></div>
                  <motion.div animate={{ rotate: isPolicyOpen ? 180 : 0 }}><FiChevronDown /></motion.div>
                </div>
                <AnimatePresence>
                  {isPolicyOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-4 pt-0 space-y-6 border-t border-slate-50">
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div>
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Main Title</label>
                           <input className="w-full p-3 bg-slate-50 border rounded-xl font-black text-xs italic" value={legalData.policyTitle || ""} onChange={e => handleChange({...legalData, policyTitle: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Subtitle</label>
                           <input className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-[10px] text-slate-400" value={legalData.policySubtitle || ""} onChange={e => handleChange({...legalData, policySubtitle: e.target.value})} />
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                         <h4 className="text-[10px] font-black uppercase text-blue-600 flex items-center gap-2"><FiEye/> 1. Information Collection</h4>
                         <textarea className="w-full p-3 bg-white border rounded-xl text-[10px] font-medium h-20" value={legalData.policySections?.collection?.intro || ""} onChange={e => handleChange({...legalData, policySections: {...legalData.policySections, collection: {...legalData.policySections.collection, intro: e.target.value}}})} />
                         <div className="grid grid-cols-2 gap-2">
                            {(legalData.policySections?.collection?.checklist || ["", "", "", ""]).map((item: string, i: number) => (
                              <div key={i} className="flex items-center gap-2 bg-white p-2 rounded-lg border">
                                <FiCheckCircle className="text-blue-500" size={12}/>
                                <input className="bg-transparent outline-none text-[9px] font-bold w-full" value={item} onChange={e => {
                                  const newCheck = [...(legalData.policySections.collection.checklist || ["","","",""])];
                                  newCheck[i] = e.target.value;
                                  handleChange({...legalData, policySections: {...legalData.policySections, collection: {...legalData.policySections.collection, checklist: newCheck}}});
                                }} />
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                         <h4 className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><FiShield/> 2. Usage Policy</h4>
                         <textarea className="w-full p-3 bg-white border rounded-xl text-[10px] font-medium h-24" value={legalData.policySections?.usage?.content || ""} onChange={e => handleChange({...legalData, policySections: {...legalData.policySections, usage: {content: e.target.value}}})} />
                      </div>

                      <div className="p-4 bg-[#0B2A4A] rounded-2xl border space-y-4 text-white">
                         <h4 className="text-[10px] font-black uppercase text-yellow-400 flex items-center gap-2"><FiRefreshCw/> 3. Payback & Refunds</h4>
                         <div className="space-y-3">
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-white/40 flex items-center gap-1"><FiTruck/> Eligibility Text</label>
                              <textarea className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium h-20 text-white" value={legalData.policySections?.payback?.eligibility || ""} onChange={e => handleChange({...legalData, policySections: {...legalData.policySections, payback: {...legalData.policySections.payback, eligibility: e.target.value}}})} />
                           </div>
                           <div className="space-y-1">
                              <label className="text-[8px] font-black uppercase text-white/40 flex items-center gap-1"><FiClock/> Processing Timeline</label>
                              <textarea className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-[10px] font-medium h-20 text-white" value={legalData.policySections?.payback?.timeline || ""} onChange={e => handleChange({...legalData, policySections: {...legalData.policySections, payback: {...legalData.policySections.payback, timeline: e.target.value}}})} />
                           </div>
                         </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 space-y-2">
                         <h4 className="text-[10px] font-black uppercase text-red-600 flex items-center gap-2"><FiLock/> 4. Data Security</h4>
                         <textarea className="w-full p-3 bg-white border border-red-100 rounded-xl text-[10px] font-bold h-20 text-slate-700" value={legalData.policySections?.security?.content || ""} onChange={e => handleChange({...legalData, policySections: {...legalData.policySections, security: {content: e.target.value}}})} />
                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}