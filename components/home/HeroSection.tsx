// "use client";

// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import Image from 'next/image';
// import Link from 'next/link';
// import { products, Product } from '@/types';

// // ✅ Utility to determine if text should be black or white based on background color
// const getContrastColor = (hexColor: string) => {
//   if (!hexColor) return '#ffffff';
//   const color = hexColor.replace('#', '');
//   const r = parseInt(color.substring(0, 2), 16);
//   const g = parseInt(color.substring(2, 4), 16);
//   const b = parseInt(color.substring(4, 6), 16);
//   const brightness = (r * 299 + g * 587 + b * 114) / 1000;
//   return brightness > 128 ? '#1A1A1A' : '#ffffff'; 
// };

// const HeroSection = () => {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [selectedColors, setSelectedColors] = useState<{ [key: number]: number }>({});
//   const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
//   const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
//   const idleTimer = useRef<NodeJS.Timeout | null>(null);

//   const heroProducts = products.filter(product => product.isHero === true);
//   const currentPhone = heroProducts[currentIndex];
//   const activeColorIndex = selectedColors[currentPhone?.id] || 0;
  
//   const hasMultipleVariants = currentPhone?.thumbnails && currentPhone.thumbnails.length > 0;
//   const activeVariant = hasMultipleVariants ? currentPhone.thumbnails![activeColorIndex] : null;

//   const displayImage = activeVariant ? activeVariant.imageUrl : currentPhone?.thumbnails[0].imageUrl;
//   const rawColor = activeVariant ? activeVariant.colorCode : '#3b82f6';

//   const isWhite = rawColor.toLowerCase() === '#ffffff' || rawColor.toLowerCase() === '#fff';
//   const themeColor = isWhite ? '#8B5CF6' : rawColor;

//   // ✅ Contrast Logic
//   const contrastText = getContrastColor(themeColor);
//   const primaryTextVisibility = contrastText === '#1A1A1A' ? '#1A1A1A' : themeColor;

//   const resetIdleTimer = () => {
//     setIsAutoPlaying(false);
//     stopAutoPlay();
//     if (idleTimer.current) clearTimeout(idleTimer.current);
//     idleTimer.current = setTimeout(() => setIsAutoPlaying(true), 60000);
//   };

//   const startAutoPlay = () => {
//     stopAutoPlay();
//     autoPlayTimer.current = setInterval(() => {
//       setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
//     }, 8000);
//   };

//   const stopAutoPlay = () => {
//     if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
//   };

//   useEffect(() => {
//     if (isAutoPlaying && heroProducts.length > 0) startAutoPlay();
//     return () => stopAutoPlay();
//   }, [isAutoPlaying, heroProducts.length]);

//   if (heroProducts.length === 0) return null;

//   return (
//     <section className="mx-auto md:px-[10rem] md:pt-8 relative w-full min-h-screen overflow-hidden bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-center items-center transition-colors duration-1000">
      
//       {/* BACKGROUND LAYER */}
//       <div className="absolute inset-0 z-0">
//         <motion.div 
//           animate={{ background: `radial-gradient(circle at 50% 50%, ${themeColor}15 0%, transparent 70%)` }}
//           className="absolute inset-0 opacity-60 transition-colors duration-1000"
//         />
//         <div 
//           className="absolute bottom-0 w-full h-1/2 transition-colors duration-1000"
//           style={{ 
//             perspective: '1000px', 
//             transform: 'rotateX(60deg)',
//             backgroundImage: `
//               linear-gradient(to right, ${themeColor}15 1px, transparent 1px),
//               linear-gradient(to bottom, ${themeColor}15 1px, transparent 1px)
//             `,
//             backgroundSize: '35px_35px',
//             maskImage: 'radial-gradient(ellipse 60% 50% at 50% 100%, #000 70%, transparent 100%)',
//             WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 100%, #000 70%, transparent 100%)'
//           }} 
//         />
//       </div>

//       <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-center items-center min-h-screen">
//         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-center flex-grow py-4 md:py-20">
          
//           {/* LEFT CONTENT */}
//           <div className="lg:col-span-5 pt-24 pb-4 md:py-6 flex flex-col justify-center text-center md:text-left z-20">
//             <AnimatePresence mode="wait">
//               <motion.div
//                 key={`${currentPhone.id}-${activeColorIndex}`}
//                 initial={{ opacity: 0, x: -20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -10 }}
//                 transition={{ duration: 0.5 }}
//               >
//                 <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
//                   <span className="h-[2px] w-8 transition-colors duration-500" style={{ backgroundColor: themeColor }} />
//                   <span className="text-[11px] uppercase tracking-[0.4em] font-bold transition-colors duration-500" style={{ color: primaryTextVisibility }}>
//                     {activeVariant ? activeVariant.colorName : 'A.B.S.T Global Concept'}
//                   </span>
//                 </div>
                
//                 <h1 className="text-3xl md:text-7xl font-bold mb-4 tracking-tighter leading-tight text-[#1A1A1A]">
//                   {currentPhone.name.split(' ').map((word, i) => (
//                     <span 
//                       key={i} 
//                       className={`${i === 0 ? "text-[#1A1A1A]" : "text-[#1A1A1A]/30 font-light"} inline-block mr-2`}
//                       style={i === 0 ? { color: primaryTextVisibility } : {}}
//                     >
//                       {word}
//                     </span>
//                   ))}
//                 </h1>

//                 {/* ✅ DYNAMIC RAM & SSD PILLS */}
//                 {(currentPhone.ram || currentPhone.storage) && (
//                   <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
//                     {currentPhone.ram && (
//                       <span 
//                         className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors duration-500"
//                         style={{ 
//                           backgroundColor: `${themeColor}`, // 10% Opacity of theme color
//                           borderColor: `${themeColor}80`,
//                           color: contrastText 
//                         }}
//                       >
//                         RAM: {currentPhone.ram}
//                       </span>
//                     )}
//                     {currentPhone.storage && currentPhone.storage.length > 0 && (
//                       <span 
//                         className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors duration-500"
//                         style={{ 
//                             backgroundColor: `${themeColor}`, 
//                             borderColor: `${themeColor}80`,
//                             color: contrastText 
//                         }}
//                       >
//                         SSD: {currentPhone.storage[0]}
//                       </span>
//                     )}
//                   </div>
//                 )}

//                 <p className="hidden md:block text-base text-[#1A1A1A]/60 max-w-sm mb-6 leading-relaxed">
//                   {currentPhone.description}
//                 </p>

//                 <div className="flex flex-col gap-4 items-center justify-center md:justify-start">
//                   <div className="text-2xl md:text-3xl font-bold transition-colors duration-500" style={{ color: primaryTextVisibility }}>
//                     <span className="text-sm mr-1 opacity-40">$</span>{currentPhone.price.toLocaleString()}
//                   </div>
                  
//                   <div className='flex flex-row gap-2 justify-between items-center'>
//                     <Link href={`/product/${currentPhone.id}`}>
//                       <motion.button 
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         className="w-38 px-4 py-4 text-xs font-black rounded-lg uppercase tracking-widest transition-all shadow-xl shadow-black/10"
//                         style={{ backgroundColor: themeColor, color: contrastText }}
//                       >
//                         Explore 
//                       </motion.button>
//                     </Link>

//                     <Link href="/store">
//                       <motion.button 
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         className="w-38 px-2 py-4 border bg-[#ffff] text-black text-xs font-black rounded-lg uppercase tracking-widest transition-all shadow-xl shadow-black/10"
//                       >
//                         Visit Our Store 
//                       </motion.button>
//                     </Link>
//                   </div>
//                 </div>
//               </motion.div>
//             </AnimatePresence>
//           </div>

//           {/* CENTER IMAGE */}
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={displayImage}
//               initial={{ opacity: 0, scale: 0.95 }}
//               animate={{ 
//                 opacity: 1, 
//                 scale: 1,
//                 y: [0, -12, 0],
//               }}
//               exit={{ opacity: 0, scale: 1.05 }}
//               transition={{ 
//                 opacity: { duration: 0.6 },
//                 scale: { duration: 0.6 },
//                 y: { duration: 6, repeat: Infinity, ease: "easeInOut" } 
//               }}
//               className="mx-auto lg:col-span-7 relative flex items-center justify-center w-[18rem] md:max-w-[25rem] h-[450px] md:h-[450px]"
//             >
//               <div className="relative w-full h-full" >
//                 <div 
//                   className="relative w-full h-full bg-white/40 backdrop-blur-md rounded-2xl border-4 border-white/80 shadow-2xl overflow-hidden flex items-center justify-center"
//                   style={{ borderColor: `${themeColor}20` }}
//                 >
//                   <Image 
//                     src={displayImage} 
//                     alt={currentPhone.name} 
//                     fill 
//                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                     className="object-cover drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]" 
//                     priority 
//                   />
//                 </div>
//               </div>
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* BOTTOM SECTION */}
//         <div className="pb-8 flex flex-col items-center space-y-4 z-20">
//           {hasMultipleVariants && (
//             <motion.div 
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               className="flex md:flex-col flex-row space-x-4 md:space-x-0 md:space-y-4 p-2.5 bg-white/50 backdrop-blur-md rounded-lg border border-black/5 shadow-sm md:absolute md:right-10 md:top-1/2 md:-translate-y-1/2"
//             >
//               {currentPhone.thumbnails!.map((thumb, idx) => (
//                 <button
//                   key={thumb.id}
//                   onClick={() => {
//                     setSelectedColors(prev => ({ ...prev, [currentPhone.id]: idx }));
//                     resetIdleTimer();
//                   }}
//                   className={`w-6 h-6 md:w-5 md:h-5 rounded-full transition-all duration-300 relative ${
//                     activeColorIndex === idx ? 'scale-125' : 'opacity-40 hover:opacity-100'
//                   }`}
//                   style={{ 
//                     backgroundColor: thumb.colorCode,
//                     boxShadow: activeColorIndex === idx ? `0 0 15px ${thumb.colorCode}60` : 'none'
//                   }}
//                   title={thumb.colorName}
//                 />
//               ))}
//             </motion.div>
//           )}

//           <div className="flex items-center space-x-3 px-4 py-3 bg-white/80 backdrop-blur-3xl rounded-lg border border-black/5 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-hide">
//             {heroProducts.map((product, index) => (
//               <motion.button
//                 key={product.id}
//                 onClick={() => {
//                   setCurrentIndex(index);
//                   resetIdleTimer();
//                 }}
//                 className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all duration-500 border-2 ${
//                   currentIndex === index 
//                     ? 'w-28 md:w-32 shadow-xl' 
//                     : 'opacity-70 hover:opacity-100 grayscale hover:grayscale-0 border-transparent'
//                 }`}
//                 style={{ 
//                   borderColor: currentIndex === index ? themeColor : 'transparent' 
//                 }}
//               >
//                 <div className="relative w-10 h-15 flex items-center justify-center p-2">
//                   <Image src={product.thumbnails[0].imageUrl} alt={product.name} fill className="object-fill p-2" />
//                 </div>
//                 {currentIndex === index && (
//                   <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/40 to-transparent flex items-end justify-center pb-2 px-2">
//                     <span className="text-[10px] font-black uppercase tracking-tighter truncate" style={{ color: themeColor }}>
//                       {product.name}
//                     </span>
//                   </div>
//                 )}
//               </motion.button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default HeroSection;

"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ✅ Utility to determine if text should be black or white based on background color
const getContrastColor = (hexColor: string) => {
  if (!hexColor) return '#ffffff';
  const color = hexColor.replace('#', '');
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#1A1A1A' : '#ffffff'; 
};

const HeroSection = () => {
  const [heroProducts, setHeroProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedColors, setSelectedColors] = useState<{ [key: string]: number }>({});
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // ✅ REAL-TIME BACKEND FETCH
  useEffect(() => {
    const q = query(collection(db, "products"), where("isHero", "==", true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by newest and take top 5
      const sorted = docs.sort((a: any, b: any) => {
        const timeA = a.serverTimestamp?.seconds || 0;
        const timeB = b.serverTimestamp?.seconds || 0;
        return timeB - timeA;
      }).slice(0, 5);

      setHeroProducts(sorted);
    });
    return () => unsubscribe();
  }, []);

  const currentPhone = heroProducts[currentIndex];
  const activeColorIndex = selectedColors[currentPhone?.id] || 0;
  
  const activeVariant = currentPhone?.variants?.[activeColorIndex] || currentPhone?.variants?.[0];

  const displayImage = activeVariant?.images?.[0]?.url || '';
  const rawColor = activeVariant?.colorCode || '#3b82f6';

  const isWhite = rawColor.toLowerCase() === '#ffffff' || rawColor.toLowerCase() === '#fff';
  const themeColor = isWhite ? '#8B5CF6' : rawColor;

  const contrastText = getContrastColor(themeColor);
  const primaryTextVisibility = contrastText === '#1A1A1A' ? '#1A1A1A' : themeColor;

  const resetIdleTimer = () => {
    setIsAutoPlaying(false);
    stopAutoPlay();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsAutoPlaying(true), 60000);
  };

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, 8000);
  };

  const stopAutoPlay = () => {
    if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
  };

  useEffect(() => {
    if (isAutoPlaying && heroProducts.length > 0) startAutoPlay();
    return () => stopAutoPlay();
  }, [isAutoPlaying, heroProducts.length]);

  if (heroProducts.length === 0) return null;

  return (
    <section className="mx-auto md:px-[10rem] md:pt- relative w-full min-h-screen overflow-hidden bg-[#F8F9FA] text-[#1A1A1A] flex flex-col justify-center items-center transition-colors duration-1000">
      
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          animate={{ background: `radial-gradient(circle at 50% 50%, ${themeColor}15 0%, transparent 70%)` }}
          className="absolute inset-0 opacity-60 transition-colors duration-1000"
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col justify-center items-center min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-center flex-grow py-4 md:py-20">
          
          {/* LEFT CONTENT */}
          <div className="lg:col-span-5 pt-24 pb-4 md:py-6 flex flex-col justify-center text-center md:text-left z-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentPhone.id}-${activeColorIndex}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                  <span className="h-[2px] w-8 transition-colors duration-500" style={{ backgroundColor: themeColor }} />
                  <span className="text-[11px] uppercase tracking-[0.4em] font-bold transition-colors duration-500" style={{ color: primaryTextVisibility }}>
                    {activeVariant?.colorName || 'A.B.S.T Global Concept'}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-7xl font-bold mb-4 tracking-tighter leading-tight text-[#1A1A1A]">
                  {currentPhone.name.split(' ').map((word: string, i: number) => (
                    <span 
                      key={i} 
                      className={`${i === 0 ? "text-[#1A1A1A]" : "text-[#1A1A1A]/30 font-light"} inline-block mr-2`}
                      style={i === 0 ? { color: primaryTextVisibility } : {}}
                    >
                      {word}
                    </span>
                  ))}
                </h1>

                {(activeVariant?.ram || activeVariant?.rom) && (
                  <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                    {activeVariant.ram && (
                      <span className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-black/5 bg-white shadow-sm transition-colors duration-500">
                        RAM: {activeVariant.ram}
                      </span>
                    )}
                    {activeVariant.rom && (
                      <span className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-black/5 bg-white shadow-sm transition-colors duration-500">
                        SSD: {activeVariant.rom}
                      </span>
                    )}
                  </div>
                )}

                <p className="hidden md:block text-base text-[#1A1A1A]/60 max-w-sm mb-6 leading-relaxed">
                  {currentPhone.description}
                </p>

                <div className="flex flex-col gap-4 items-center justify-center md:justify-start">
                  <div className="text-2xl md:text-3xl font-bold transition-colors duration-500" style={{ color: primaryTextVisibility }}>
                    <span className="text-sm mr-1 opacity-40">₦</span>{activeVariant?.price?.toLocaleString() || currentPhone.price?.toLocaleString()}
                  </div>
                  
                  <div className='flex flex-row gap-2 justify-between items-center'>
                    <Link href={`/product/${currentPhone.id}`}>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 text-xs font-black rounded-lg uppercase tracking-widest transition-all shadow-xl shadow-black/10"
                        style={{ backgroundColor: themeColor, color: contrastText }}
                      >
                        Explore 
                      </motion.button>
                    </Link>

                    <Link href="/store">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-4 border bg-white text-black text-xs font-black rounded-lg uppercase tracking-widest transition-all shadow-xl shadow-black/10"
                      >
                        Store 
                      </motion.button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CENTER IMAGE */}
          <div className="mx-auto lg:col-span-7 relative flex items-center justify-center w-full w-full md:max-w-[28rem] h-[400px] md:h-[450px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={displayImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -12, 0],
                }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ 
                  opacity: { duration: 0.6 },
                  scale: { duration: 0.6 },
                  y: { duration: 6, repeat: Infinity, ease: "easeInOut" } 
                }}
                className="relative w-full h-full"
              >
                <div 
                  className="relative w-full h-full bg-white/40 backdrop-blur-md rounded-2xl border-4 border-white/80 shadow-2xl overflow-hidden flex items-center justify-center"
                  style={{ borderColor: `${themeColor}20` }}
                >
                  <Image 
                    src={displayImage} 
                    alt={currentPhone.name} 
                    fill 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.2)]" 
                    priority 
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="pb-8 flex flex-col items-center space-y-4 z-20">
          {currentPhone?.variants?.length > 1 && (
            <motion.div className="flex md:flex-col flex-row gap-4 p-2.5 bg-white/50 backdrop-blur-md rounded-lg border border-black/5 shadow-sm md:absolute md:right-10 md:top-1/2 md:-translate-y-1/2">
              {currentPhone.variants.map((v: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedColors(prev => ({ ...prev, [currentPhone.id]: idx }));
                    resetIdleTimer();
                  }}
                  className={`w-6 h-6 md:w-5 md:h-5 rounded-full transition-all duration-300 ${activeColorIndex === idx ? 'scale-125' : 'opacity-40 hover:opacity-100'}`}
                  style={{ 
                    backgroundColor: v.colorCode,
                    boxShadow: activeColorIndex === idx ? `0 0 0 2px #F8F9FA, 0 0 0 4px ${v.colorCode}` : 'none'
                  }}
                />
              ))}
            </motion.div>
          )}

          <div className="flex items-center space-x-3 px-4 py-3 bg-white/80 backdrop-blur-3xl rounded-lg border border-black/5 shadow-2xl max-w-[95vw] overflow-x-auto scrollbar-hide">
            {heroProducts.map((product, index) => (
              <motion.button
                key={product.id}
                onClick={() => {
                  setCurrentIndex(index);
                  resetIdleTimer();
                }}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-500 border-2 ${
                  currentIndex === index ? 'w-32 shadow-xl' : 'opacity-70 border-transparent'
                }`}
                style={{ borderColor: currentIndex === index ? themeColor : 'transparent' }}
              >
                <Image src={product.variants?.[0]?.images?.[0]?.url || ''} alt={product.name} fill className="object-contain p-2" />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;