'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSave, FiImage, FiBookOpen, FiUser, 
  FiRefreshCw, FiChevronDown, FiTrash2, FiLink, FiUploadCloud, 
  FiFileText, FiAlertTriangle, FiMail, FiPhone, FiInfo, FiTarget, FiTrendingUp, FiShield, FiAward
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Define strict types
interface CoreValue {
  title: string;
  desc: string;
}

interface StatItem {
  label: string;
  value: string;
}

interface AboutContent {
  heroImages: string[];
  heroTitle: string;
  heroSubtitle: string;
  journeyTitle: string;
  journeyText1: string;
  journeyText2: string;
  journeyImage: string;
  certImage: string;
  ceoName: string;
  ceoHeader: string; // New: "Empowering Innovators"
  ceoNote: string;
  ceoMotto: string;
  ceoImage: string;
  contactEmail: string;
  contactPhone: string;
  coreValues: CoreValue[];
  stats: StatItem[]; // New: Stats section
}

export default function AboutEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const [heroFiles, setHeroFiles] = useState<(File | null)[]>([]);
  const [ceoFile, setCeoFile] = useState<File | null>(null);
  const [journeyFile, setJourneyFile] = useState<File | null>(null);
  const [certFile, setCertFile] = useState<File | null>(null);
  
  const [content, setContent] = useState<AboutContent>({
    heroImages: [""],
    heroTitle: "Defining the ABST Standard",
    heroSubtitle: "Excellence in Mobile Technology & Digital Lifestyle",
    journeyTitle: "Our Journey",
    journeyText1: "",
    journeyText2: "",
    journeyImage: "",
    certImage: "", 
    ceoName: "",
    ceoHeader: "Empowering Innovators",
    ceoNote: "",
    ceoMotto: "Hardwork & Trust",
    ceoImage: "",
    contactEmail: "",
    contactPhone: "",
    coreValues: [
        { title: 'Authenticity', desc: 'Every device is verified and 100% original.' },
        { title: 'Security', desc: 'Your data and payments are protected.' },
        { title: 'Innovation', desc: 'Staying ahead with the latest releases.' }
    ],
    stats: [
        { label: 'Devices Delivered', value: '10k+' },
        { label: 'Happy Clients', value: '8k+' },
        { label: 'Years Experience', value: '5+' },
        { label: 'Secure Partners', value: '100%' }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "siteContent", "aboutPage");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as AboutContent;
          setContent({
            ...content,
            ...data,
            stats: data.stats || content.stats // Fallback if stats don't exist in DB yet
          });
        }
      } catch (error) {
        console.error("Error fetching about content:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (newContent: AboutContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File) => void, field: keyof AboutContent) => {
    const file = e.target.files?.[0];
    if (file) {
      setter(file);
      const preview = URL.createObjectURL(file);
      handleChange({ ...content, [field]: preview });
    }
  };

  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFiles = [...heroFiles];
      newFiles[index] = file;
      setHeroFiles(newFiles);
      const preview = URL.createObjectURL(file);
      const newImgs = [...content.heroImages];
      newImgs[index] = preview;
      handleChange({ ...content, heroImages: newImgs });
    }
  };

  const confirmDeleteSlide = () => {
    if (imageToDelete !== null) {
      const newImages = content.heroImages.filter((_, idx: number) => idx !== imageToDelete);
      const newFiles = heroFiles.filter((_, idx: number) => idx !== imageToDelete);
      handleChange({ ...content, heroImages: newImages });
      setHeroFiles(newFiles);
      setImageToDelete(null);
      toast.success("Slide removed");
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    const tId = toast.loading("Publishing updates...");
    
    try {
      let finalCeoUrl = content.ceoImage;
      let finalJourneyUrl = content.journeyImage;
      let finalCertUrl = content.certImage;
      let finalHeroUrls = [...content.heroImages];

      for (let i = 0; i < heroFiles.length; i++) {
        if (heroFiles[i]) {
          const hRef = ref(storage, `site/hero_${Date.now()}_${i}`);
          await uploadBytes(hRef, heroFiles[i]!);
          finalHeroUrls[i] = await getDownloadURL(hRef);
        }
      }

      if (ceoFile) {
        const refCeo = ref(storage, `site/ceo_${Date.now()}`);
        await uploadBytes(refCeo, ceoFile);
        finalCeoUrl = await getDownloadURL(refCeo);
      }
      if (journeyFile) {
        const refJourney = ref(storage, `site/journey_${Date.now()}`);
        await uploadBytes(refJourney, journeyFile);
        finalJourneyUrl = await getDownloadURL(refJourney);
      }
      if (certFile) {
        const refCert = ref(storage, `site/cert_${Date.now()}`);
        await uploadBytes(refCert, certFile);
        finalCertUrl = await getDownloadURL(refCert);
      }

      const updatedContent = { 
        ...content, 
        heroImages: finalHeroUrls,
        ceoImage: finalCeoUrl, 
        journeyImage: finalJourneyUrl,
        certImage: finalCertUrl 
      };

      await setDoc(doc(db, "siteContent", "aboutPage"), updatedContent);
      setCeoFile(null); setJourneyFile(null); setCertFile(null); setHeroFiles([]);
      setHasUnsavedChanges(false);
      toast.success("About page updated!", { id: tId });
    } catch (error) {
      toast.error("Update failed", { id: tId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-4 h-16 bg-slate-100 animate-pulse rounded-lg" />;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:p-4 relative">
      <AnimatePresence>
        {imageToDelete !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setImageToDelete(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full text-center border-t-4 border-red-500">
              <FiAlertTriangle size={40} className="text-red-500 mx-auto mb-3" />
              <h3 className="text-sm font-black uppercase italic text-slate-900">Remove Slide?</h3>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={() => setImageToDelete(null)} className="py-3 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase">Cancel</button>
                <button onClick={confirmDeleteSlide} className="py-3 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><FiBookOpen size={20} /></div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900 italic">About Page Editor</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Multimedia Story & Contact</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={20} /></motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="px-4 py-6 md:p-6 space-y-8 border-t border-slate-100 bg-[#FBFCFF]">
                
                <div className="flex justify-end sticky top-0 z-10 py-2">
                  <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`${hasUnsavedChanges ? 'bg-red-600 animate-pulse' : 'bg-black'} text-white px-8 py-3 rounded-lg font-black text-[10px] uppercase flex items-center gap-2 transition-all shadow-xl`}
                  >
                    {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={16} />} 
                    {saving ? "Publishing..." : hasUnsavedChanges ? "Publish Changes" : "Save About Settings"}
                  </button>
                </div>

                {/* 1. HERO Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                  <div className="flex justify-between items-center">
                    <h2 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2 italic"><FiImage /> 1. Hero Content</h2>
                    <button onClick={() => handleChange({...content, heroImages: [...content.heroImages, ""]})} className="text-[9px] bg-amber-50 text-amber-600 px-3 py-1 rounded-xl font-black uppercase tracking-widest">+ Add Slide</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                     <input className="p-3 bg-slate-50 border rounded-lg font-black text-xs italic outline-none" value={content.heroTitle} onChange={e => handleChange({...content, heroTitle: e.target.value})} placeholder="Main Hero Title" />
                     <input className="p-3 bg-slate-50 border rounded-lg font-bold text-[10px] text-slate-400 outline-none" value={content.heroSubtitle} onChange={e => handleChange({...content, heroSubtitle: e.target.value})} placeholder="Hero Subtitle" />
                  </div>

                  {/* Restored hero image cards rendering */}
                  <div className="grid gap-4">
                    {content.heroImages.map((img: string, i: number) => (
                      <div key={i} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 group">
                        <div className="relative w-full md:w-24 h-24 bg-white rounded-lg border overflow-hidden shrink-0">
                          {img ? <img src={img} className="w-full h-full object-cover" alt="Hero Preview" /> : <div className="flex items-center justify-center h-full text-slate-200"><FiUploadCloud size={20}/></div>}
                          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                            <FiUploadCloud size={18} /><input type="file" hidden onChange={(e) => handleHeroFileUpload(e, i)} />
                          </label>
                        </div>
                        <div className="flex-1 flex gap-2 items-center">
                           <input className="flex-1 p-3 bg-white border border-slate-200 rounded-lg text-[10px] font-mono outline-none" value={heroFiles[i] ? "Local File Selected" : img} onChange={(e) => {
                             const n = [...content.heroImages]; n[i] = e.target.value; handleChange({...content, heroImages: n});
                           }} placeholder="Image URL..." disabled={!!heroFiles[i]} />
                           <button onClick={() => setImageToDelete(i)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><FiTrash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2. STATS Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                   <h2 className="text-[10px] font-black uppercase text-yellow-600 tracking-widest flex items-center gap-2 italic"><FiTrendingUp /> 2. Impact Statistics</h2>
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {content.stats.map((stat: StatItem, i: number) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-yellow-100 space-y-1">
                           <div className="flex items-center gap-2 mb-1">
                             {i === 0 && <FiAward className="text-yellow-600" size={12}/>}
                             {i === 1 && <FiTarget className="text-yellow-600" size={12}/>}
                             {i === 2 && <FiTrendingUp className="text-yellow-600" size={12}/>}
                             {i === 3 && <FiShield className="text-yellow-600" size={12}/>}
                             <input className="w-full bg-transparent font-black text-xs text-slate-900 outline-none" value={stat.value} onChange={e => {
                               const n = [...content.stats]; n[i].value = e.target.value; handleChange({...content, stats: n});
                             }} placeholder="Value (e.g. 10k+)" />
                           </div>
                           <input className="w-full bg-transparent text-[9px] font-bold text-slate-400 uppercase tracking-tighter outline-none" value={stat.label} onChange={e => {
                             const n = [...content.stats]; n[i].label = e.target.value; handleChange({...content, stats: n});
                           }} placeholder="Label" />
                        </div>
                      ))}
                   </div>
                </section>

                {/* 3. JOURNEY Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                  <h2 className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2 italic"><FiBookOpen /> 3. Our Journey</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="relative h-48 bg-slate-100 rounded-xl overflow-hidden flex border-2 border-dashed group">
                          {content.journeyImage ? <img src={content.journeyImage} className="w-full h-full object-cover" alt="Journey Preview" /> : <div className="m-auto text-slate-300 text-[10px] font-black">STORY IMAGE</div>}
                          <label className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black cursor-pointer uppercase">
                            <FiUploadCloud size={20} className="mr-2" /> Select File
                            <input type="file" hidden onChange={(e) => handleFileUpload(e, setJourneyFile, 'journeyImage')} />
                          </label>
                        </div>
                        <input className="w-full p-3 bg-slate-50 border rounded-lg text-[9px] font-bold outline-none" value={journeyFile ? "File Selected" : content.journeyImage} onChange={e => handleChange({...content, journeyImage: e.target.value})} placeholder="Or enter Image URL..." disabled={!!journeyFile} />
                    </div>
                    <div className="space-y-3">
                      <input className="w-full p-3 bg-white border rounded-lg font-black italic text-sm text-blue-900 outline-none" value={content.journeyTitle} onChange={e => handleChange({...content, journeyTitle: e.target.value})} placeholder="Title" />
                      <textarea className="w-full p-3 bg-slate-50 border rounded-lg text-xs h-24 outline-none" value={content.journeyText1} onChange={e => handleChange({...content, journeyText1: e.target.value})} placeholder="Paragraph 1..." />
                      <textarea className="w-full p-3 bg-slate-50 border rounded-lg text-xs h-24 outline-none" value={content.journeyText2} onChange={e => handleChange({...content, journeyText2: e.target.value})} placeholder="Paragraph 2..." />
                    </div>
                  </div>
                </section>

                {/* 4. LEADERSHIP Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                  <h2 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2 italic"><FiUser /> 4. Leadership & CEO Note</h2>
                  
                  <div className="mb-4">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Leadership Header</label>
                    <input 
                      className="w-full p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl font-black italic text-sm text-emerald-900 outline-none" 
                      value={content.ceoHeader} 
                      onChange={e => handleChange({...content, ceoHeader: e.target.value})} 
                      placeholder="e.g. Empowering Innovators" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="relative h-56 bg-slate-100 rounded-xl overflow-hidden flex border group shadow-inner">
                          {content.ceoImage ? <img src={content.ceoImage} className="w-full h-full object-cover" alt="CEO Preview" /> : <div className="m-auto text-slate-300 text-[10px] font-black">CEO PORTRAIT</div>}
                          <label className="absolute inset-0 bg-emerald-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black cursor-pointer uppercase">
                            <FiUploadCloud size={20} className="mr-2" /> Upload CEO Photo
                            <input type="file" hidden onChange={(e) => handleFileUpload(e, setCeoFile, 'ceoImage')} />
                          </label>
                        </div>
                        <div className="grid gap-2">
                           <input className="w-full p-3 bg-slate-50 border rounded-lg text-xs font-black outline-none" value={content.ceoName} onChange={e => handleChange({...content, ceoName: e.target.value})} placeholder="CEO Name" />
                           <input className="w-full p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-[10px] font-black uppercase italic outline-none" value={content.ceoMotto} onChange={e => handleChange({...content, ceoMotto: e.target.value})} placeholder="Motto..." />
                        </div>
                    </div>
                    <div className="space-y-4">
                       <textarea className="w-full p-4 bg-slate-50 border rounded-xl text-xs h-40 italic leading-loose outline-none" value={content.ceoNote} onChange={e => handleChange({...content, ceoNote: e.target.value})} placeholder="CEO Message..." />
                       <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
                            <FiMail className="text-blue-500" />
                            <input className="bg-transparent outline-none font-bold text-[10px] w-full" value={content.contactEmail} onChange={e => handleChange({...content, contactEmail: e.target.value})} placeholder="CEO Email" />
                          </div>
                          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-100">
                            <FiPhone className="text-emerald-500" />
                            <input className="bg-transparent outline-none font-bold text-[10px] w-full" value={content.contactPhone} onChange={e => handleChange({...content, contactPhone: e.target.value})} placeholder="CEO Phone with Country Code" />
                          </div>
                       </div>
                    </div>
                  </div>
                </section>

                {/* 5. VALUES Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                   <h2 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 italic"><FiTarget /> 5. Core Values</h2>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {content.coreValues.map((v: CoreValue, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-indigo-50 space-y-2">
                           <input className="w-full bg-transparent font-black uppercase text-[10px] text-indigo-600 border-b outline-none" value={v.title} onChange={e => {
                             const n = [...content.coreValues]; n[i].title = e.target.value; handleChange({...content, coreValues: n});
                           }} />
                           <textarea className="w-full bg-transparent text-[10px] font-medium h-16 outline-none resize-none" value={v.desc} onChange={e => {
                             const n = [...content.coreValues]; n[i].desc = e.target.value; handleChange({...content, coreValues: n});
                           }} />
                        </div>
                      ))}
                   </div>
                </section>

                {/* 6. TRUST Section */}
                <section className="space-y-4 bg-white p-5 rounded-xl border shadow-sm">
                  <h2 className="text-[10px] font-black uppercase text-purple-600 tracking-widest flex items-center gap-2 italic"><FiFileText /> 6. Trust & Compliance</h2>
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative w-32 h-44 bg-white rounded-lg overflow-hidden border group shrink-0 shadow-lg">
                       {content.certImage ? <img src={content.certImage} className="w-full h-full object-contain p-2" alt="Certificate" /> : <div className="m-auto text-[8px] font-black text-purple-200 uppercase">CERTIFICATE</div>}
                       <label className="absolute inset-0 bg-purple-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black cursor-pointer uppercase p-2">
                         <FiUploadCloud size={18} /> Replace
                         <input type="file" hidden onChange={(e) => handleFileUpload(e, setCertFile, 'certImage')} />
                       </label>
                    </div>
                    <div className="flex-1 space-y-3">
                       <div className="flex items-start gap-2 text-purple-700 bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                          <FiInfo className="mt-0.5 shrink-0" size={14} />
                          <p className="text-[10px] font-bold leading-relaxed uppercase tracking-tighter">Upload business certificates or C of O docs for trust.</p>
                       </div>
                       <input className="w-full p-3 bg-slate-50 border rounded-lg text-[10px] font-bold outline-none italic" value={certFile ? "File Selected" : content.certImage} onChange={e => handleChange({...content, certImage: e.target.value})} placeholder="Or Image URL..." disabled={!!certFile} />
                    </div>
                  </div>
                </section>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}