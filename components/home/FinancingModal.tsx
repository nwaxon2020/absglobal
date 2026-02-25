'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronDown, FiSmartphone } from 'react-icons/fi';
import { products } from '@/types'; 
import Image from 'next/image';

const FinancingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [months, setMonths] = useState(3);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Logic: Filter phones and initialize with the first one
  const phoneProducts = products.filter(p => p.category === 'phone');
  const [selectedProduct, setSelectedProduct] = useState(phoneProducts[0]);

  const amount = selectedProduct.price;
  const monthlyPayment = amount / months;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-2 py-4 md:px-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
          // Added max-h-[95vh] to prevent the modal from cutting off on mobile screens
          className="relative bg-white rounded-lg w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh]"
        >
          {/* Left Side - Summary & Image Card */}
          <div className="bg-[#1A1A1A] text-white p-5 md:p-8 md:w-5/12 flex flex-col justify-between shrink-0">
            <div>
              <h3 className="text-xl font-bold mb-6">Plan Summary</h3>
              
              {/* Small Product Image Card */}
              <motion.div 
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10 flex items-center space-x-4"
              >
                <div className="relative w-16 h-16 bg-white rounded-md p-1 overflow-hidden flex-shrink-0">
                  <Image 
                    src={selectedProduct.thumbnails[0].imageUrl} 
                    alt={selectedProduct.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-500 tracking-widest">Selected Model</p>
                  <p className="text-sm font-semibold truncate w-32">{selectedProduct.name}</p>
                </div>
              </motion.div>

              <div className="space-y-6">
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">${amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold mb-1">Monthly Payment</p>
                  <p className="text-3xl font-bold text-amber-500">${monthlyPayment.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6 hidden md:block">
              <p className="text-xs text-white/40 italic">
                *Device is released upon the final payment of month {months}.
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          {/* Maintained overflow-y-auto to allow scrolling the form on smaller heights */}
          <div className="p-5 md:p-8 md:w-7/12 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-[#1A1A1A]">Apply Now</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><FiX /></button>
            </div>

            <form className="space-y-5">
              {/* Product Selection Dropdown */}
              <div className="relative">
                <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Select Smartphone</label>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 border border-gray-100 p-4 rounded-lg text-left hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <FiSmartphone className="text-amber-500" />
                    <span className="text-sm font-bold text-[#1A1A1A]">{selectedProduct.name} - ${selectedProduct.price}</span>
                  </div>
                  <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                    >
                      {phoneProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 flex justify-between items-center transition-colors border-b last:border-0 border-gray-50"
                        >
                          <span className="font-medium text-gray-700">{product.name}</span>
                          <span className="font-bold text-amber-600">${product.price}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Duration</label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 6, 12].map((m) => (
                    <label key={m} className={`cursor-pointer border-2 p-3 rounded-lg text-center transition-all ${months === m ? 'border-amber-500 bg-amber-50 text-amber-600 font-bold' : 'border-gray-100 hover:border-gray-200'}`}>
                      <input type="radio" className="hidden" name="months" value={m} onChange={() => setMonths(m)} checked={months === m} />
                      <span className="text-xs">{m} Months</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Full Name</label>
                  <input type="text" className="w-full bg-gray-50 border-0 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" placeholder="John Emmanuel" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black text-black/40 tracking-widest block mb-2">Email Address</label>
                  <input type="email" className="w-full bg-gray-50 border-0 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" placeholder="ceo@abstglobal.com" />
                </div>
              </div>

              <button type="button" className="w-full bg-[#1A1A1A] text-white py-4 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition-all mt-2">
                Submit Global Application
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FinancingModal;