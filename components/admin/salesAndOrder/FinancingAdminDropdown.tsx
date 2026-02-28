'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronDown, FiInbox, FiSmartphone, FiMonitor, 
  FiPercent, FiTrash2, FiClock, FiLayers,
  FiTruck, FiCheckCircle, FiAlertCircle, FiXCircle, FiFilter, FiCheck, FiSquare
} from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, getDoc, deleteDoc, setDoc, serverTimestamp 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const FinancingAdminHub = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [interestRate, setInterestRate] = useState(5);
  const [loading, setLoading] = useState(true);
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['phone']);

  const [confirming, setConfirming] = useState<{
    id: string;
    type: 'approve' | 'reject' | 'delete' | 'deliver';
    name?: string;
    status?: string; 
  } | null>(null);

  useEffect(() => {
    const qRequests = query(collection(db, "financing_requests"), orderBy("createdAt", "desc"));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qProducts = query(collection(db, "products"));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const cats = snapshot.docs.map(doc => doc.data().category);
      const uniqueCats = Array.from(new Set(cats)).filter(Boolean) as string[];
      setAvailableCategories(uniqueCats.length > 0 ? uniqueCats : ['phone', 'laptop']);
    });

    const fetchSettings = async () => {
      const settingsDoc = await getDoc(doc(db, "admin_settings", "financing"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setInterestRate(data.globalInterest || 5);
        setSelectedCategories(Array.isArray(data.allowedCategories) ? data.allowedCategories : ['phone']);
      }
    };
    fetchSettings();

    return () => { unsubRequests(); unsubProducts(); };
  }, []);

  const toggleCategory = (cat: string) => {
    const updated = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat];
    
    setSelectedCategories(updated);
    updateSettings({ allowedCategories: updated });
  };

  const updateSettings = async (updates: any) => {
    try {
      await setDoc(doc(db, "admin_settings", "financing"), updates, { merge: true });
    } catch (e) { toast.error("Sync failed"); }
  };

  const handleAction = async () => {
    if (!confirming) return;
    const { id, type, status } = confirming;
    try {
      if (type === 'approve') {
        await updateDoc(doc(db, "financing_requests", id), { status: 'approved', amountPaid: 0, approvedAt: serverTimestamp() });
        toast.success("Approved");
      } else if (type === 'reject') {
        await updateDoc(doc(db, "financing_requests", id), { status: 'rejected', rejectedAt: serverTimestamp() });
        toast.success("Rejected");
      } else if (type === 'deliver') {
        await updateDoc(doc(db, "financing_requests", id), { status: 'delivered', deliveredAt: serverTimestamp() });
        toast.success("Delivered");
      } else if (type === 'delete') {
        if (status === 'approved' || status === 'rejected' || status === 'cancelled') {
          toast.error("Record is protected.");
          return;
        }
        await deleteDoc(doc(db, "financing_requests", id));
        toast.success("Deleted");
      }
    } finally { setConfirming(null); }
  };

  return (
    <div className="w-full relative font-sans text-left">
      <AnimatePresence>
        {confirming && (
           <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-100">
               <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                 confirming.type === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
               }`}>
                 {confirming.type === 'approve' ? <FiCheckCircle size={30}/> : <FiAlertCircle size={30}/>}
               </div>
               <h3 className="text-sm font-black uppercase mb-2 italic tracking-tighter">Confirm {confirming.type}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed">
                 Customer: {confirming.name}
               </p>
               <div className="flex gap-3">
                 <button onClick={() => setConfirming(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest">Back</button>
                 <button onClick={handleAction} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${confirming.type === 'approve' ? 'bg-green-600' : 'bg-red-600'}`}>Confirm</button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all outline-none">
          <div className="flex items-center gap-4">
            <div className="relative w-10 h-10 bg-[#0B2A4A] text-white rounded-xl flex items-center justify-center shrink-0">
              <FiInbox size={20} />
              {requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 bg-red-500 rounded-full border-2 border-white items-center justify-center text-[8px] font-black">
                  {requests.filter(r => r.status === 'pending').length}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic text-slate-900 tracking-tight">Financing Hub</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Rates & Category Access</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={20} /></motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0 }} 
              animate={{ height: "auto" }} 
              exit={{ height: 0 }} 
              className="bg-[#FAFBFF] border-t"
            >
              <div className="p-5 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Markup Slider */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2"><FiPercent className="text-blue-500" /> Markup</h4>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black">+{interestRate}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="40" step="1" value={interestRate} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInterestRate(val);
                        updateSettings({ globalInterest: val });
                      }} 
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                    />
                  </div>

                  {/* Categories Dropdown */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                        <h4 className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2 mb-3 tracking-widest">
                        <FiFilter className="text-orange-500" /> Allowed Categories
                        </h4>
                        
                        <button 
                        onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                        className="w-full flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-lg text-[9px] font-black uppercase text-slate-600 hover:border-blue-400 transition-all"
                        >
                        <span className="truncate">
                            {selectedCategories.length === 0 ? "None Selected" : `${selectedCategories.length} Categories Active`}
                        </span>
                        <FiChevronDown className={isCatDropdownOpen ? 'rotate-180' : ''} />
                        </button>

                    <AnimatePresence>
                      {isCatDropdownOpen && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                          className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto"
                        >
                          {availableCategories.map(cat => (
                            <button 
                              key={cat} onClick={() => toggleCategory(cat)}
                              className="w-full flex items-center justify-between p-3 rounded-lg mb-1 hover:bg-slate-50 transition-all"
                            >
                              <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                              {selectedCategories.includes(cat) ? <FiCheckCircle className="text-blue-600" size={16} /> : <FiSquare className="text-slate-200" size={16} />}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* If the dropdown is open, this div provides the necessary space so the list below isn't covered or clipped */}
                {isCatDropdownOpen && <div className="h-40 md:h-20" />}

                {/* Records Section */}
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Live Applications</p>
                  <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {requests.map((req) => {
                      const totalToPay = req.totalWithInterest || req.totalAmount;
                      const balance = totalToPay - (req.amountPaid || 0);
                      const isRejected = req.status === 'rejected';
                      const isDelivered = req.status === 'delivered';
                      const isCancelled = req.status === 'cancelled';

                      return (
                        <div key={req.id} className={`p-4 rounded-2xl border bg-white border-slate-200 shadow-sm relative ${isRejected ? 'opacity-50 grayscale' : ''}`}>
                          <button onClick={() => setConfirming({id: req.id, type: 'delete', name: req.fullName, status: req.status})} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><FiTrash2 size={14}/></button>
                          
                          <div className="flex items-center gap-3 mb-4 pr-6">
                            <div className="p-2 bg-slate-50 rounded-lg border shrink-0">
                              {req.productCategory === 'laptop' ? <FiMonitor size={16} className="text-blue-500" /> : <FiSmartphone size={16} className="text-blue-500" />}
                            </div>
                            <div className="overflow-hidden text-left">
                              <p className="text-[10px] font-black uppercase text-slate-900 leading-tight truncate">{req.productName}</p>
                              <p className="text-[9px] font-bold uppercase text-slate-400 truncate">{req.fullName}</p>
                            </div>
                          </div>

                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => setConfirming({id: req.id, type: 'approve', name: req.fullName})} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md shadow-green-100">Approve</button>
                              <button onClick={() => setConfirming({id: req.id, type: 'reject', name: req.fullName})} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md shadow-red-100">Reject</button>
                            </div>
                          )}

                          {req.status === 'approved' && (
                            <div className="space-y-4 pt-4 border-t border-dashed border-slate-200">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter">
                                <span className="text-slate-400">Paid: ₦{(req.amountPaid || 0).toLocaleString()}</span>
                                <span className="text-blue-600">{balance <= 0 ? "FULLY PAID" : `Owed: ₦${balance.toLocaleString()}`}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${((req.amountPaid || 0) / totalToPay) * 100}%` }} />
                              </div>
                              {/* Cancel Hub Button Removed to prevent accidental deletion of payments */}
                              {balance <= 0 && <button onClick={() => setConfirming({id: req.id, type: 'deliver', name: req.fullName})} className="w-full py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"><FiTruck /> Mark Delivered</button>}
                            </div>
                          )}

                          {(isCancelled || isDelivered) && (
                            <div className={`mt-2 p-3 rounded-xl border text-[9px] font-black uppercase text-center ${isCancelled ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                              {isCancelled ? `Cancelled • Refund Due: ₦${req.refundAmount?.toLocaleString()}` : 'Order Completed & Delivered'}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FinancingAdminHub;