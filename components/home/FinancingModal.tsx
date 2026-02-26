'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronDown, FiSmartphone, FiLoader, FiMonitor } from 'react-icons/fi';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import Image from 'next/image';

const FinancingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [months, setMonths] = useState(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    // Logic: Fetch both phones and laptops using the 'in' operator
    const q = query(
      collection(db, "products"), 
      where("category", "in", ["phone", "laptop"])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInventory(docs);
      
      // Auto-select first item if nothing is selected yet
      if (docs.length > 0 && !selectedProduct) {
        setSelectedProduct(docs[0]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, selectedProduct]);

  if (!isOpen) return null;

  const getPrice = (product: any) => product?.variants?.[0]?.price || 0;
  const getImageUrl = (product: any) => product?.variants?.[0]?.images?.[0]?.url || '';
  
  const amount = selectedProduct ? getPrice(selectedProduct) : 0;
  const monthlyPayment = amount / months;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-2 py-4 md:px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          className="relative bg-white rounded-lg w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh]"
        >
          {loading ? (
            <div className="w-full h-[400px] flex flex-col items-center justify-center space-y-4">
               <FiLoader className="animate-spin text-amber-500" size={40} />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Catalog...</p>
            </div>
          ) : (
            <>
              {/* Left Side - Summary */}
              <div className="bg-[#1A1A1A] text-white p-5 md:p-8 md:w-5/12 flex flex-col justify-between shrink-0">
                <div className="overflow-y-auto">
                  <h3 className="text-xl font-bold mb-6 italic uppercase tracking-tighter">Plan Summary</h3>
                  
                  {selectedProduct && (
                    <motion.div 
                      key={selectedProduct.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10 flex items-center space-x-4"
                    >
                      <div className="relative w-16 h-16 bg-white rounded-md p-1 overflow-hidden flex-shrink-0">
                        <img 
                          src={getImageUrl(selectedProduct)} 
                          alt="" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">
                          {selectedProduct.category === 'phone' ? 'Smartphone' : 'Laptop'}
                        </p>
                        <p className="text-sm font-semibold truncate w-32 uppercase">{selectedProduct.name}</p>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Total Amount</p>
                      <p className="text-2xl font-bold">₦{amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Monthly Payment</p>
                      <p className="text-3xl font-bold text-amber-500">₦{monthlyPayment.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 hidden md:block text-[9px] text-white/40 uppercase font-bold tracking-tighter">
                    * Items are held in vault until final payment.
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="p-5 md:p-8 md:w-7/12 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-[#1A1A1A] uppercase italic">Financing Portal</h3>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><FiX /></button>
                </div>

                <form className="space-y-5">
                  <div className="relative">
                    <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Select Device</label>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-lg text-left hover:border-amber-500 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        {selectedProduct?.category === 'laptop' ? <FiMonitor className="text-amber-500" /> : <FiSmartphone className="text-amber-500" />}
                        <span className="text-sm font-bold text-[#1A1A1A]">
                            {selectedProduct?.name || "Choose an item"}
                        </span>
                      </div>
                      <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-20 top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto p-2"
                        >
                          {inventory.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedProduct(product);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 rounded-lg flex justify-between items-center transition-colors mb-1 border-b border-gray-50 last:border-0"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-900 uppercase text-[11px]">{product.name}</span>
                                  <span className="text-[7px] bg-gray-100 px-1 rounded text-gray-500 font-black uppercase tracking-tighter">
                                    {product.category}
                                  </span>
                                </div>
                                <span className="text-[9px] text-gray-400 font-bold uppercase">{product.model || 'In Stock'}</span>
                              </div>
                              <span className="font-black text-amber-600">₦{getPrice(product).toLocaleString()}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Installment Period</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[3, 6, 12].map((m) => (
                        <label key={m} className={`cursor-pointer border-2 p-3 rounded-xl text-center transition-all ${months === m ? 'border-amber-500 bg-amber-50 text-amber-600 font-bold' : 'border-gray-100 hover:border-gray-200'}`}>
                          <input type="radio" className="hidden" name="months" value={m} onChange={() => setMonths(m)} checked={months === m} />
                          <span className="text-xs uppercase font-black">{m} Months</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Full Name</label>
                      <input type="text" required className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold" placeholder="e.g. Samuel Jackson" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Email Address</label>
                      <input type="email" required className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm font-bold" placeholder="name@email.com" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-[#1A1A1A] text-white py-5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-black transition-all mt-4">
                    Submit Layaway Request
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FinancingModal;