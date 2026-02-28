'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '@/components/CartContext';
import toast from 'react-hot-toast';
import { useRef, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const LatestPhones = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // State for dynamic products
  const [latestProducts, setLatestProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch from Firebase with your logic
  useEffect(() => {
    const q = query(
      collection(db, "products"), 
      where("isLatest", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by serverTimestamp (newest first) and take max 8
      const sorted = productsData.sort((a: any, b: any) => {
        const timeA = a.serverTimestamp?.seconds || 0;
        const timeB = b.serverTimestamp?.seconds || 0;
        return timeB - timeA;
      }).slice(0, 8);

      setLatestProducts(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setShowLeftArrow(container.scrollLeft > 20);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 20
      );
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    // Safely get price and image from variants or top-level
    const price = product.variants?.[0]?.price || product.price || 0;
    const image = product.variants?.[0]?.images?.[0]?.url || "/logo2.png";
    
    addToCart({ ...product, price, image, quantity: 1 });
    toast.success(`${product.name} added to cart!`);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = isMobile ? container.clientWidth * 0.9 : 600; 
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (loading || latestProducts.length === 0) return null;

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-4 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-4">Latest Arrivals</h2>
        <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Be the first to get your hands on the newest smartphones with cutting-edge technology
        </p>
        
        <div className="relative">
          <AnimatePresence>
            {showLeftArrow && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg border border-gray-200"
                style={{ transform: 'translate(-50%, -50%)' }}
              >
                <FiChevronLeft size={24} className="text-gray-700" />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showRightArrow && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 bg-white rounded-full shadow-lg border border-gray-200"
                style={{ transform: 'translate(50%, -50%)' }}
              >
                <FiChevronRight size={24} className="text-gray-700" />
              </motion.button>
            )}
          </AnimatePresence>

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className={`flex gap-4 md:gap-8 overflow-x-auto scroll-smooth px-2 no-scrollbar`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {latestProducts.map((product, index) => {
              // Extract the first variant image
              const productImage = product.variants?.[0]?.images?.[0]?.url || "/logo2.png";
              const productPrice = product.variants?.[0]?.price || product.price || 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  onClick={() => router.push(`/product/${product.id}`)}
                  className={`
                    flex-none cursor-pointer
                    ${isMobile ? 'w-[calc(100%-32px)]' : 'w-[calc(50%-16px)]'}
                    bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-lg md:rounded-2xl overflow-hidden group
                    hover:shadow-xl transition-all duration-300 border border-gray-100
                  `}
                >
                  <div className="grid grid-cols-2 gap-2 md:gap-4 p-2 md:p-6 h-full">
                    <div className="relative h-48 w-full flex items-center justify-center">
                      <Image
                        src={productImage}
                        alt={product.name}
                        fill
                        className="object-contain group-hover:scale-110 transition duration-500 p-2"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                    </div>
                    
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-2">New Arrival</span>
                      <h3 className="text-lg font-bold mb-1 truncate">{product.name}</h3>
                      <p className="text-gray-500 text-xs mb-4 line-clamp-2">{product.description}</p>
                      
                      <div className="flex flex-col md:flex-row gap-4 items-start justify-center md:justify-between mt-auto">
                        <div>
                          <span className="text-xl font-black text-[#1A1A1A]">
                            ₦{Number(productPrice).toLocaleString()}
                          </span>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleAddToCart(e, product)}
                          className="bg-[#1A1A1A] text-white p-3 rounded-md md:rounded-lg hover:bg-black transition-colors"
                        >
                          <FiShoppingCart size={18} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default LatestPhones;