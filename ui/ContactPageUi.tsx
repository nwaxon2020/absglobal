"use client";

import React, { useState, useEffect } from 'react';
import { db, auth, googleProvider } from '@/lib/firebase';
import { 
  collection, addDoc, query, where, onSnapshot, 
  serverTimestamp, updateDoc, doc, increment, arrayUnion, Timestamp, 
} from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare, 
  FiUser, FiClock, FiCheckCircle, FiLock, FiStar, FiTrash2, FiAlertCircle 
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Define types
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
  isDeleted?: boolean;  // Added for soft delete
  deletedAt?: any;      // Added for audit
  deletedBy?: string;   // Added for audit
}

const ContactPageUi = () => {
  const [view, setView] = useState<'send' | 'replies'>('send');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [userMessages, setUserMessages] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        setFormData(prev => ({ 
          ...prev, 
          email: currentUser.email || '', 
          name: currentUser.displayName || '' 
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for user's messages with conversation threads - FIXED to preserve all data
  useEffect(() => {
    if (!user?.uid) {
      console.log("No authenticated user, skipping fetch");
      return;
    }

    console.log("Fetching complaints for userId:", user.uid);
    
    const q = query(
      collection(db, "complains"), 
      where("userId", "==", user.uid)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        // Get ALL messages first
        const allMessages = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Complaint));
        
        // Log for debugging
        console.log("All messages before filter:", allMessages.length);
        
        // Filter out soft-deleted tickets for display
        const messages = allMessages.filter(msg => !msg.isDeleted);
        
        console.log("Messages after filter:", messages.length);
        
        // Sort manually to show latest first
        messages.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        
        setUserMessages(messages);
        
        // Check for UNSEEN admin replies
        const hasUnseenAdminMessages = messages.some((msg: Complaint) => {
          if (!msg.replies) return false;
          
          const viewedKey = `viewed_${user.uid}_${msg.id}`;
          const lastViewed = localStorage.getItem(viewedKey);
          const lastViewedTime = lastViewed ? parseInt(lastViewed) : 0;
          
          return msg.replies.some(reply => 
            reply.sender === 'admin' && 
            reply.timestamp?.toDate?.().getTime() > lastViewedTime
          );
        });
        
        if (hasUnseenAdminMessages && view !== 'replies') {
          toast.custom((t) => (
            <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
              <FiStar className="text-yellow-400 animate-pulse" />
              <div>
                <p className="text-[10px] font-black uppercase">New Admin Response</p>
                <p className="text-[8px] opacity-80">Click on My Tickets to view</p>
              </div>
            </div>
          ), { 
            duration: 4000,
            id: 'admin-response-toast'
          });
        }
      }, 
      (error) => {
        console.error("Error fetching messages:", error);
        
        if (error.code !== 'permission-denied' || userMessages.length > 0) {
          toast.error("Failed to load messages");
        }
      }
    );
    
    return () => unsubscribe();
  }, [user?.uid, view]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Authenticated Successfully");
    } catch (error) {
      toast.error("Authentication failed");
    }
  };

  // 2. Update handleSubmit (User creating a new ticket)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in first");
    setLoading(true);
    try {
      await addDoc(collection(db, "complains"), {
        ...formData,
        userId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // PUSH NOTIFICATION TO ADMIN HUB
      await updateDoc(doc(db, "admin_metadata", "counters"), {
        unreadComplaints: increment(1)
      });

      toast.success("Message logged!");
      setFormData(prev => ({ ...prev, message: '' }));
    } catch (error) {
      toast.error("Failed to send.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Update handleSendReply (User replying to an admin)
  const handleSendReply = async (complaintId: string) => {
    if (!replyText[complaintId]) return;
    setLoadingId(complaintId);
    try {
      await updateDoc(doc(db, "complains", complaintId), {
        replies: arrayUnion({
          text: replyText[complaintId],
          timestamp: Timestamp.now(),
          sender: 'user'
        }),
        status: 'active'
      });

      // PUSH NOTIFICATION TO ADMIN HUB
      await updateDoc(doc(db, "admin_metadata", "counters"), {
        unreadComplaints: increment(1)
      });
      
      setReplyText(prev => ({ ...prev, [complaintId]: '' }));
    } catch (error) {
      toast.error("Reply failed");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteReply = async (complaintId: string, replyIndex: number) => {
    try {
      const complaint = userMessages.find(c => c.id === complaintId);
      if (!complaint || !complaint.replies) return;

      const updatedReplies = complaint.replies.filter((_, index) => index !== replyIndex);
      
      await updateDoc(doc(db, "complains", complaintId), {
        replies: updatedReplies
      });
      
      toast.success("Reply deleted");
    } catch (error: any) {
      console.error("Delete reply error:", error);
      if (error.code === 'permission-denied') {
        toast.error("You can only delete your own replies");
      } else {
        toast.error("Failed to delete reply");
      }
    }
  };

  // Soft delete function
  const handleSoftDeleteTicket = async () => {
    if (!deleteId || !user) return;
    
    try {
      await updateDoc(doc(db, "complains", deleteId), {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        deletedBy: user.uid,
        deletedByEmail: user.email
      });
      
      toast.success("Ticket moved to trash");
      setDeleteId(null);
    } catch (error: any) {
      console.error("Soft delete error:", error);
      if (error.code === 'permission-denied') {
        toast.error("You don't have permission to delete this ticket");
      } else {
        toast.error("Failed to delete ticket");
      }
    }
  };

  const markAsViewed = (ticketId: string) => {
    if (!user?.uid) return;
    const viewedKey = `viewed_${user.uid}_${ticketId}`;
    localStorage.setItem(viewedKey, Date.now().toString());
  };

  const hasNewAdminReply = (complaint: Complaint) => {
    if (!complaint.replies || !user?.uid) return false;
    
    const lastAdminReply = [...complaint.replies]
      .filter(r => r.sender === 'admin')
      .pop();
      
    if (!lastAdminReply) return false;
    
    const viewedKey = `viewed_${user.uid}_${complaint.id}`;
    const lastViewed = localStorage.getItem(viewedKey);
    
    return !lastViewed || lastAdminReply.timestamp.toDate().getTime() > parseInt(lastViewed);
  };

  const unreadRepliesCount = userMessages.filter(msg => 
    hasNewAdminReply(msg)
  ).length;

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-28 pb-20 px-3 md:px-6">
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
                <h2 className="text-[#0B2A4A] font-black uppercase italic text-lg mb-2 tracking-tighter">Delete Ticket</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-6">
                  Are you sure you want to delete this ticket? It will be moved to trash and hidden from your view.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteId(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-[#0B2A4A] font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSoftDeleteTicket}
                    className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="text-center mb-6 md:mb-14">
          <h1 className="text-2xl md:text-6xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
            Contact <span className="text-blue-600">Support</span>
          </h1>
          <p className="text-gray-500 mt-2 md:mt-4 text-[10px] font-bold uppercase tracking-[0.3em]">
            Direct Channel to ABST Global Administration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Right: The Dynamic Input Card */}
          <div className="hidden md:block space-y-8">
            <div className="bg-[#0B2A4A] px-10 py-25 rounded-xl shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FiMessageSquare size={150} />
              </div>
              <h2 className="text-xl font-black uppercase italic mb-8 border-b border-white/10 pb-4">
                Corporate <span className="text-yellow-400">Information</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Email Us</p>
                    <p className="text-sm font-bold">ceo@abstglobal.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Call Center</p>
                    <p className="text-sm font-bold">+234 (0) 800 ABST GLOBAL</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Headquarters</p>
                    <p className="text-sm font-bold uppercase">Abuja, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-blue-600/5 rounded-md md:rounded-xl border-2 border-dashed border-blue-600/20">
              <p className="text-[#0B2A4A] text-xs font-bold leading-relaxed italic">
                "Our customer satisfaction rate is our highest priority. Every message in the complaints 
                collection is personally reviewed by our management team."
              </p>
            </div>
          </div>
          
          {/* Mobile view: Contact Details */}
          <div className="bg-white px-2 py-8 md:p-12 rounded-md md:rounded-xl shadow-xl border border-gray-100 min-h-[500px]">
            
            {/* View Toggle Button with Unread Badge */}
            <div className="flex justify-center mb-8">
              <div className="bg-[#0B2A4A] p-1 rounded-md md:rounded-xl flex gap-1 relative">
                <button 
                  onClick={() => setView('send')}
                  className={`px-4 py-2 rounded-md md:rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${view === 'send' ? 'bg-yellow-400 text-[#0B2A4A]' : 'text-white/40'}`}
                >
                  Contact Form
                </button>
                <button 
                  onClick={() => {
                    setView('replies');
                    userMessages.forEach((msg) => {
                      markAsViewed(msg.id);
                    });
                  }}
                  className={`px-4 py-2 rounded-md md:rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1 ${view === 'replies' ? 'bg-yellow-400 text-[#0B2A4A]' : 'text-white/40'}`}
                >
                  My Tickets
                  {unreadRepliesCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[7px] font-black animate-pulse">
                      {unreadRepliesCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {view === 'send' ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="text-center mb-6">
                    {userMessages.length > 0 ? (
                      <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md md:rounded-full inline-flex items-center gap-2">
                        <FiClock /> Existing tickets in "My Tickets"
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-green-600 bg-green-50 px-3 py-1.5 rounded-md md:rounded-full inline-flex items-center gap-2">
                        <FiCheckCircle /> Create a new support ticket
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="px-4 md:px-0 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><FiUser /> Name</label>
                        <input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" className="w-full bg-gray-50 border border-gray-200 rounded-md md:rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-600 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><FiPhone /> Phone</label>
                        <input required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+234..." className="w-full bg-gray-50 border border-gray-200 rounded-md md:rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-600 outline-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><FiMail /> Verification</label>
                      {!user ? (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md md:rounded-xl px-4 py-2">
                           <p className="text-[9px] font-bold text-blue-600 flex items-center gap-2">
                             <FiLock /> Authentication Required
                           </p>
                           <button 
                            type="button" 
                            onClick={handleSignIn}
                            className="bg-[#0B2A4A] text-white text-[8px] font-black px-3 py-1.5 rounded-md hover:bg-blue-700 transition-all uppercase"
                           >
                             Sign In Now
                           </button>
                        </div>
                      ) : (
                        <input value={formData.email} disabled className="w-full bg-gray-100 border border-gray-200 rounded-md md:rounded-xl px-4 py-3 text-xs font-bold text-gray-400" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 flex items-center gap-1"><FiMessageSquare /> Message</label>
                      <textarea required value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="How can we help?" className="w-full bg-gray-50 border border-gray-200 rounded-md md:rounded-xl px-4 py-3 text-xs font-bold focus:border-blue-600 outline-none h-28" />
                    </div>

                    <button disabled={loading || !user} className="w-full bg-[#0B2A4A] text-white py-4 rounded-md md:rounded-xl font-black uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 hover:bg-blue-600 shadow-lg disabled:opacity-40">
                      {loading ? "SENDING..." : !user ? "SIGN IN TO CREATE TICKET" : <><FiSend /> Create Ticket</>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div key="replies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {!user ? (
                    <div className="text-center py-20 bg-gray-50 rounded-md md:rounded-xl border border-dashed border-gray-200">
                      <FiLock className="mx-auto text-gray-300 text-4xl mb-3" />
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest">Sign in to view your tickets</p>
                      <button onClick={handleSignIn} className="bg-[#0B2A4A] text-white px-6 py-2 rounded-md md:rounded-lg text-[9px] font-black">SIGN IN</button>
                    </div>
                  ) : userMessages.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-md md:rounded-xl">
                      <FiMessageSquare className="mx-auto text-gray-200 text-4xl mb-3" />
                      <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest">No tickets yet</p>
                      <p className="text-[8px] text-gray-300 mt-2">Create your first support ticket</p>
                    </div>
                  ) : (
                    userMessages.map((ticket: Complaint) => (
                      <motion.div 
                        key={ticket.id} 
                        className={`bg-white md:rounded-xl px-3 py-5 md:p-5 border shadow-sm transition-all ${
                          hasNewAdminReply(ticket) ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-100'
                        }`}
                        onClick={() => markAsViewed(ticket.id)}
                      >
                        {/* Ticket Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase bg-[#0B2A4A] text-white px-2 py-1 rounded">
                              Ticket #{ticket.id.slice(0,5)}
                            </span>
                            {hasNewAdminReply(ticket) && (
                              <span className="flex items-center gap-1 text-red-500 animate-pulse">
                                <FiStar className="text-red-500 fill-red-500" size={12} />
                                <span className="text-[7px] font-black uppercase">New Admin Response</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(ticket.id);
                              }}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete ticket"
                            >
                              <FiTrash2 size={14} />
                            </button>
                            <span className={`text-[8px] font-black uppercase ${
                              ticket.status === 'resolved' ? 'text-green-600' : 
                              ticket.replies?.length ? 'text-blue-600' : 'text-yellow-600'
                            }`}>
                              {ticket.status === 'resolved' ? 'Resolved' : 
                               ticket.replies?.length ? 'In Progress' : 'Pending'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-md md:rounded-lg mb-4">
                          <p className="text-[7px] font-black text-gray-400 uppercase mb-1.5">Your Message:</p>
                          <p className="text-[10px] text-gray-600 leading-relaxed">
                            "{ticket.message}"
                          </p>
                        </div>
                        
                        {ticket.replies && ticket.replies.length > 0 && (
                          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto p-2">
                            <p className="text-[7px] font-black text-gray-400 uppercase sticky top-0 bg-white py-1">
                              Conversation ({ticket.replies.length})
                            </p>
                            {ticket.replies.map((reply, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: reply.sender === 'user' ? 10 : -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`relative p-3 rounded-md md:rounded-lg ${
                                  reply.sender === 'admin' 
                                    ? 'bg-blue-50 ml-4 border-l-4 border-blue-600' 
                                    : 'bg-green-50 mr-4 border-r-4 border-green-600'
                                }`}
                              >
                                {reply.sender === 'user' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteReply(ticket.id, index);
                                    }}
                                    className="absolute top-1 right-1 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete this reply"
                                  >
                                    <FiTrash2 size={10} />
                                  </button>
                                )}
                                <div className="flex items-center gap-1 mb-1">
                                  <FiUser size={10} className={reply.sender === 'admin' ? 'text-blue-600' : 'text-green-600'} />
                                  <p className={`text-[8px] font-black uppercase ${
                                    reply.sender === 'admin' ? 'text-blue-600' : 'text-green-600'
                                  }`}>
                                    {reply.sender === 'admin' ? 'Support Team' : 'You'}
                                  </p>
                                  <span className="text-[6px] text-gray-400 ml-auto">
                                    {reply.timestamp?.toDate?.()?.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-xs text-[#0B2A4A]">{reply.text}</p>
                              </motion.div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <textarea 
                            value={replyText[ticket.id] || ''}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                            placeholder={ticket.replies?.length ? "Add your response..." : "Reply to this ticket..."}
                            className="w-full bg-gray-50 border border-gray-200 rounded-md md:rounded-lg p-2.5 text-[10px] focus:outline-none focus:border-blue-600 h-16 mb-2"
                            maxLength={500}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex justify-end">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendReply(ticket.id);
                              }}
                              disabled={loadingId === ticket.id || !replyText[ticket.id]}
                              className="bg-[#0B2A4A] text-white px-4 py-2 rounded-md md:rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-700 flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {loadingId === ticket.id ? "SENDING..." : <><FiSend size={10} /> Send Reply</>}
                            </button>
                          </div>
                        </div>

                        {ticket.createdAt?.toDate && (
                          <p className="text-[6px] text-gray-400 mt-3 text-right">
                            Created: {new Date(ticket.createdAt.toDate()).toLocaleString()}
                          </p>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="md:hidden space-y-8">
            <div className="bg-[#0B2A4A] p-10 rounded-md md:rounded-xl shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <FiMessageSquare size={150} />
              </div>
              <h2 className="text-xl font-black uppercase italic mb-8 border-b border-white/10 pb-4">
                Corporate <span className="text-yellow-400">Information</span>
              </h2>
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiMail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Email Us</p>
                    <p className="text-sm font-bold">ceo@abstglobal.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiPhone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Call Center</p>
                    <p className="text-sm font-bold">+234 (0) 800 ABST GLOBAL</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="p-3 bg-white/5 rounded-lg text-yellow-400 group-hover:bg-yellow-400 group-hover:text-[#0B2A4A] transition-all">
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Headquarters</p>
                    <p className="text-sm font-bold uppercase">Abuja, Nigeria</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-blue-600/5 rounded-md md:rounded-xl border-2 border-dashed border-blue-600/20">
              <p className="text-[#0B2A4A] text-xs font-bold leading-relaxed italic">
                "Our customer satisfaction rate is our highest priority. Every message in the complaints 
                collection is personally reviewed by our management team."
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ContactPageUi;