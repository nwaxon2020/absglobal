'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart = ({ isOpen, onClose }: CartProps) => {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; itemId: number | null }>({
    show: false,
    itemId: null,
  });

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const confirmDelete = () => {
    if (deleteConfirmation.itemId) {
      removeFromCart(deleteConfirmation.itemId);
      toast.success('Item removed');
      setDeleteConfirmation({ show: false, itemId: null });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />

            {/* Cart Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full md:w-[420px] bg-white/95 backdrop-blur-xl shadow-2xl z-[101] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-black/5 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-600">
                    <FiShoppingBag size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1A1A1A]">Your Bag</h2>
                    <p className="text-[10px] uppercase tracking-widest text-black/40 font-bold">
                      {itemCount} {itemCount === 1 ? 'Item' : 'Items'} Selection
                    </p>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="p-2 hover:bg-black/5 rounded-full transition-colors text-black/40 hover:text-black"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                    <FiShoppingBag size={48} className="mb-4" />
                    <p className="text-lg font-medium">Your cart is currently empty</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div 
                      layout
                      key={item.id} 
                      className="group flex items-center space-x-4 bg-white p-3 rounded-2xl border border-black/5 hover:shadow-md transition-shadow"
                    >
                      <div className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          // Logic updated: mapping item image to thumbnails[0].imageUrl
                          src={item.thumbnails[0].imageUrl}
                          alt={item.name}
                          fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <h3 className="font-bold text-sm text-[#1A1A1A] line-clamp-1">{item.name}</h3>
                        <p className="text-amber-600 font-bold text-sm">₦{item.price.toLocaleString()}</p>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="p-1.5 hover:bg-white rounded-md shadow-sm transition-all text-black/60"
                            >
                              <FiMinus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1.5 hover:bg-white rounded-md shadow-sm transition-all text-black/60"
                            >
                              <FiPlus size={12} />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => setDeleteConfirmation({ show: true, itemId: item.id })}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer / Checkout */}
              {cart.length > 0 && (
                <div className="p-6 bg-white border-t border-black/5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-black/40">
                      <span>Subtotal</span>
                      <span>₦{total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-black text-2xl text-amber-600 tracking-tighter">
                        ₦{total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-[#1A1A1A] text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center justify-center space-x-2">
                    <span>Proceed to Checkout</span>
                  </button>
                  <p className="text-[10px] text-center text-black/30 font-medium">
                    Secure Global Checkout Powered by A.B.S.T
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modern Confirmation Dialog */}
      <AnimatePresence>
        {deleteConfirmation.show && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation({ show: false, itemId: null })}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Remove Item?</h3>
              <p className="text-sm text-black/40 mb-8">This will remove the selected gadget from your global selection.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmation({ show: false, itemId: null })}
                  className="flex-1 py-3 bg-gray-100 text-[#1A1A1A] font-bold rounded-xl text-xs uppercase tracking-widest"
                >
                  Keep It
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-red-200"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Cart;