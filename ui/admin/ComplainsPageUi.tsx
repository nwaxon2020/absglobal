"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  deleteDoc,
  arrayUnion,
  Timestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMessageSquare, FiPhone, FiMail, 
  FiSend, FiCheckCircle, FiClock, FiTrash2, FiCornerDownRight, FiAlertCircle, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface Reply {
  text: string;
  timestamp: Timestamp;
  sender: 'admin' | 'user';
  senderName: string;
}

interface Complaint {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  replies?: Reply[];
  status?: string;
  userId?: string;
  createdAt?: any;
}

const AdminComplaintsUi = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Get admin UID from environment variable
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_KEY;
  
  // Check if current user is CEO/Admin
  const isCEO = auth.currentUser?.uid === ADMIN_UID;

  // Real-time fetch of all complaints
  useEffect(() => {
    if (!isCEO) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, "complains"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [isCEO]);

  const handleSendReply = async (id: string) => {
    if (!replyText[id]) return toast.error("Please type a response");
    
    setLoadingId(id);
    try {
      const complaint = complaints.find(c => c.id === id);
      const reply: Reply = {
        text: replyText[id],
        timestamp: Timestamp.now(),
        sender: 'admin',
        senderName: 'Admin'
      };

      await updateDoc(doc(db, "complains", id), {
        replies: arrayUnion(reply),
        status: 'active' // Change status to active when there's a conversation
      });
      
      toast.success("Reply sent to user");
      setReplyText(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error("Reply error:", error);
      toast.error("Failed to send reply");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteComplaint = async () => {
    if (!deleteId) return;
    
    try {
      await deleteDoc(doc(db, "complains", deleteId));
      toast.success("Complaint deleted");
      setDeleteId(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete complaint");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0B2A4A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#0B2A4A] font-black uppercase tracking-widest text-xs">Loading Complaints...</p>
        </div>
      </div>
    );
  }

  // Check authentication and admin status
  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <p className="text-[#0B2A4A] font-black uppercase tracking-widest italic mb-4">Not Authenticated</p>
          <p className="text-gray-500 text-xs">Please sign in to access admin panel</p>
        </div>
      </div>
    );
  }

  if (!isCEO) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <p className="text-red-600 font-black uppercase tracking-widest italic text-xl mb-4">Access Denied</p>
          <p className="text-[#0B2A4A] text-xs font-bold">Your UID: {auth.currentUser?.uid}</p>
          <p className="text-gray-500 text-xs mt-2">This area is restricted to CEO only</p>
        </div>
      </div>
    );
  }

  const hasUnreadReplies = (complaint: Complaint) => {
    const lastReply = complaint.replies?.[complaint.replies.length - 1];
    return lastReply?.sender === 'user';
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-10 pb-20 px-4 md:p-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Deletion Confirmation Overlay */}
        <AnimatePresence>
          {deleteId && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#0B2A4A]/60 backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
              >
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle size={32} />
                </div>
                <h2 className="text-[#0B2A4A] font-black uppercase italic text-lg mb-2 tracking-tighter">Confirm Deletion</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                  Are you sure you want to permanently remove this complaint? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-[#0B2A4A] font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteComplaint}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 md:mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
              Complaints <span className="text-blue-600">Management</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">
              Admin Control Center / {complaints.length} Tickets
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[9px] font-black text-[#0B2A4A] uppercase">
                {complaints.filter(c => hasUnreadReplies(c)).length} Unread
              </span>
            </div>

              <Link href='/admin' className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 flex items-center gap-2">
                <FiUser size={18} className="text-[#0B2A4A]" />
                <span  className="text-[9px] font-black text-[#0B2A4A] uppercase">
                  Dashboard
                </span>
              </Link>
          </div>
        </div>

        {/* Complaints Grid */}
        {complaints.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <FiMessageSquare className="mx-auto text-gray-300 text-5xl mb-4" />
            <p className="text-[#0B2A4A] font-black uppercase text-sm mb-2">No Complaints Found</p>
            <p className="text-gray-400 text-[10px] font-bold">The complaints collection is empty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {complaints.map((c) => (
                <motion.div 
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`bg-white rounded-xl shadow-lg hover:shadow-xl border overflow-hidden flex flex-col relative transition-shadow ${
                    hasUnreadReplies(c) ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'
                  }`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => setDeleteId(c.id)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full"
                    title="Delete complaint"
                  >
                    <FiTrash2 size={14} />
                  </button>

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="absolute top-3 left-3 text-gray-400 hover:text-blue-600 transition-colors z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full text-[8px] font-black"
                  >
                    {expandedId === c.id ? '−' : '+'}
                  </button>

                  {/* Status Bar */}
                  <div className={`h-1 w-full ${
                    hasUnreadReplies(c) ? 'bg-red-500' : 
                    c.replies?.length ? 'bg-green-500' : 'bg-yellow-400'
                  }`} />
                  
                  <div className="p-4 md:p-5 flex-1">
                    <div className="flex justify-between items-start mb-4 pl-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0B2A4A] text-yellow-400 flex items-center justify-center font-black text-xs md:text-sm">
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase text-[#0B2A4A] leading-none line-clamp-1">
                            {c.name || 'Unknown'}
                          </h3>
                          <p className="text-[8px] text-gray-400 font-bold mt-0.5">ID: {c.id?.slice(0, 6)}</p>
                        </div>
                      </div>
                      {c.replies?.length ? 
                        <FiCheckCircle className="text-green-500 flex-shrink-0" size={16} /> : 
                        <FiClock className="text-yellow-500 animate-spin-slow flex-shrink-0" size={16} />
                      }
                    </div>

                    <div className="flex gap-2 mb-3">
                      <a 
                        href={`mailto:${c.email}`} 
                        className="flex-1 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg flex items-center justify-center gap-1 text-blue-600 transition-all"
                        title={c.email}
                      >
                        <FiMail size={12} /> 
                        <span className="text-[7px] md:text-[9px] font-black uppercase hidden xs:inline">Email</span>
                      </a>
                      <a 
                        href={`tel:${c.phone}`} 
                        className="flex-1 bg-green-50 hover:bg-green-100 p-2 rounded-lg flex items-center justify-center gap-1 text-green-600 transition-all"
                        title={c.phone}
                      >
                        <FiPhone size={12} /> 
                        <span className="text-[7px] md:text-[9px] font-black uppercase hidden xs:inline">Call</span>
                      </a>
                    </div>

                    <div className="space-y-2">
                      {/* Original Message */}
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <p className="text-[7px] font-black text-gray-400 uppercase mb-1.5">Original Message:</p>
                        <p className="text-xs md:text-[11px] text-[#0B2A4A] font-medium leading-relaxed italic">
                          "{c.message}"
                        </p>
                      </div>

                      {/* Conversation Thread */}
                      {c.replies && c.replies.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto p-1">
                          <p className="text-[7px] font-black text-gray-400 uppercase sticky top-0 bg-white py-1">
                            Conversation ({c.replies.length})
                          </p>
                          {c.replies.map((reply, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: reply.sender === 'admin' ? 10 : -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={`p-2 rounded-lg ${
                                reply.sender === 'admin' 
                                  ? 'bg-blue-50 ml-4 border-l-4 border-blue-600' 
                                  : 'bg-green-50 mr-4 border-r-4 border-green-600'
                              }`}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <FiUser size={8} className={reply.sender === 'admin' ? 'text-blue-600' : 'text-green-600'} />
                                <p className={`text-[6px] font-black uppercase ${
                                  reply.sender === 'admin' ? 'text-blue-600' : 'text-green-600'
                                }`}>
                                  {reply.sender === 'admin' ? 'Admin' : c.name}
                                </p>
                                <span className="text-[7px] text-gray-500 ml-auto">
                                  {reply.timestamp?.toDate?.()?.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-xs text-[#0B2A4A]">{reply.text}</p>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Expandable Area for More Details */}
                      {expandedId === c.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-gray-100 pt-3 mt-2"
                        >
                          <p className="text-[7px] text-gray-400">
                            <span className="font-black">User ID:</span> {c.userId}
                          </p>
                          <p className="text-[7px] text-gray-400">
                            <span className="font-black">Created:</span> {c.createdAt?.toDate?.()?.toLocaleString()}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Reply Input - Always visible for ongoing conversation */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    <textarea 
                      value={replyText[c.id] || ''}
                      onChange={(e) => setReplyText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                      placeholder={hasUnreadReplies(c) ? "Reply to user's response..." : "Type admin reply..."}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-[10px] md:text-[11px] focus:outline-none focus:border-blue-600 h-10  mb-2.5"
                      maxLength={500}
                    />
                    <button 
                      onClick={() => handleSendReply(c.id)}
                      disabled={loadingId === c.id || !replyText[c.id]}
                      className="w-full bg-[#0B2A4A] text-white py-2 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                    >
                      {loadingId === c.id ? "..." : <><FiSend size={12} /> Send Reply</>}
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintsUi;