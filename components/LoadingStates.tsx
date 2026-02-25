"use client";
import { motion } from 'framer-motion';

// For the Store Page: Shows 5 pulsing cards
export const StoreSkeleton = () => (
  <div className="min-h-screen bg-[#F5F5F5] pt-32 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl h-64 animate-pulse border-t-4 border-[#FFD700]">
          <div className="bg-gray-200 h-2/3 w-full mb-4" />
          <div className="px-3 space-y-2">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// For the Product Details: A clean full-screen pulse
export const ProductLoader = () => (
  <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center">
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="relative w-16 h-16"
    >
      <div className="absolute inset-0 border-4 border-[#FFD700] rounded-full" />
      <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-ping" />
    </motion.div>
    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-6 italic">
      Fetching ABST Excellence...
    </p>
  </div>
);