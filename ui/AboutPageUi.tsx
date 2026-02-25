"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTarget, FiAward, FiShield, FiTrendingUp, FiMail, FiPhone } from 'react-icons/fi';

// EDIT THESE URLS TO CHANGE YOUR SLIDER IMAGES
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?q=80&w=2000",
  "https://img.freepik.com/free-photo/hand-holding-mobile-phones-isolated_53876-148191.jpg",
  "https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=2000"
];

const AboutPageUi = () => {
  const [currentImage, setCurrentImage] = useState(0);

  // Interval logic for image switching (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { label: 'Devices Delivered', value: '10k+', icon: <FiAward /> },
    { label: 'Happy Clients', value: '8k+', icon: <FiTarget /> },
    { label: 'Years Experience', value: '5+', icon: <FiTrendingUp /> },
    { label: 'Secure Partners', value: '100%', icon: <FiShield /> },
  ];

  return (
    <div className="bg-[#F5F5F5] min-h-screen pt-24 pb-20">
      {/* 1. Hero Section with Auto-Slider */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl bg-[#0B2A4A]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image 
                src={HERO_IMAGES[currentImage]} 
                alt="ABST Tech Hero" 
                fill 
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover brightness-[0.4]"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter"
            >
              Defining the <span className="text-yellow-400">ABST Standard</span>
            </motion.h1>
            <p className="text-white/80 mt-4 max-w-2xl text-xs md:text-sm font-bold uppercase tracking-[0.3em]">
              Excellence in Mobile Technology & Digital Lifestyle
            </p>
            
            {/* Slider Indicators */}
            <div className="flex gap-2 mt-8">
              {HERO_IMAGES.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 transition-all duration-500 rounded-full ${i === currentImage ? 'w-8 bg-yellow-400' : 'w-2 bg-white/30'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Journey (Story) */}
      <section className="max-w-5xl mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-black uppercase italic text-[#0B2A4A] mb-6">
              Our <span className="text-blue-600">Journey</span>
            </h2>
            <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
              <p>
                Founded with a vision to bridge the gap between premium technology and accessibility, 
                <span className="font-bold text-[#0B2A4A]"> ABST Global Concept</span> began as a passion project for excellence.
              </p>
              <p>
                From our first delivery to becoming a trusted name in luxury mobile retail, we have remained committed 
                to providing not just gadgets, but a lifestyle. Our specialized 
                <span className="text-blue-600 font-bold"> Layaway Plans</span> were born from the desire to ensure 
                everyone can own the future of technology without financial strain.
              </p>
            </div>
          </div>
          <div className="relative h-80 rounded-xl overflow-hidden shadow-xl border-4 border-white">
            <Image 
                src="https://images.unsplash.com/photo-1491933382434-500287f9b54b?q=80&w=1000" 
                alt="Tech Evolution" 
                fill 
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* 3. Stats Section */}
      <section className="bg-[#0B2A4A] py-16 mb-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-yellow-400 text-3xl mb-3 flex justify-center">{stat.icon}</div>
              <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CEO Section */}
      <section className="max-w-6xl mx-auto px-6 mb-24">
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center gap-12 border border-gray-100">
          <div className="relative w-64 h-80 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl grayscale hover:grayscale-0 transition-all duration-500">
            <Image 
              src="/abst_ceo.png" 
              alt="CEO of ABST Global" 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0B2A4A] to-transparent p-4">
               <p className="text-yellow-400 text-center font-black uppercase text-[10px] tracking-widest rounded p-1 bg-[rgba(11,42,74,0.8)]">Motto: Hardwork & Trust</p>
            </div>
          </div>
          
          <div className="flex-1">
            <span className="text-yellow-500 font-black uppercase text-[10px] tracking-widest">Leadership Note</span>
            <h2 className="text-3xl font-black uppercase italic text-[#0B2A4A] mt-2 mb-6">
              Empowering <span className="text-blue-600">Innovators</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed italic mb-8">
              "At ABST, we don't just sell phones. We provide the tools for the next generation of African 
              innovators, developers, and entrepreneurs. Our goal is to make high-end technology a standard, 
              not a luxury, through integrity and customer-centric financing."
            </p>
            
            <div className="flex flex-col space-y-3 border-l-2 border-yellow-400 pl-6">
              <div>
                <span className="font-black text-[#0B2A4A] uppercase text-xs block">The CEO</span>
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">ABST Global Concept</span>
                <span className='block font-black'>Mr. John Doe</span>
              </div>
              
              <div className="flex flex-col space-y-1 pt-2">
                <a 
                  href="mailto:ceo@abstglobal.com" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FiMail size={12} className="text-blue-500" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">ceo@abstglobal.com</span>
                </a>
                <a 
                  href="tel:+234800ABSTGLOBAL" 
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <FiPhone size={12} className="text-blue-500" />
                  <span className="text-[11px] font-bold uppercase tracking-tight">+234 (0) 800 ABST GLOBAL</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Core Values */}
      <section className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-black uppercase italic text-[#0B2A4A] mb-12">Core <span className="text-blue-600">Values</span></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Authenticity', desc: 'Every device is verified and 100% original from global manufacturers.' },
            { title: 'Security', desc: 'Your data and payments are protected by the highest digital standards.' },
            { title: 'Innovation', desc: 'Staying ahead with the latest releases from Xiaomi, Oppo, OnePlus and more.' },
          ].map((v, i) => (
            <div key={i} className="p-8 bg-white rounded-xl shadow-lg border-b-4 border-yellow-400">
              <h3 className="text-[#0B2A4A] font-black uppercase text-xs mb-3 tracking-widest">{v.title}</h3>
              <p className="text-gray-500 text-[11px] leading-relaxed uppercase font-medium">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='py-20 flex flex-col justify-center items-center'>
        <p className='text-gray-400 font-bold underline'>Registered&reg;</p>
        <Image
          src="https://www.234deals.com/product/ZufNl8CgLe_Screenshot_20241012-135606.jpg" 
          alt="Registered Logo"
          width={350}
          height={500} 
        />
      </div>
    </div>
  );
};

export default AboutPageUi;