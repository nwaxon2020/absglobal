'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiShoppingCart, FiAward, FiShield, FiTruck, FiMessageCircle } from 'react-icons/fi';
import { products } from '@/types';
import { useCart } from '@/components/CartContext';
import toast from 'react-hot-toast';

// Dynamic WhatsApp number - you can change this
const WHATSAPP_NUMBER = "2347034632037"; // Format: country code without +
const WHATSAPP_MESSAGE = "Hello, I'm interested in your mobile phones";

const PromoSection = () => {
  const { addToCart } = useCart();
  // Filter products to only show those with isPromo: true
  const promoItems = products.filter(product => product.isPromo === true);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    // Logic Fix: Prevent navigation when clicking cart
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  // Don't render if there are no promo products
  if (promoItems.length === 0) {
    return null;
  }

  return (
    <section className="py-16 relative overflow-hidden">
      {/* Background with business card theme - dark blue gradient */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #0B2A4A 0%, #1A3B5C 50%, #0F2B44 100%)'
        }}
      >
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>
        
        {/* Grid lines like on business card */}
        <div className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-1.5 lg:px-12 relative z-10">
        {/* Original Header with business card colors */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="text-white">Special </span>
            <span className="text-yellow-400">Offers</span>
          </h2>
          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
            Be the first to get your hands on the newest smartphones with cutting-edge technology
          </p>
        </motion.div>
        
        {/* WhatsApp Button - Dynamic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl md:rounded-full font-semibold flex items-center space-x-2 shadow-lg transition-colors"
          >
            <FiMessageCircle size={20} />
            <span>WhatsApp Us</span>
          </motion.button>
        </motion.div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-8">
          {promoItems.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="bg-white/95 backdrop-blur-sm   rounded md:rounded-xl shadow-xl overflow-hidden group border border-blue-200/20 hover:border-yellow-400/50 transition-all duration-300"
              style={{
                boxShadow: '0 10px 30px -15px rgba(0,0,0,0.5)'
              }}
            >
              <Link href={`/product/${product.id}`}>
                <div className="relative h-48 md:h-[280px] bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    // Logic Fix: using thumbnails array
                    src={product.thumbnails[0].imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition duration-300"
                  />
                  {product.originalPrice && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-blue-900 px-2 py-1 rounded-full text-xs font-bold">
                      SALE
                    </span>
                  )}
                </div>
              </Link>
              
              <div className="p-3 bg-white">
                <Link href={`/product/${product.id}`}>
                  <h3 className="font-bold text-sm md:text-base mb-1 text-blue-900 hover:text-yellow-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <div className='flex flex-col'>
                    {product.originalPrice && (
                      <span className="ml-1 text-xs text-gray-400 line-through">
                        ₦{product.originalPrice.toLocaleString()}
                      </span>
                    )}

                    <span className="md:text-lg font-bold text-blue-900">
                      ₦{product.price.toLocaleString()}
                    </span>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleAddToCart(e, product)}
                    className="bg-gradient-to-r from-blue-800 to-blue-900 text-white p-2 rounded-lg hover:from-yellow-500 hover:to-yellow-600 hover:text-blue-900 transition-all duration-300"
                    title="Add to cart"
                  >
                    <FiShoppingCart size={18} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Delivery Part Section with blur borderline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 relative"
        >
          {/* Blur borderline */}
          <div className="absolute -top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent blur-sm"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FiAward, text: '100% Authentic', color: 'text-yellow-400' },
              { icon: FiShield, text: '1 Year Warranty', color: 'text-blue-300' },
              { icon: FiTruck, text: 'Free Delivery', color: 'text-green-400' },
              { icon: FiShoppingCart, text: 'Easy Returns', color: 'text-purple-300' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10"
                >
                  <Icon className={`${item.color} text-2xl mx-auto mb-1`} />
                  <p className="text-white text-sm">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoSection;