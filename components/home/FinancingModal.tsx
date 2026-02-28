"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronDown, FiSmartphone, FiLoader, FiMonitor, FiClock, FiCheckCircle, FiAlertCircle, FiAlertTriangle, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, serverTimestamp, getDoc, doc, updateDoc, increment, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const FinancingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [months, setMonths] = useState(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [interestRate, setInterestRate] = useState(5);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // STICKY EMAIL: Check localStorage immediately so the form doesn't flicker
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('financing_user_email');
      return { fullName: '', email: savedEmail || '', phone: '', address: '' };
    }
    return { fullName: '', email: '', phone: '', address: '' };
  });

  const REJECT_COOLDOWN_DAYS = 5;
  const CANCEL_COOLDOWN_DAYS = 3;

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
          if (Array.isArray(data.allowedCategories) && data.allowedCategories.length > 0) {
            allowedCats = data.allowedCategories;
          }
        }

        const q = query(
          collection(db, "products"), 
          where("category", "in", allowedCats)
        );

        return onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setInventory(docs);
          if (docs.length > 0) setSelectedProduct(docs[0]);
          setLoading(false);
        });
      } catch (error) {
        setLoading(false);
      }
    };

    fetchGlobalData();
  }, [isOpen]);

  useEffect(() => {
    if (!formData.email || formData.email.length < 5) return;
    
    // Remember this user for the next reload
    localStorage.setItem('financing_user_email', formData.email);

    const q = query(collection(db, "financing_requests"), where("email", "==", formData.email));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setActiveRequest({ id: snap.docs[0].id, ...snap.docs[0].data() });
      else setActiveRequest(null);
    });
  }, [formData.email]);

  const getPrice = (product: any) => product?.variants?.[0]?.price || 0;
  const getImageUrl = (product: any) => product?.variants?.[0]?.images?.[0]?.url || '';
  
  const basePrice = selectedProduct ? getPrice(selectedProduct) : 0;
  const totalWithInterest = basePrice * (1 + interestRate / 100);

  const calculatePenalty = () => {
    if (!activeRequest || !activeRequest.createdAt) return { penalty: 0, monthsPassed: 0 };
    const start = activeRequest.createdAt.toDate();
    const now = new Date();
    const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const balance = (activeRequest.totalWithInterest || 0) - (activeRequest.amountPaid || 0);
    const penalty = monthsPassed > 0 ? (balance * (0.005 * monthsPassed)) : 0;
    return { penalty, monthsPassed };
  };

  const getDaysRemaining = (timestamp: any, cooldownDays: number) => {
    if (!timestamp) return 0;
    const actionDate = timestamp.toDate();
    const now = new Date();
    const diffTime = now.getTime() - actionDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = cooldownDays - diffDays;
    return remaining > 0 ? remaining : 0;
  };

  const { penalty, monthsPassed } = calculatePenalty();
  const refundAmount = activeRequest ? (activeRequest.amountPaid * 0.85) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "financing_requests"), {
        ...formData,
        productName: selectedProduct.name,
        productId: selectedProduct.id,
        productCategory: selectedProduct.category,
        totalAmount: basePrice,
        totalWithInterest: totalWithInterest,
        interestRate: interestRate,
        months: months,
        amountPaid: 0,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      toast.success("Request Submitted Successfully");
    } catch (error) { toast.error("Submission failed"); } 
    finally { setSubmitting(false); }
  };

  const logTestPayment = async () => {
    const amt = prompt("Enter Test Payment (₦):");
    if (!amt || isNaN(Number(amt))) return;
    await updateDoc(doc(db, "financing_requests", activeRequest.id), {
      amountPaid: increment(Number(amt)),
      lastPaymentAt: serverTimestamp()
    });
    toast.success("Test Payment Stored");
  };

  const handleFinalCancel = async () => {
    if (!activeRequest) return;
    const hasPaid = (activeRequest.amountPaid || 0) > 0;
    if (!hasPaid) {
      await deleteDoc(doc(db, "financing_requests", activeRequest.id));
      localStorage.removeItem('financing_user_email'); // Clear memory so they can see form again
      toast.success("Request Deleted");
    } else {
      await updateDoc(doc(db, "financing_requests", activeRequest.id), {
        status: 'cancelled',
        refundAmount: refundAmount,
        cancelledAt: serverTimestamp()
      });
      toast.success("Cancelled (Refund Pending)");
    }
    setShowCancelConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-2 py-4 md:px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-white rounded-lg w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[98vh]">
          
          <AnimatePresence>
            {showCancelConfirm && (
              <motion.div className="absolute inset-0 z-[200] bg-white/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
                <div className="max-w-xs">
                  <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
                  <h3 className="text-sm font-black uppercase italic mb-2">Confirm Cancellation</h3>
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed mb-8">
                    { (activeRequest?.amountPaid || 0) > 0 ? (
                      <>
                        <p>15% Service charge applies.</p>
                        <p className="text-red-600 font-black mt-2">Refundable: ₦{refundAmount.toLocaleString()}</p>
                      </>
                    ) : <p>This will delete your request. Proceed?</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-4 bg-slate-100 rounded-lg text-[10px] font-black uppercase">Back</button>
                    <button onClick={handleFinalCancel} className="flex-1 py-4 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase">Confirm</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center space-y-4">
               <FiLoader className="animate-spin text-amber-500" size={40} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
            </div>
          ) : (
            <>
              <div className="bg-[#1A1A1A] text-white p-5 md:p-8 md:w-5/12 flex flex-col justify-between shrink-0 text-left">
                <div className="overflow-y-auto">
                  <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tighter">Plan Summary</h3>
                  {selectedProduct && (
                    <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10 flex items-center space-x-4">
                      <div className="relative w-16 h-16 bg-white rounded-md p-1 overflow-hidden flex-shrink-0">
                        <img src={getImageUrl(selectedProduct)} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">{selectedProduct.category}</p>
                        <p className="text-sm font-semibold truncate w-32 uppercase leading-tight">{selectedProduct.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-around items- gap-4 md:flex-col space-y-4 md:space-y-6">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Total (Inc. {interestRate}% Interest)</p>
                      <p className="text-lg md:text-2xl font-bold italic">₦{(activeRequest?.totalWithInterest || totalWithInterest).toLocaleString()}</p>
                      {penalty > 0 && <p className="text-red-500 text-[9px] font-black uppercase mt-1">+ ₦{penalty.toLocaleString()} Penalty</p>}
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Monthly Payment</p>
                      <p className="text-xl md:text-3xl font-bold text-amber-500">₦{( (activeRequest?.totalWithInterest || totalWithInterest) / (activeRequest?.months || months) ).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      {activeRequest && <p className="text-[9px] text-white/20 mt-1 uppercase font-bold tracking-widest">Months: {monthsPassed} passed</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="py-5 px-3 md:p-6 md:w-7/12 overflow-y-auto text-left">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-black text-[#1A1A1A] uppercase italic">Financing Portal</h3>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><FiX /></button>
                </div>

                {activeRequest ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 py-10">
                    {activeRequest.status === 'pending' && (
                      <div className="flex flex-col items-center">
                        <FiClock className="text-amber-500 animate-pulse mb-4" size={60} />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">Under Review</h2>
                        <button onClick={() => setShowCancelConfirm(true)} className="mt-10 text-red-500 text-[9px] font-black uppercase underline">Withdraw Application</button>
                      </div>
                    )}

                    {activeRequest.status === 'approved' && (
                      <div className="w-full space-y-6">
                        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-left">
                          <h4 className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-4 italic">Live Progress</h4>
                          <div className="flex justify-between text-[11px] font-black mb-2 uppercase">
                            <span>Paid: ₦{(activeRequest.amountPaid || 0).toLocaleString()}</span>
                            <span>Total Owed: ₦{((activeRequest.totalWithInterest - activeRequest.amountPaid) + penalty).toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full transition-all duration-1000" style={{ width: `${((activeRequest.amountPaid || 0) / activeRequest.totalWithInterest) * 100}%` }} />
                          </div>
                        </div>
                        <div className="flex flex-col gap-4">
                          <button onClick={logTestPayment} className="w-full py-4 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Simulate Payment</button>
                          <button onClick={() => setShowCancelConfirm(true)} className="text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mx-auto italic underline">Cancel Purchase</button>
                        </div>
                      </div>
                    )}

                    {activeRequest.status === 'rejected' && (
                      <div className="flex flex-col items-center p-6">
                        <FiAlertCircle className="text-red-500 mb-4" size={60} />
                        <h2 className="text-2xl font-black uppercase text-red-600 italic tracking-tighter">Rejected</h2>
                        <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-6 w-full flex flex-col items-center">
                          <FiCalendar className="text-red-400 mb-2" size={24} />
                          <p className="text-[9px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Cooldown Active</p>
                          <p className="text-2xl font-black text-red-600">{getDaysRemaining(activeRequest.rejectedAt, REJECT_COOLDOWN_DAYS)} Days Left</p>
                        </div>
                      </div>
                    )}

                    {activeRequest.status === 'cancelled' && (
                      <div className="flex flex-col items-center p-6">
                        <FiAlertTriangle className="text-orange-500 mb-4" size={60} />
                        <h2 className="text-2xl font-black uppercase text-slate-900 italic tracking-tighter text-left">Request Cancelled</h2>
                        <div className="mt-8 bg-slate-50 border border-slate-100 rounded-2xl p-6 w-full flex flex-col items-center">
                          <FiClock className="text-slate-400 mb-2" size={24} />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Re-apply Eligibility</p>
                          <p className="text-2xl font-black text-slate-900">{getDaysRemaining(activeRequest.cancelledAt, CANCEL_COOLDOWN_DAYS)} Days Left</p>
                        </div>
                      </div>
                    )}

                    {activeRequest.status === 'delivered' && (
                       <div className="flex flex-col items-center">
                         <FiCheckCircle className="text-green-500 mb-4" size={60} />
                         <h2 className="text-2xl font-black uppercase text-green-600 italic tracking-tighter">Order Dispatched!</h2>
                       </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-1">Select Device</label>
                      <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-lg text-left hover:border-amber-500 transition-all">
                        <div className="flex items-center space-x-3">
                          {selectedProduct?.category === 'laptop' ? <FiMonitor className="text-amber-500" /> : <FiSmartphone className="text-amber-500" />}
                          <span className="text-sm font-bold text-[#1A1A1A] uppercase">{selectedProduct?.name}</span>
                        </div>
                        <FiChevronDown className={isDropdownOpen ? 'rotate-180' : ''} />
                      </button>
                      {isDropdownOpen && (
                        <div className="absolute z-20 top-full left-0 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-[15rem] overflow-y-auto p-2">
                          {inventory.map((product) => (
                            <button key={product.id} type="button" onClick={() => { setSelectedProduct(product); setIsDropdownOpen(false); }} className="w-full text-left p-3 text-xs hover:bg-amber-50 rounded-lg flex justify-between items-center transition-all">
                              <span className="font-bold uppercase">{product.name}</span>
                              <span className="font-black text-amber-600">₦{getPrice(product).toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-1">Installment Period</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[3, 6, 12].map((m) => (
                          <label key={m} className={`cursor-pointer border-2 p-2 rounded-lg text-center transition-all ${months === m ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-50 text-gray-400'}`}>
                            <input type="radio" className="hidden" name="months" onChange={() => setMonths(m)} checked={months === m} />
                            <span className="text-xs font-black">{m} Months</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" required placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs font-bold outline-none focus:border-amber-500" />
                      <input type="tel" required placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs font-bold outline-none focus:border-amber-500" />
                    </div>
                    <input type="email" required placeholder="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs font-bold outline-none focus:border-amber-500" />
                    <textarea required placeholder="Residential Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-100 p-3 rounded-lg text-xs font-bold outline-none focus:border-amber-500 h-16 resize-none" />

                    <button type="submit" disabled={submitting} className="w-full bg-[#1A1A1A] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-black/10">
                      {submitting ? 'Launching...' : 'Submit Layaway Request'}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FinancingModal;