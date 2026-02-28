'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  FiMapPin, FiPhone, FiMail, FiClock, 
  FiArrowRight, FiNavigation, FiShare2 
} from 'react-icons/fi';

const LocationPageUi = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Real-time listener to global settings
    const unsubscribe = onSnapshot(doc(db, "siteContent", "globalSettings"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Locating ABST Global...</p>
        </div>
      </div>
    );
  }

  // Logic: Generate Google Maps Embed URL from address string
  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;

  return (
    <div className="bg-[#F8F9FA] min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Header Section */}
        <div className="mb-12 md:mb-20">
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-blue-600 font-black uppercase text-[10px] tracking-[0.4em] mb-4 block"
          >
            Find Our Showroom
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-5xl font-black text-slate-900 uppercase italic tracking-tighter"
          >
            Visit the <span className="text-blue-600">Global</span> Hub
          </motion.h1>
          <p className="text-slate-500 mt-4 max-w-xl text-sm font-medium leading-relaxed">
            Experience the A.B.S.T standard in person. Whether you are picking up a layaway device or browsing our luxury automotive collection, our doors are open.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Address Card */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100">
                  <FiMapPin size={24} />
                </div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Flagship Location</h3>
                <p className="text-xl font-bold text-slate-900 leading-snug mb-6">
                  {settings.address}
                </p>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Get Directions <FiNavigation />
                </a>
              </div>
              <div className="absolute -right-8 -bottom-8 text-slate-50 font-black text-9xl select-none">ABST</div>
            </motion.div>

            {/* Support Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <FiPhone className="text-blue-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Call Support</h4>
                <p className="text-sm font-black text-slate-900">+234 {settings.contactPhone}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <FiMail className="text-blue-600 mb-4" size={20} />
                <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Email Us</h4>
                <p className="text-sm font-black text-slate-900 truncate">{settings.contactEmail}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm md:col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <FiClock className="text-emerald-500" size={20} />
                    <div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-1">Business Hours</h4>
                        <p className="text-xs font-bold text-slate-900">Mon - Sat: 9:00 AM - 6:00 PM</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-tighter">Open Now</div>
              </div>
            </div>

            {/* Social Links from Settings */}
            <div className="flex flex-wrap gap-3 pt-4">
              {settings.socials?.map((social: any, i: number) => (
                <a 
                  key={i} 
                  href={social.url} 
                  target="_blank"
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  {social.platform} <FiArrowRight />
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Interactive Map */}
          <div className="lg:col-span-7 h-[400px] md:h-[650px] sticky top-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full h-full rounded-[xl overflow-hidden shadow-2xl border-6 border-white bg-slate-200"
            >
              <iframe
                title="Google Map Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapUrl}
                className="grayscale hover:grayscale-0 transition-all duration-700"
              />
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LocationPageUi;