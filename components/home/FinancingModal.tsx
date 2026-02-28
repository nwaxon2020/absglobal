"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiChevronDown, FiSmartphone, FiLoader, FiMonitor, 
  FiClock, FiPackage, FiAlertCircle, FiLock, FiTruck, FiCreditCard, FiStar, FiRefreshCw, FiCalendar, FiTrash2
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { 
  collection, onSnapshot, query, where, addDoc, 
  serverTimestamp, getDoc, doc, updateDoc, increment, deleteDoc, orderBy 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const FinancingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [months, setMonths] = useState(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interestRate, setInterestRate] = useState(5);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [trustStars, setTrustStars] = useState(0); 
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null); 
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '' });

  const REJECT_COOLDOWN_DAYS = 5;
  const CANCEL_COOLDOWN_DAYS = 3;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setFormData(prev => ({ ...prev, fullName: currentUser.displayName || '' }));
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch permanent trust stars based on email - SYNCED WITH ADMIN HUB
  useEffect(() => {
    if (!user?.email) {
      setTrustStars(0);
      return;
    }
    const unsubStars = onSnapshot(doc(db, "global_trust", user.email.toLowerCase().trim()), 
      (snap) => {
        if (snap.exists()) {
          const count = snap.data().count || 0;
          setTrustStars(Math.min(count, 5));
        } else {
          setTrustStars(0);
        }
      },
      (error) => {
        // Tweak: Handle potential permission errors silently
        console.error("Trust lookup restricted:", error);
        setTrustStars(0);
      }
    );
    return () => unsubStars();
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchGlobalData = async () => {
      setLoading(true);
      try {
        const settingsDoc = await getDoc(doc(db, "admin_settings", "financing"));
        let allowedCats = ["phone", "laptop"]; 
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setInterestRate(data.globalInterest || 5);
          if (Array.isArray(data.allowedCategories)) allowedCats = data.allowedCategories;
        }
        const q = query(collection(db, "products"), where("category", "in", allowedCats));
        onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInventory(docs);
          if (docs.length > 0) setSelectedProduct(docs[0]);
          setLoading(false);
        });
      } catch (error) { setLoading(false); }
    };
    fetchGlobalData();
  }, [isOpen]);

  useEffect(() => {
    if (!user?.uid) return;
    const qActive = query(collection(db, "financing_requests"), where("userId", "==", user.uid));
    const unsubActive = onSnapshot(qActive, (snap) => {
      setActiveRequest(!snap.empty ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null);
    });
    const qHistory = query(collection(db, "financing_requests"), where("userId", "==", "archived_" + user.uid));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubActive(); unsubHistory(); };
  }, [user]);

  const getPenaltyData = () => {
    if (!activeRequest || !activeRequest.createdAt) return { penalty: 0, monthsPassed: 0 };
    const start = activeRequest.createdAt.toDate();
    const now = new Date();
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const monthsPassed = Math.max(0, diff);
    const balance = (activeRequest.totalWithInterest || 0) - (activeRequest.amountPaid || 0);
    const penalty = monthsPassed > 0 ? (balance * (0.005 * monthsPassed)) : 0;
    return { penalty, monthsPassed };
  };

  const { penalty, monthsPassed } = getPenaltyData();

  const getCooldownDays = (timestamp: any, limit: number) => {
    if (!timestamp) return 0;
    const diffDays = Math.ceil((new Date().getTime() - timestamp.toDate().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, limit - diffDays);
  };

  const getLatestCancelCooldown = () => {
    const cancelledItems = history.filter(item => item.status === 'cancelled' && item.cancelledAt);
    if (cancelledItems.length === 0) return null;
    const latest = cancelledItems.reduce((prev: any, current: any) => 
      (prev.cancelledAt.toMillis() > current.cancelledAt.toMillis()) ? prev : current
    );
    const daysLeft = getCooldownDays(latest.cancelledAt, CANCEL_COOLDOWN_DAYS);
    return daysLeft > 0 ? daysLeft : null;
  };

  const cancelCooldownRemaining = getLatestCancelCooldown();
  const getPrice = (product: any) => product?.variants?.[0]?.price || 0;
  const currentPrice = selectedProduct ? getPrice(selectedProduct) : 0;
  const liveTotalWithInterest = currentPrice * (1 + interestRate / 100);
  const displayTotal = activeRequest ? activeRequest.totalWithInterest : liveTotalWithInterest;
  const displayMonths = activeRequest ? activeRequest.months : months;
  const refundAmount = activeRequest ? (activeRequest.amountPaid * 0.85) : 0;

  const logTestPayment = async () => {
    if (!activeRequest) return;
    const amt = prompt("Enter Test Payment (₦):");
    if (!amt || isNaN(Number(amt))) return;
    try {
      await updateDoc(doc(db, "financing_requests", activeRequest.id), {
        amountPaid: increment(Number(amt)),
        lastPaymentAt: serverTimestamp()
      });
      toast.success("Payment Received!");
    } catch (e) { toast.error("Payment failed"); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cancelCooldownRemaining) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "financing_requests"), {
        ...formData,
        email: user.email.toLowerCase().trim(), 
        userId: user.uid,
        productName: selectedProduct.name,
        productId: selectedProduct.id,
        productCategory: selectedProduct.category,
        totalAmount: currentPrice,
        totalWithInterest: liveTotalWithInterest,
        interestRate,
        months,
        amountPaid: 0,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success("Request Submitted");
    } catch (error) { toast.error("Error"); } 
    finally { setSubmitting(false); }
  };

  const handleFinalCancel = async () => {
    if (!activeRequest) return;
    const hasPaid = (activeRequest.amountPaid || 0) > 0;
    setShowCancelConfirm(false); 
    try {
      if (!hasPaid) {
        await deleteDoc(doc(db, "financing_requests", activeRequest.id));
        toast.success("Deleted");
      } else {
        await updateDoc(doc(db, "financing_requests", activeRequest.id), {
          status: 'cancelled',
          refundAmount,
          cancelledAt: serverTimestamp(),
          userId: "archived_" + user.uid 
        });
        toast.success("Cancelled & Archived");
      }
    } catch (err) { toast.error("Failed"); }
  };

  const clearCompletedOrder = async () => {
    if (!activeRequest) return;
    try {
      await updateDoc(doc(db, "financing_requests", activeRequest.id), {
        userId: "archived_" + user.uid,
        archivedAt: serverTimestamp()
      });
      toast.success("Ready for your next purchase!");
    } catch (err) { toast.error("Error clearing record"); }
  };

  const handleHistoryDelete = async () => {
    if (!historyToDelete) return;
    try {
      await deleteDoc(doc(db, "financing_requests", historyToDelete));
      toast.success("Permanently removed");
    } catch (e) { toast.error("Action failed"); }
    finally { setHistoryToDelete(null); }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-2 py-4 md:px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white rounded-lg w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[98vh] text-left text-black">
          
          <AnimatePresence>
            {(showCancelConfirm || historyToDelete) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-white/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="max-w-xs text-center">
                  <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
                  <h3 className="text-sm font-black uppercase mb-2">Confirm Action</h3>
                  <div className="text-[11px] font-bold text-slate-600 uppercase mb-8 leading-relaxed">
                    {historyToDelete ? (
                        <p>This record will be <span className="text-red-600 font-black underline">permanently deleted</span>. This cannot be undone.</p>
                    ) : (activeRequest?.amountPaid || 0) > 0 ? (
                      <p><span className='font-black text-red-500'>Note:</span> 15% Service charge applies. <span className='font-black text-black text-xs'>Refund: ₦{refundAmount.toLocaleString()}</span>. A 3-day cooldown will apply.</p>
                    ) : <p>Withdraw your application? Proceed?</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setShowCancelConfirm(false); setHistoryToDelete(null); }} className="flex-1 py-4 bg-slate-100 rounded-lg text-[10px] font-black uppercase text-slate-500">Back</button>
                    <button onClick={historyToDelete ? handleHistoryDelete : handleFinalCancel} className="flex-1 py-4 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase shadow-lg text-center">Confirm</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading || authLoading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center">
               <FiLoader className="animate-spin text-amber-500 mb-2" size={40} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Syncing...</p>
            </div>
          ) : (
            <>
              <div className="bg-[#1A1A1A] text-white p-5 md:p-8 md:w-5/12 flex flex-col justify-between shrink-0">
                <div className="overflow-y-auto custom-scrollbar">
                  <h3 className="text-xl font-bold italic uppercase tracking-tighter text-left mb-6">Plan Summary</h3>
                  
                  {/* Tweak: STAR COLORS - GOLD FOR 5, GREEN FOR OTHERS */}
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FiStar 
                        key={i} 
                        size={14} 
                        fill={i < trustStars ? (trustStars === 5 ? "#FFD700" : "#22C55E") : "transparent"} 
                        color={i < trustStars ? (trustStars === 5 ? "#FFD700" : "#22C55E") : "#333"} 
                        className={trustStars === 5 ? "drop-shadow-[0_0_3px_rgba(255,215,0,0.5)]" : ""}
                      />
                    ))}
                  </div>

                  {selectedProduct && !activeRequest && (
                    <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10 flex items-center space-x-4">
                      <div className="relative w-16 h-16 bg-white rounded-md p-1 flex-shrink-0">
                        <img src={getPrice(selectedProduct) ? selectedProduct.variants[0].images[0].url : ''} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left text-white">
                        <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">{selectedProduct.category}</p>
                        <p className="text-sm font-semibold truncate w-32 uppercase leading-tight">{selectedProduct.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-around gap-4 md:flex-col space-y-4 md:space-y-6 text-left">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Total</p>
                      <p className="text-lg md:text-2xl font-bold italic">₦{displayTotal.toLocaleString()}</p>
                      {penalty > 0 && <p className="text-red-500 text-[9px] font-black uppercase mt-1">+ ₦{penalty.toLocaleString()} Penalty ({monthsPassed}m)</p>}
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Monthly</p>
                      <p className="text-xl md:text-3xl font-bold text-amber-500">₦{(displayTotal / displayMonths).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-5 px-3 md:p-6 md:w-7/12 overflow-y-auto relative flex flex-col text-left">
                <div className="flex justify-between items-center mb-4 text-left text-black">
                  <h3 className="text-xl font-black uppercase italic">Financing Portal</h3>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-black"><FiX /></button>
                </div>

                {!user ? (
                   <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
                     <FiLock size={40} className="text-amber-500" />
                     <h2 className="text-2xl font-black uppercase italic tracking-tighter">Sign In Required</h2>
                     <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="flex items-center gap-3 bg-white border-2 border-slate-100 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl text-black"><FcGoogle size={20} /> Continue with Google</button>
                   </div>
                ) : activeRequest ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
                    {activeRequest.status === 'pending' && (
                      <div className="flex flex-col items-center">
                        <FiClock className="text-amber-500 animate-pulse mb-6" size={64} />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black">Under Review</h2>
                        <button onClick={() => setShowCancelConfirm(true)} className="mt-10 text-red-500 text-[9px] font-black uppercase underline tracking-widest">Withdraw Application</button>
                      </div>
                    )}
                    {activeRequest.status === 'approved' && (
                      <div className="w-full space-y-6">
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-left">
                          <h4 className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-4 italic">Live Progress</h4>
                          <div className="flex justify-between text-[11px] font-black mb-2 uppercase text-black">
                            <span>Paid: ₦{(activeRequest.amountPaid || 0).toLocaleString()}</span>
                            <span>Remaining: ₦{((activeRequest.totalWithInterest - activeRequest.amountPaid) + penalty).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${((activeRequest.amountPaid || 0) / activeRequest.totalWithInterest) * 100}%` }} />
                          </div>
                        </div>
                        <button onClick={logTestPayment} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl flex items-center justify-center gap-2"><FiCreditCard size={18} /> Simulate Test Payment</button>
                        <button onClick={() => setShowCancelConfirm(true)} className="text-red-500 text-[10px] font-black uppercase italic underline block mx-auto tracking-widest">Cancel Purchase</button>
                      </div>
                    )}
                    {activeRequest.status === 'rejected' && (
                      <div className="flex flex-col items-center">
                        <FiAlertCircle className="text-red-500 mb-4" size={64} />
                        <h2 className="text-2xl font-black uppercase text-red-600 italic tracking-tighter">Rejected</h2>
                        <div className="bg-red-50 p-6 rounded-2xl mt-4 border border-red-100">
                          <p className="text-[10px] font-black text-red-400 uppercase mb-1">Cooldown Active</p>
                          <p className="text-2xl font-black text-red-600 italic tracking-tighter">{getCooldownDays(activeRequest.rejectedAt, REJECT_COOLDOWN_DAYS)} Days Left</p>
                        </div>
                      </div>
                    )}
                    {activeRequest.status === 'delivered' && (
                       <div className="flex flex-col items-center">
                         <FiPackage className="text-green-500 mb-6" size={64} />
                         <h2 className="text-2xl font-black uppercase text-green-600 italic tracking-tighter">Order Delivered!</h2>
                         <div className="mt-4 py-4 px-8 bg-green-600 text-white rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg mb-6"><FiTruck /> Dispatched</div>
                         <button onClick={clearCompletedOrder} className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest border-b-2 border-blue-600 pb-1 hover:scale-105 transition-all"><FiRefreshCw /> Book Another Product</button>
                       </div>
                    )}
                  </div>
                ) : cancelCooldownRemaining ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-10">
                    <FiClock className="text-orange-500 mb-4" size={64} />
                    <h2 className="text-2xl font-black uppercase text-orange-600 italic tracking-tighter">Cancellation Cooldown</h2>
                    <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-400 uppercase mb-1 tracking-widest">New Booking Available In</p>
                      <p className="text-2xl font-black text-orange-600 italic tracking-tighter">{cancelCooldownRemaining} Days</p>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase max-w-xs">You recently cancelled a payment. Please wait for the cooldown to expire before booking another product.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
                      <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-white" />
                      <div className="text-left text-black"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Applying as</p><p className="text-[10px] font-bold text-slate-700">{user.email}</p></div>
                    </div>
                    <div className="relative">
                      <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-xl text-left text-black">
                        <div className="flex items-center space-x-3 italic">
                          {selectedProduct?.category === 'laptop' ? <FiMonitor className="text-amber-500" /> : <FiSmartphone className="text-amber-500" />}
                          <span className="text-xs font-black uppercase">{selectedProduct?.name}</span>
                        </div>
                        <FiChevronDown />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-20 top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl max-h-[12rem] overflow-y-auto p-2">
                          {inventory.map((product) => (
                            <button key={product.id} type="button" onClick={() => { setSelectedProduct(product); setIsDropdownOpen(false); }} className="w-full text-left p-4 text-[10px] hover:bg-amber-50 rounded-lg flex justify-between items-center font-black uppercase text-black">
                              <span>{product.name}</span><span className="text-amber-600 font-black">₦{getPrice(product).toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="tel" required placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-[10px] font-black outline-none focus:border-amber-500 text-black" />
                      <input type="text" required placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-[10px] font-black outline-none focus:border-amber-500 text-black" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 4, 6].map((m) => (
                        <button key={m} type="button" onClick={() => setMonths(m)} className={`p-4 rounded-xl text-[10px] font-black border-2 transition-all ${months === m ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-md' : 'border-gray-50 text-gray-400'}`}>{m}m</button>
                      ))}
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-[#1A1A1A] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl transition-transform active:scale-95">{submitting ? 'Processing...' : 'Submit Financing Plan'}</button>
                  </form>
                )}

                <div className="mt-8 border-t pt-4">
                  <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between text-black uppercase font-black text-[10px] tracking-widest p-2 hover:bg-slate-50 rounded-lg transition-all">
                    <div className="flex items-center gap-2"><FiCalendar /> Purchase History ({history.length})</div>
                    <FiChevronDown className={`transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isHistoryOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 space-y-3">
                        {history.map((item) => (
                          <div key={item.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between">
                            <div className="text-left text-black">
                              <p className="text-[10px] font-black uppercase">{item.productName}</p>
                              <p className={`text-[8px] font-bold uppercase ${item.status === 'cancelled' ? 'text-red-500' : 'text-slate-400'}`}>
                                {item.status === 'cancelled' ? `Refund: ₦${item.refundAmount?.toLocaleString()}` : `Paid: ₦${item.amountPaid?.toLocaleString()} • ${item.status}`}
                              </p>
                            </div>
                            <button onClick={() => setHistoryToDelete(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><FiTrash2 size={14} /></button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FinancingModal;