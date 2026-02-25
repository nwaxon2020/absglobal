"use client";

import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { 
  collection, getDocs, addDoc, serverTimestamp, 
  query, orderBy, deleteDoc, doc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, FiUsers, FiMail, FiCheckCircle, FiAlertCircle, 
  FiType, FiUser, FiImage, FiLink, FiChevronDown, FiTrash2, FiClock 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const NewsletterBroadcastUi = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCEO, setIsCEO] = useState(false);

  const CEO_UID = "w5cHIIRMCZXKiksrjDantzxpq142";

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setIsCEO(user?.uid === CEO_UID);
    });
    
    fetchData();
    return () => unsub();
  }, []);

  const fetchData = async () => {
    try {
      const subSnap = await getDocs(collection(db, "newsletter_subscribers"));
      setSubscribers(subSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const histQuery = query(collection(db, "broadcast_history"), orderBy("created", "desc"));
      const histSnap = await getDocs(histQuery);
      setHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !content) return toast.error("Please fill all fields");
    if (subscribers.length === 0) return toast.error("No subscribers found");

    setLoading(true);

    try {
      // 1. Create a Master Record in History
      await addDoc(collection(db, "broadcast_history"), {
        subject,
        content,
        imageUrl,
        recipientCount: subscribers.length,
        created: serverTimestamp(),
      });

      // 2. Trigger individual emails
      const emailPromises = subscribers.map(s => {
        return addDoc(collection(db, "mail"), {
          to: s.email,
          message: {
            subject: subject,
            text: content,
            html: `
              <div style="font-family: Arial, sans-serif; color: #0B2A4A; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
                ${imageUrl ? `<div style="width: 100%; background-color: #f9f9f9; text-align: center;"><img src="${imageUrl}" style="width: 100%; max-width: 600px; height: auto; display: block; margin: 0 auto;" /></div>` : ''}
                <div style="padding: 30px; text-align: center;">
                  <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 20px;">ABST Global Update</h1>
                  <div style="font-size: 16px; text-align: center; line-height: 1.7; color: #444; margin-bottom: 30px;">${content.replace(/\n/g, '<br>')}</div>
                  <a href="https://abst-global.com/store" style="display: inline-block; background-color: #0B2A4A; color: #ffffff; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; text-transform: uppercase;">Visit Store</a>
                </div>
              </div>`,
          },
          created: serverTimestamp(),
        });
      });

      await Promise.all(emailPromises);
      toast.success("Broadcast dispatched and archived!");
      setSubject(''); setContent(''); setImageUrl(''); fetchData();
    } catch (error) {
      toast.error("Dispatch failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteBroadcast = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "broadcast_history", deleteTarget));
      toast.success("Record deleted");
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (!isCEO) return <div className="p-10 text-center font-black text-red-600 tracking-tighter">ACCESS DENIED</div>;

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-4 pb-20 md:px-6">
      
      {/* DELETE CONFIRMATION OVERLAY */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[100] bg-[#0B2A4A]/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-gray-100"
            >
              <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiTrash2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-[#0B2A4A] mb-3">Delete Record?</h3>
              <p className="text-gray-500 text-xs font-bold leading-relaxed mb-8 px-4">
                This will remove the archive from your history. This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteTarget(null)} 
                  className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={deleteBroadcast} 
                  className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-200"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <div className='mb-4 flex justify-between items-center'>
            {/* HISTORY DROPDOWN BUTTON */}
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className={`px-6 py-2.5 rounded-xl shadow-sm border transition-all flex items-center gap-3 ${showHistory ? 'bg-[#0B2A4A] border-[#0B2A4A] text-white' : 'bg-white border-gray-100 text-[#0B2A4A]'}`}
            >
                <FiClock size={18} className={showHistory ? 'text-yellow-400' : 'text-blue-600'} />
                <span className="text-[10px] font-black uppercase tracking-widest">History Log</span>
                <FiChevronDown className={`transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            
            <a href='/admin' className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 hover:bg-gray-50 transition-all">
              <FiUser size={18} className="text-[#0B2A4A]" />
              <span className="text-[9px] font-black text-[#0B2A4A] uppercase tracking-widest">Dashboard</span>
            </a>
        </div>

        {/* BROADCAST HISTORY CARDS */}
        <AnimatePresence>
            {showHistory && (
                <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="overflow-hidden mb-10 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                {history.map((item) => (
                    <motion.div 
                    layout
                    key={item.id} 
                    className="bg-white rounded md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all group"
                    >
                    {/* Top Section: Image Preview & Subject */}
                    <div className="flex gap-4 p-4">
                        {item.imageUrl ? (
                        <img 
                            src={item.imageUrl} 
                            className="w-16 h-16 object-contain rounded-xl bg-gray-50 flex-shrink-0" 
                            alt="History Thumbnail"
                        />
                        ) : (
                        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0">
                            <FiMail size={20} />
                        </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-tighter mb-1">
                            {item.created?.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </p>
                            <button 
                            onClick={() => setDeleteTarget(item.id)} 
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            >
                            <FiTrash2 size={14} />
                            </button>
                        </div>
                        <h4 className="font-black text-[#0B2A4A] text-xs truncate mb-1 uppercase tracking-tight">
                            {item.subject}
                        </h4>
                        {/* Content Snippet */}
                        <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed">
                            {item.content}
                        </p>
                        </div>
                    </div>

                    {/* Bottom Section: Stats Bar */}
                    <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-[9px] font-black text-[#0B2A4A]/60">
                            <FiUsers size={12} className="text-blue-600" />
                            <span>{item.recipientCount} CLIENTS</span>
                        </div>
                        {item.imageUrl && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-green-600">
                            <FiImage size={12} />
                            <span>IMAGE</span>
                            </div>
                        )}
                        </div>
                        
                        {/* Reuse Data Button */}
                        <button 
                        onClick={() => {
                            setSubject(item.subject);
                            setContent(item.content);
                            if(item.imageUrl) {
                                setImageUrl(item.imageUrl);
                                setShowImageInput(true);
                            }
                            toast.success("Broadcast data loaded into composer");
                        }}
                        className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                        >
                        Copy to Composer
                        </button>
                    </div>
                    </motion.div>
                ))}
                
                {history.length === 0 && (
                    <div className="col-span-full bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl py-12 text-center">
                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">No previous broadcasts found</p>
                    </div>
                )}
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* HEADER SHOWING SUBSCRIBERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-[#0B2A4A] p-6 md:rounded-xl text-white shadow-xl flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-yellow-400"><FiUsers size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Audience</p><p className="text-lg md:text-xl font-black italic">{subscribers.length} Subscribers</p></div>
          </div>
          <div className="bg-white p-6 md:rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600"><FiCheckCircle size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Status</p><p className="text-sm font-black text-[#0B2A4A]">Ready for Dispatch</p></div>
          </div>
        </div>

        {/* Text Input Area */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white md:rounded-xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-[#0B2A4A] p-4 text-center">
            <p className="text-white text-[9px] font-black uppercase tracking-[0.4em]">Broadcast Composer</p>
          </div>
          <form onSubmit={handleBroadcast} className="p-4 md:p-12 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
                <FiType className="text-blue-600" /> Email Subject
              </label>
              <input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="e.g. New iPhone 15 Wholesale Prices" 
                className="w-full bg-gray-50 border border-gray-100 rounded md:rounded-xl px-5 py-4 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-all" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
                  <FiImage className="text-blue-600" /> Promotional Image
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowImageInput(!showImageInput)} 
                  className={`text-[9px] font-black uppercase px-3 py-1 rounded-md transition-all ${showImageInput ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                >
                  {showImageInput ? "Remove" : "Add Link"}
                </button>
              </div>
              <AnimatePresence>
                {showImageInput && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="overflow-hidden space-y-4"
                  >
                    <div className="flex items-center bg-blue-50 border border-blue-100 rounded md:rounded-xl px-4 py-3 gap-3">
                      <FiLink className="text-blue-600" />
                      <input 
                        value={imageUrl} 
                        onChange={(e) => setImageUrl(e.target.value)} 
                        placeholder="Paste image URL here" 
                        className="w-full bg-transparent text-xs font-bold outline-none" 
                      />
                    </div>
                    {imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50 p-2">
                        <img src={imageUrl} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2">
                <FiMail className="text-blue-600" /> Message Body
              </label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Write your store update here..." 
                className="w-full bg-gray-50 border border-gray-100 rounded md:rounded-xl px-5 py-4 text-sm font-bold focus:border-blue-600 focus:bg-white outline-none min-h-[200px] transition-all" 
              />
            </div>

            <button 
              disabled={loading} 
              className="w-full bg-[#0B2A4A] hover:bg-blue-600 text-white py-5 rounded-lg md:rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? "COMMENCING DISPATCH..." : <><FiSend /> Fire Broadcast</>}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default NewsletterBroadcastUi;