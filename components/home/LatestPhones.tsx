'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useCart } from '@/components/CartContext';
import toast from 'react-hot-toast';
import { useRef, useState, useEffect } from 'react';
import { products } from '@/types'; // Changed to import from your existing products file

const LatestPhones = () => {
  const router = useRouter(); // Added router for detail navigation logic
  const { addToCart } = useCart();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Filter to only show products with isLatest: true
  const latestProducts = products.filter(p => p.isLatest === true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkArrows = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        setShowLeftArrow(container.scrollLeft > 20);
        setShowRightArrow(
          container.scrollLeft < container.scrollWidth - container.clientWidth - 20
        );
      }
    };

    checkArrows();
    window.addEventListener('resize', checkArrows);
    
    return () => window.removeEventListener('resize', checkArrows);
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation(); // Logic: Prevents navigating to details page when clicking cart
    addToCart({ ...product, quantity: 1 });
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

      setTimeout(() => {
        if (container) {
          setShowLeftArrow(container.scrollLeft > 20);
          setShowRightArrow(
            container.scrollLeft < container.scrollWidth - container.clientWidth - 20
          );
        }
      }, 300);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      setShowLeftArrow(container.scrollLeft > 20);
      setShowRightArrow(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 20
      );
    }
  };

  // Don't render if there are no latest products
  if (latestProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px- sm:px-4 lg:px-8">
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
            {latestProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={() => router.push(`/product/${product.id}`)} // Logic: card click navigates to details
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
                      // Logic: pulling from thumbnails array
                      src={product.thumbnails[0].imageUrl}
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
                          ₦{product.price.toLocaleString()}
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
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default LatestPhones;