'use client';

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSave, FiMail, FiMapPin, FiGlobe, FiChevronDown, 
  FiRefreshCw, FiTrash2, FiUploadCloud 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ContactEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); // Change tracking
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [content, setContent] = useState({
    siteName: "A.B.S.T Global",
    siteSubtitle: "Luxury Automotive & Mobile Technology",
    footerWriteup: "Your premier destination for luxury automotive, fashion, and the latest mobile technology. Experience the A.B.S.T standard.",
    logoUrl: "",
    contactEmail: "",
    contactPhone: "", // Raw digits
    address: "",
    socials: [] as { platform: string, username: string, url: string }[]
  });

  const socialBoilerplates: Record<string, string> = {
    Instagram: "https://instagram.com/",
    Facebook: "https://facebook.com/",
    Twitter: "https://twitter.com/",
    TikTok: "https://tiktok.com/@",
    WhatsApp: "https://wa.me/234"
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "siteContent", "globalSettings");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data() as any);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchSettings();
  }, []);

  // Helper to update state and trigger red button
  const handleChange = (newContent: any) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  // Phone Logic: Strip 0, +234, 234
  const formatPhoneInput = (val: string) => {
    let raw = val.replace(/\D/g, ''); 
    if (raw.startsWith('234')) raw = raw.substring(3);
    else if (raw.startsWith('0')) raw = raw.substring(1);
    handleChange({ ...content, contactPhone: raw });
  };

  const addSocial = () => {
    handleChange({ ...content, socials: [...content.socials, { platform: 'Instagram', username: '', url: '' }] });
  };

  const updateSocial = (index: number, field: string, value: string) => {
    const newSocials = [...content.socials];
    const item = { ...newSocials[index], [field]: value };
    if (field === 'username' || field === 'platform') {
      item.url = (socialBoilerplates[item.platform] || "") + item.username;
    }
    newSocials[index] = item;
    handleChange({ ...content, socials: newSocials });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      handleChange({ ...content, logoUrl: URL.createObjectURL(file) });
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaving(true);
    const tId = toast.loading("Saving global settings...");
    
    try {
      let finalLogoUrl = content.logoUrl;
      if (logoFile) {
        const sRef = ref(storage, `site/logo_${Date.now()}`);
        await uploadBytes(sRef, logoFile);
        finalLogoUrl = await getDownloadURL(sRef);
      }

      const updated = { ...content, logoUrl: finalLogoUrl };
      await setDoc(doc(db, "siteContent", "globalSettings"), updated);
      setLogoFile(null);
      setHasUnsavedChanges(false); // Reset to Indigo
      toast.success("Settings updated live!", { id: tId });
    } catch (error) {
      toast.error("Save failed", { id: tId });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-4 h-16 bg-slate-100 animate-pulse rounded-lg" />;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 md:p-4">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center"><FiGlobe size={20} /></div>
            <div className="text-left">
              <h3 className="text-sm font-black uppercase italic text-slate-900 tracking-tight">Contact & Location Editor</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo, Socials, and Map Location</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={20} /></motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className="py-6 px-3 md:p-6 space-y-8 border-t border-slate-100 bg-[#FAFBFF]">
                
                <div className="flex justify-end sticky top-0 z-10 py-2">
                  <button 
                    onClick={handleSave} 
                    disabled={saving} 
                    className={`${hasUnsavedChanges ? 'bg-red-600 animate-pulse' : 'bg-indigo-600'} text-white px-8 py-3 rounded-lg font-black text-[10px] uppercase flex items-center gap-2 shadow-lg hover:opacity-90 transition-all`}
                  >
                    {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave size={16} />} 
                    {saving ? "Publishing..." : hasUnsavedChanges ? "Publish Changes" : "Save All Settings"}
                  </button>
                </div>

                {/* 1. BRANDING & LOGO */}
                <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                  <h2 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2 italic"><FiGlobe /> Site Identity</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative w-full h-32 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group overflow-hidden">
                      {content.logoUrl ? <img src={content.logoUrl} className="h-full w-full object-contain p-2" /> : <FiUploadCloud className="text-slate-300" size={30} />}
                      <label className="absolute inset-0 bg-indigo-600/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black cursor-pointer uppercase transition-all">
                        Change Logo
                        <input type="file" hidden accept="image/*" onChange={handleLogoUpload} />
                      </label>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <input className="w-full p-3 bg-slate-50 border rounded-lg font-black text-sm outline-none" value={content.siteName} onChange={e => handleChange({...content, siteName: e.target.value})} placeholder="Site Name" />
                      <input className="w-full p-3 bg-slate-50 border rounded-lg font-bold text-xs text-slate-500 outline-none" value={content.siteSubtitle} onChange={e => handleChange({...content, siteSubtitle: e.target.value})} placeholder="Site Subtitle" />
                    </div>
                  </div>
                  <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Footer write-up</label>
                  <textarea className="w-full p-3 bg-slate-50 border rounded-lg text-xs font-medium h-20 outline-none" value={content.footerWriteup} onChange={e => handleChange({...content, footerWriteup: e.target.value})} placeholder="Footer Description Writeup..." />
                </section>

                {/* 2. CONTACT & LOCATION */}
                <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                  <h2 className="text-[10px] font-black uppercase text-rose-600 tracking-widest flex items-center gap-2 italic"><FiMapPin /> Reach & Location</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Phone Number (+234 Auto)</label>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                        <span className="text-xs font-black text-slate-400">+234</span>
                        <input className="bg-transparent outline-none font-bold text-sm w-full" value={content.contactPhone} onChange={e => formatPhoneInput(e.target.value)} placeholder="8012345678" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Official Email</label>
                      <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                        <FiMail className="text-rose-500" />
                        <input className="bg-transparent outline-none font-bold text-xs w-full" value={content.contactEmail} onChange={e => handleChange({...content, contactEmail: e.target.value})} placeholder="hello@abstglobal.com" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Office Address (Used for Google Maps)</label>
                    <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border">
                      <FiMapPin className="text-indigo-500" />
                      <input className="bg-transparent outline-none font-bold text-xs w-full" value={content.address} onChange={e => handleChange({...content, address: e.target.value})} placeholder="123 ABST Tower, Lagos, Nigeria" />
                    </div>
                  </div>
                </section>

                {/* 3. SOCIAL MEDIA DYNAMIC */}
                <section className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h2 className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-2 italic">Social Media Links</h2>
                    <button onClick={addSocial} className="text-[9px] bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full font-black uppercase">+ Add Platform</button>
                  </div>
                  <div className="grid gap-3">
                    {content.socials.map((social, i) => (
                      <div key={i} className="flex flex-col md:flex-row gap-3 p-3 bg-slate-50 rounded-lg border group relative">
                        <select className="bg-white p-2 rounded-lg border font-bold text-xs outline-none" value={social.platform} onChange={e => updateSocial(i, 'platform', e.target.value)}>
                          {Object.keys(socialBoilerplates).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input className="flex-1 bg-white p-2 rounded-lg border font-bold text-xs outline-none" value={social.username} onChange={e => updateSocial(i, 'username', e.target.value)} placeholder="Username (e.g. abst_global)" />
                        <div className="flex-1 bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-[10px] font-mono text-indigo-400 truncate flex items-center">
                          {social.url || "URL will appear here"}
                        </div>
                        <button onClick={() => handleChange({...content, socials: content.socials.filter((_, idx) => idx !== i)})} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 /></button>
                      </div>
                    ))}
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