'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FiShoppingCart, FiAward, FiShield, FiTruck, 
  FiMessageCircle, FiRefreshCw, FiStar, FiCheckCircle 
} from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/components/CartContext';
import toast from 'react-hot-toast';

// Dynamic WhatsApp message
const WHATSAPP_MESSAGE = "Hello, I saw your product listings on *A.B.S.T GLOBAL CONCEPT WEBSITE* and am interested in your products. Could you please provide more details about the offers and how I can make a purchase? Thank you!";

interface PromoProduct {
  id: string;
  name: string;
  description: string;
  isPromo: boolean;
  promoOldPrice?: number;
  serverTimestamp?: any;
  variants: Array<{
    colorName: string;
    colorCode: string;
    price: number;
    images: Array<{
      url: string;
    }>;
  }>;
}

const PromoSection = () => {
  const { addToCart } = useCart();
  const [promoItems, setPromoItems] = useState<PromoProduct[]>([]);
  const [legalCards, setLegalCards] = useState<any[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    // 1. Fetch Legal Hub "What We Do" Cards from "legalAndHelp"
    const fetchLegalCards = async () => {
      const docRef = doc(db, "siteContent", "legalAndHelp");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLegalCards(docSnap.data().whatWeDo || []);
      }
    };
    fetchLegalCards();

    // 2. Fetch WhatsApp Number from "globalSettings" (Contact Editor)
    const fetchSettings = async () => {
      const docRef = doc(db, "siteContent", "globalSettings");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setWhatsappNumber(docSnap.data().contactPhone || "");
      }
    };
    fetchSettings();

    // 3. Fetch Promo Products (Strictly those with isPromo: true)
    const q = query(
      collection(db, "products"), 
      where("isPromo", "==", true)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setPromoItems([]);
        return;
      }
      
      const products = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          isPromo: data.isPromo || false,
          promoOldPrice: data.promoOldPrice,
          serverTimestamp: data.serverTimestamp,
          variants: Array.isArray(data.variants) ? data.variants.map((v: any) => ({
            colorName: v.colorName || '',
            colorCode: v.colorCode || '#000000',
            price: Number(v.price) || 0,
            images: Array.isArray(v.images) ? v.images.map((img: any) => ({
              url: img.url || ''
            })) : []
          })) : []
        };
      });
      
      // Filter for products that HAVE an old price, then sort by newest
      const validPromoProducts = products
        .filter(p => p.promoOldPrice && Number(p.promoOldPrice) > 0)
        .sort((a, b) => {
          const timeA = a.serverTimestamp?.seconds || 0;
          const timeB = b.serverTimestamp?.seconds || 0;
          return timeB - timeA;
        })
        .slice(0, 4);
      
      setPromoItems(validPromoProducts);
    });

    return () => unsubscribe();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'shield': return <FiShield />;
      case 'award': return <FiAward />;
      case 'truck': return <FiTruck />;
      case 'refresh': return <FiRefreshCw />;
      case 'star': return <FiStar />;
      default: return <FiCheckCircle />;
    }
  };

  const handleAddToCart = (e: React.MouseEvent, product: PromoProduct) => {
    e.preventDefault();
    e.stopPropagation();
    const firstVariant = product.variants[0];
    if (!firstVariant) return;
    
    addToCart({ 
      id: product.id,
      name: product.name,
      price: firstVariant.price,
      quantity: 1,
      image: firstVariant.images[0]?.url || '',
      colorName: firstVariant.colorName,
      colorCode: firstVariant.colorCode
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleWhatsAppClick = () => {
    // Ensure we use the dynamic number, defaulting to your provided one if empty
    const finalNumber = whatsappNumber || "2347034632037";
    const url = `https://wa.me/${finalNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank');
  };

  if (promoItems.length === 0) return null;

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(135deg, #0B2A4A 0%, #1A3B5C 50%, #0F2B44 100%)' }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="max-w-7xl mx-auto px-1.5 lg:px-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-8">
          <h2 className="text-3xl font-bold text-center mb-4">
            <span className="text-white">Special </span>
            <span className="text-yellow-400">Offers</span>
          </h2>

          <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
            Be the first to get your hands on the newest smartphones with cutting-edge technology
          </p>
        </motion.div>
        
        <div className="flex justify-center mb-8">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleWhatsAppClick} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl md:rounded-full font-semibold flex items-center space-x-2 shadow-lg transition-colors">
            <FiMessageCircle size={20} />
            <span>WhatsApp CEO</span>
          </motion.button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-8">
          {promoItems.map((product, index) => {
            const firstVariant = product.variants?.[0];
            const productImage = firstVariant?.images[0]?.url || '';
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="bg-white rounded md:rounded-xl overflow-hidden shadow-2xl group border border-blue-200/20 hover:border-yellow-400/50 transition-all duration-300"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="relative h-48 md:h-[300px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                    <Image
                      src={productImage || "/logo2.png"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition duration-300"
                    />
                    <span className="absolute top-2 left-2 bg-yellow-500 text-blue-900 px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter shadow-lg">
                      Save Now
                    </span>
                    
                    {/* Color dots - positioned to the left */}
                    {product.variants.length > 0 && (
                      <div className="absolute bottom-2 left-2 transform flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-lg border border-white/20">
                        {product.variants.slice(0, 3).map((variant, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: variant.colorCode }} title={variant.colorName}/>
                        ))}
                         {product.variants.length > 3 && (
                            <span className="text-[7px] font-black text-gray-500">+{product.variants.length - 3}</span>
                         )}
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-3 bg-white">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-black text-[12px] md:text-sm mb-1 text-[#0B2A4A] hover:text-blue-600 transition-colors line-clamp-1 uppercase italic leading-tight">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-gray-500 text-[10px] mb-2 line-clamp-1 font-medium truncate uppercase tracking-tighter">
                    {product.variants?.[0]?.colorName || product.description}
                  </p>
                  
                  <div className="flex items-end justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className='flex flex-col'>
                      <span className="text-[10px] text-gray-400 line-through font-bold">
                        ₦{Number(product.promoOldPrice).toLocaleString()}
                      </span>
                      <span className="md:text-lg font-black text-red-600">
                        ₦{firstVariant?.price?.toLocaleString()}
                      </span>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleAddToCart(e, product)}
                      className="bg-[#0B2A4A] text-white p-2.5 rounded-lg hover:bg-yellow-400 hover:text-blue-900 transition-all duration-300 shadow-lg"
                    >
                      <FiShoppingCart size={18} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dynamic Support Cards from Legal Hub */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-16 relative">
          <div className="absolute -top-6 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent blur-sm"></div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {legalCards.map((item, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10"
              >
                <div className="text-yellow-400 text-2xl mx-auto mb-1 flex justify-center">
                  {getIcon(item.icon)}
                </div>
                <p className="text-white text-[10px] font-black uppercase tracking-widest leading-tight italic">
                  {item.title}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PromoSection;