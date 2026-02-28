'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiChevronDown, FiInbox, FiSmartphone, FiMonitor, 
  FiPercent, FiTrash2, FiClock, FiPhone, FiMapPin, FiMail,
  FiTruck, FiCheckCircle, FiAlertCircle, FiFilter, FiSquare, FiStar, FiLoader 
} from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { 
  collection, onSnapshot, query, orderBy, doc, 
  updateDoc, getDoc, setDoc, serverTimestamp, increment 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

const WHATSAPP_MESSAGE_TEMPLATE = (name: string, product: string, amount: number, address: string) => 
`*DELIVERY NOTICE* 📦

Hello *${name}*, your financing plan is complete!

*Product:* ${product}
*Total Paid:* ₦${amount.toLocaleString()}
*Address:* ${address}

Your product has been marked as *Delivered*. Thank you for choosing us!`;

const FinancingAdminHub = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [globalTrustData, setGlobalTrustData] = useState<Record<string, number>>({});
  const [interestRate, setInterestRate] = useState(5);
  const [loading, setLoading] = useState(true);
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['phone']);

  // Updated star colors: Bronze, Silver, Gold, Platinum, and VVIP Purple
  const starColors = ["#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#A855F7"];

  const [confirming, setConfirming] = useState<{
    id: string;
    type: 'approve' | 'reject' | 'delete' | 'deliver' | 'refund';
    name?: string;
    status?: string; 
    data?: any; 
  } | null>(null);

  useEffect(() => {
    const qRequests = query(collection(db, "financing_requests"), orderBy("createdAt", "desc"));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((r: any) => r.adminDeleted !== true) 
      );
      setLoading(false);
    });

    const unsubTrust = onSnapshot(collection(db, "global_trust"), (snapshot) => {
      const trustMap: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        trustMap[doc.id.toLowerCase().trim()] = doc.data().count || 0;
      });
      setGlobalTrustData(trustMap);
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

    return () => { unsubRequests(); unsubTrust(); unsubProducts(); };
  }, []);

  const updateSettings = async (updates: any) => {
    try {
      await setDoc(doc(db, "admin_settings", "financing"), updates, { merge: true });
    } catch (e) { toast.error("Sync failed"); }
  };

  const handleAction = async () => {
    if (!confirming) return;
    const { id, type, status, data } = confirming;
    try {
      if (type === 'approve') {
        await updateDoc(doc(db, "financing_requests", id), { status: 'approved', amountPaid: 0, approvedAt: serverTimestamp() });
        toast.success("Approved");
      } else if (type === 'reject') {
        await updateDoc(doc(db, "financing_requests", id), { status: 'rejected', rejectedAt: serverTimestamp() });
        toast.success("Rejected");
      } else if (type === 'refund') {
        await updateDoc(doc(db, "financing_requests", id), { refunded: true, refundedAt: serverTimestamp() });
        toast.success("Marked as Refunded");
      } else if (type === 'deliver') {
        const userEmail = data.email.toLowerCase().trim();
        const trustRef = doc(db, "global_trust", userEmail);
        const trustSnap = await getDoc(trustRef);
        
        let transactionCount = 1;
        if (trustSnap.exists()) {
          transactionCount = (trustSnap.data().count || 0) + 1;
          await updateDoc(trustRef, { count: increment(1), lastSuccess: serverTimestamp() });
        } else {
          await setDoc(trustRef, { count: 1, email: userEmail, lastSuccess: serverTimestamp() });
        }

        await updateDoc(doc(db, "financing_requests", id), { 
          status: 'delivered', 
          deliveredAt: serverTimestamp(), 
          trustStars: Math.min(transactionCount, 5) 
        });

        const cleanPhone = data.phone.startsWith('0') ? data.phone.substring(1) : data.phone;
        const formattedPhone = cleanPhone.startsWith('234') ? cleanPhone : `234${cleanPhone}`;
        
        const finalMsg = WHATSAPP_MESSAGE_TEMPLATE(
          data.fullName, 
          data.productName, 
          (data.totalWithInterest || data.totalAmount), 
          data.address
        );

        window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMsg)}`, '_blank');
        toast.success(`Order Delivered & Message Sent!`);
      } else if (type === 'delete') {
        await updateDoc(doc(db, "financing_requests", id), { adminDeleted: true });
        toast.success("Removed from view");
      }
    } catch (error) {
      toast.error("Action failed");
    } finally { setConfirming(null); }
  };

  const activeRequests = requests.filter(r => r.status !== 'delivered' && r.status !== 'cancelled');
  const historyRequests = requests.filter(r => r.status === 'delivered' || r.status === 'cancelled');

  return (
    <div className="w-full relative font-sans text-left text-black">
      <AnimatePresence>
        {confirming && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${confirming.type === 'delete' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {confirming.type === 'delete' ? <FiTrash2 size={30}/> : <FiCheckCircle size={30}/>}
              </div>
              <h3 className="text-sm font-black uppercase mb-2 italic tracking-tighter text-center">Confirm {confirming.type}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8 leading-relaxed text-center">Customer: {confirming.name}</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirming(null)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-black">Back</button>
                <button onClick={handleAction} className={`flex-1 py-4 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg ${confirming.type === 'delete' ? 'bg-red-600' : 'bg-green-600'}`}>Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-all outline-none">
          <div className="flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-[#0B2A4A] text-white rounded-xl flex items-center justify-center shrink-0">
              {loading ? <FiLoader className="animate-spin" /> : <FiInbox size={20} />}
            </div>
            <div>
              <h3 className="text-sm font-black uppercase italic text-slate-900 tracking-tight">Financing Hub</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic text-left">Management & Audits</p>
            </div>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}><FiChevronDown size={20} /></motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-[#FAFBFF] border-t overflow-hidden">
              <div className="p-5 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-widest"><FiPercent className="text-blue-500" /> Markup</h4>
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black">+{interestRate}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value={interestRate} onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInterestRate(val);
                        updateSettings({ globalInterest: val });
                      }} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative text-left">
                    <h4 className="text-[9px] font-black uppercase text-slate-400 flex items-center gap-2 mb-3 tracking-widest"><FiFilter className="text-orange-500" /> Categories</h4>
                    <button onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-lg text-[9px] font-black uppercase text-slate-600">
                      <span className="truncate">{selectedCategories.length === 0 ? "None" : `${selectedCategories.length} Active`}</span>
                      <FiChevronDown className={isCatDropdownOpen ? 'rotate-180' : ''} />
                    </button>
                    {isCatDropdownOpen && (
                      <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl p-2 max-h-60 overflow-y-auto">
                        {availableCategories.map(cat => (
                          <button key={cat} onClick={() => {
                            const updated = selectedCategories.includes(cat) ? selectedCategories.filter(c => c !== cat) : [...selectedCategories, cat];
                            setSelectedCategories(updated);
                            updateSettings({ allowedCategories: updated });
                          }} className="w-full flex items-center justify-between p-3 rounded-lg mb-1 hover:bg-slate-50 transition-all text-left">
                            <span className="text-[10px] font-black uppercase text-slate-700">{cat}</span>
                            {selectedCategories.includes(cat) ? <FiCheckCircle className="text-blue-600" size={16} /> : <FiSquare className="text-slate-200" size={16} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">Active Requests</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {activeRequests.map((req) => {
                      const totalToPay = req.totalWithInterest || req.totalAmount;
                      const balance = totalToPay - (req.amountPaid || 0);
                      const stars = Math.min(globalTrustData[req.email?.toLowerCase().trim()] || 0, 5);

                      return (
                        <div key={req.id} className="p-4 rounded-2xl border bg-white border-slate-200 shadow-sm relative text-left">
                          <button onClick={() => setConfirming({id: req.id, type: 'delete', name: req.fullName, status: req.status, data: req})} className="absolute top-3 right-3 text-slate-300 hover:text-red-500"><FiTrash2 size={14}/></button>
                          <div className="flex items-center gap-3 mb-4 text-left">
                             <div className="p-2 bg-slate-50 rounded-lg border">{req.productCategory === 'laptop' ? <FiMonitor size={16} className="text-blue-500" /> : <FiSmartphone size={16} className="text-blue-500" />}</div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-slate-900 leading-tight">{req.productName}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">{req.fullName}</p>
                                  <div className="flex gap-0.5 ml-1">
                                    {[...Array(5)].map((_, i) => (
                                      <FiStar 
                                        key={i} 
                                        size={8} 
                                        fill={i < stars ? starColors[Math.max(0, stars - 1)] : "transparent"} 
                                        color={i < stars ? starColors[Math.max(0, stars - 1)] : "#cbd5e1"} 
                                        className={stars === 5 ? "drop-shadow-[0_0_2px_rgba(168,85,247,0.8)]" : ""}
                                      />
                                    ))}
                                  </div>
                                </div>
                             </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => setConfirming({id: req.id, type: 'approve', name: req.fullName, data: req})} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-[9px] font-black uppercase">Approve</button>
                              <button onClick={() => setConfirming({id: req.id, type: 'reject', name: req.fullName, data: req})} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase">Reject</button>
                            </div>
                          )}
                          {req.status === 'approved' && (
                             <div className="pt-3">
                               <div className="flex justify-between items-center text-[10px] font-black uppercase mb-2">
                                  <span className="text-slate-400">Paid: ₦{(req.amountPaid || 0).toLocaleString()}</span>
                                  <span className="text-blue-600">{balance <= 0 ? "PAID" : `₦${balance.toLocaleString()}`}</span>
                               </div>
                               <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
                                  <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, ((req.amountPaid || 0) / totalToPay) * 100)}%` }} />
                               </div>
                               {balance <= 0 && (
                                  <div className="space-y-3">
                                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[9px] font-black text-blue-700 uppercase space-y-1">
                                      <div className="flex items-center gap-2 text-left"><FiPhone /> {req.phone}</div>
                                      <div className="flex items-center gap-2 text-left"><FiMail /> {req.email}</div>
                                      <div className="flex items-start gap-2 text-left"><FiMapPin className="mt-0.5" /> {req.address}</div>
                                    </div>
                                    <button onClick={() => setConfirming({id: req.id, type: 'deliver', name: req.fullName, data: req})} className="w-full py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2"><FiTruck /> Deliver Now</button>
                                  </div>
                               )}
                             </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t">
                    <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between text-black uppercase font-black text-[10px] p-3 bg-slate-100 rounded-xl">
                      <div className="flex items-center gap-2 text-left"><FiClock /> Global Audit ({historyRequests.length})</div>
                      <FiChevronDown className={isHistoryOpen ? 'rotate-180' : ''} />
                    </button>
                    <AnimatePresence>
                      {isHistoryOpen && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="mt-4 space-y-2 overflow-hidden text-left">
                          {historyRequests.map((req) => {
                            const stars = Math.min(globalTrustData[req.email?.toLowerCase().trim()] || 0, 5);
                            return (
                              <div key={req.id} className={`p-3 rounded-xl border flex items-center justify-between shadow-sm ${req.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                                <div className="text-left">
                                  <div className="flex items-center gap-2">
                                    <p className="text-[10px] font-black text-black uppercase">{req.productName}</p>
                                    <span className={`text-[7px] px-1.5 py-0.5 rounded font-black uppercase ${req.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{req.status}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                      {[...Array(5)].map((_, i) => (
                                        <FiStar 
                                          key={i} 
                                          size={8} 
                                          fill={i < stars ? starColors[Math.max(0, stars - 1)] : "transparent"} 
                                          color={i < stars ? starColors[Math.max(0, stars - 1)] : "#cbd5e1"} 
                                          className={stars === 5 ? "drop-shadow-[0_0_2px_rgba(168,85,247,0.8)]" : ""}
                                        />
                                      ))}
                                      <p className="text-[8px] font-bold text-slate-400 uppercase ml-1">{req.fullName} {req.refunded && "• REFUNDED"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {req.status === 'cancelled' && !req.refunded && (
                                    <button onClick={() => setConfirming({id: req.id, type: 'refund', name: req.fullName})} className="p-2 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase shadow-sm">Refund</button>
                                  )}
                                  <button onClick={() => setConfirming({id: req.id, type: 'delete', name: req.fullName, status: req.status, data: req})} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><FiTrash2 size={14} /></button>
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
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