"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FiBox, 
  FiUsers, 
  FiMessageSquare, 
  FiShoppingBag, 
  FiBarChart2, 
  FiSettings,
  FiArrowRight 
} from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

// Define the interface for the module cards
interface AdminModule {
  title: string;
  desc: string;
  icon: React.ReactElement<IconBaseProps>; 
  link: string;
  color: string;
}

const AdminHomeUi = () => {
  // The 6 main modules for ABST Global
  const adminModules: AdminModule[] = [
    {
      title: "Product Inventory",
      desc: "Manage stock, prices, and phone specs.",
      icon: <FiBox />,
      link: "/admin/add-product",
      color: "bg-blue-600"
    },

    {
      title: "Sales & Orders",
      desc: "Track purchases and layaway plans.",
      icon: <FiShoppingBag />,
      link: "/admin/orders",
      color: "bg-green-600"
    },

    {
      title: "Analytics",
      desc: "View site traffic and revenue growth.",
      icon: <FiBarChart2 />,
      link: "/admin/analytics",
      color: "bg-orange-500"
    },

    {
      title: "Customer Complaints",
      desc: "Review and reply to support tickets.",
      icon: <FiMessageSquare />,
      link: "/admin/complains",
      color: "bg-red-600"
    },

    {
      title: "News Letter Subs",
      desc: "View and manage News-Letter subscribers.",
      icon: <FiUsers />,
      link: "/admin/news-letter",
      color: "bg-purple-600"
    },

    {
      title: "Site Settings",
      desc: "Update banners, FAQs, and contact info.",
      icon: <FiSettings />,
      link: "/admin/settings",
      color: "bg-slate-700"
    }
  ];

  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Listen to the counter document in real-time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "admin_metadata", "counters"), (docSnap) => {
      if (docSnap.exists()) {
        setUnreadCount(docSnap.data().unreadComplaints || 0);
      }
    });
    return () => unsub();
  }, []);

  // 2. Function to reset the count to 0 when Admin clicks the card
  const resetNotificationCount = async () => {
    try {
      await updateDoc(doc(db, "admin_metadata", "counters"), {
        unreadComplaints: 0
      });
    } catch (err) {
      console.error("Failed to reset bubble", err);
    }
  };

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-12 pb-10 px-5 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-5xl font-black uppercase italic text-[#0B2A4A] tracking-tighter">
              Admin <span className="text-blue-600">Hub</span>
            </h1>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
              ABST Global Concept / Management Terminal
            </p>
          </motion.div>
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module, index) => (
            <Link 
              key={index} 
              href={module.link}
              onClick={module.title === "Customer Complaints" ? resetNotificationCount : undefined}
            >
              <motion.div
                whileHover={{ y: -8 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-xl p-8 shadow-xl border border-gray-100 group relative overflow-hidden h-full flex flex-col"
              >
                {/* Notification Bubble - Only for Complaints */}
                {module.title === "Customer Complaints" && unreadCount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg animate-bounce z-10">
                    {unreadCount}
                  </div>
                )}

                {/* Decorative Ghost Icon */}
                <div className="absolute -right-6 -bottom-6 text-[#0B2A4A] opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                   {React.cloneElement(module.icon, { size: 140 } as IconBaseProps)}
                </div>

                {/* Card Icon Header */}
                <div className={`${module.color} w-14 h-14 rounded-lg flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/10`}>
                  {React.cloneElement(module.icon, { size: 28 } as IconBaseProps)}
                </div>

                <h3 className="text-lg font-black uppercase text-[#0B2A4A] mb-3 tracking-tight group-hover:text-blue-600 transition-colors">
                  {module.title}
                </h3>
                
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-10 flex-1 uppercase tracking-wider">
                  {module.desc}
                </p>

                <div className="flex items-center gap-2 text-[#0B2A4A] font-black text-[9px] uppercase tracking-[0.2em] border-t border-gray-50 pt-4">
                  Manage Now <FiArrowRight className="group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* System Footer */}
        <div className="mt-20 flex flex-col items-center">
            <div className="h-[1px] w-20 bg-gray-200 mb-6" />
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-300">
                ABST Global Concept © 2026 / Internal Admin System
            </p>
        </div>
      </div>
    </div>
  );
};

export default AdminHomeUi;