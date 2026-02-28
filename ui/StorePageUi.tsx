'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdSearch, 
  MdShoppingCart, 
  MdStar, 
  MdFavorite, 
  MdFavoriteBorder,
  MdClose,
  MdFilterList,
  MdExpandMore
} from 'react-icons/md';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/components/CartContext';
import InstallmentSection from '@/components/home/InstallmentSection';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

// Theme colors from business card
const theme = {
  primary: '#0B2A4A',
  secondary: '#1A3B5C',
  accent: '#FFD700',
  goldLight: '#c0a418',
  goldDark: '#B8860B',
  text: '#FFFFFF',
  background: '#F5F5F5'
};

interface Product {
  id: string;
  name: string;
  model: string;
  description: string;
  category: 'phone' | 'accessory' | 'laptop' | 'smartwatch' | 'bluetooth' | 'others';
  isHero: boolean;
  isPromo: boolean;
  isLatest: boolean;
  promoOldPrice?: number;
  rating: number;
  likes: number;
  variants: Array<{
    id: string;
    colorName: string;
    colorCode: string;
    price: number;
    images: Array<{
      id: string;
      url: string;
    }>;
    ram: string;
    rom: string;
    battery: string;
    camera: string;
  }>;
  createdAt: string;
}

const StorePageUi = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'accessory' | 'laptop' | 'smartwatch' | 'bluetooth' | 'others'>('all');
  const [sortBy, setSortBy] = useState<'all' | 'newest' | 'price-low' | 'price-high' | 'rating' | 'favorites'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const urlSearch = searchParams.get('search');

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("serverTimestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || 5,
        likes: doc.data().likes || 0,
        variants: doc.data().variants || []
      })) as Product[];
      setProducts(productsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    setLikedProducts(liked);
  }, []);

  useEffect(() => {
    const initialVariants: Record<string, string> = {};
    products.forEach(product => {
      if (product.variants.length > 0) {
        initialVariants[product.id] = product.variants[0].id;
      }
    });
    setSelectedVariants(initialVariants);
  }, [products]);

  useEffect(() => {
    let filtered = [...products];
    if (urlSearch) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(urlSearch.toLowerCase()));
    }
    if (urlFilter === 'latest') {
      filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
    } else {
      if (selectedCategory !== 'all') filtered = filtered.filter(p => p.category === selectedCategory);
      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.model.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      switch (sortBy) {
        case 'favorites': filtered = filtered.filter(p => likedProducts.includes(p.id)); break;
        case 'price-low': filtered.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0)); break;
        case 'price-high': filtered.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0)); break;
        case 'rating': filtered.sort((a, b) => b.likes - a.likes); break; // Sorted by Likes
        case 'newest': filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      }
    }
    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory, sortBy, urlFilter, urlSearch, likedProducts]);

  const handleCategoryClick = (value: any) => {
    if (value === 'all') router.push('/store');
    setSelectedCategory(value);
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    const selectedVariantId = selectedVariants[product.id];
    const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
    addToCart({ 
      id: product.id, name: product.name, price: selectedVariant.price, quantity: 1,
      image: selectedVariant.images[0]?.url || '', colorName: selectedVariant.colorName, colorCode: selectedVariant.colorCode
    });
    toast.success(`${product.name} added to cart!`);
  };

  const handleLike = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault(); e.stopPropagation();
    
    let liked = [...likedProducts];
    const isLiking = !liked.includes(product.id);
    
    try {
      // Update Local Storage
      if (isLiking) {
        liked.push(product.id);
        toast.success(`Added to favorites`);
      } else {
        liked = liked.filter(id => id !== product.id);
        toast.success(`Removed from wishlist`);
      }
      localStorage.setItem('likedProducts', JSON.stringify(liked));
      setLikedProducts(liked);

      // Update Backend Likes in Real-Time
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, {
        likes: increment(isLiking ? 1 : -1)
      });
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const categories = [
    { value: 'all', label: 'All Products', color: theme.primary },
    { value: 'phone', label: 'Phones', color: theme.secondary },
    { value: 'accessory', label: 'Accessories', color: theme.accent },
    { value: 'laptop', label: 'Laptops', color: '#4A5568' },
    { value: 'smartwatch', label: 'Smart Watches', color: '#718096' },
    { value: 'bluetooth', label: 'Bluetooth', color: '#4299E1' },
    { value: 'others', label: 'Others', color: '#9F7AEA' }
  ];

  const sortOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Top Rated', value: 'rating' }, // Labeled Top Rated, values are Likes
    { label: 'Newest', value: 'newest' },
    { label: 'My Favorites', value: 'favorites' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.primary} 100%)` }}>
        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-6">
          <div className="max-w-2xl mx-auto">
            <div className="py-12 relative">
              <input
                type="text" placeholder="Search products..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-3 pl-14 rounded-2xl bg-white/10 backdrop-blur-md border-2 focus:outline-none text-white placeholder-white/50"
                style={{ borderColor: theme.accent }}
              />
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl" style={{ color: theme.accent }} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="sticky top-0 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value as any)}
                className="px-4 py-2 rounded-full text-xs font-bold uppercase transition-all whitespace-nowrap"
                style={{
                  backgroundColor: selectedCategory === cat.value ? cat.color : '#f0f0f0',
                  color: selectedCategory === cat.value ? '#fff' : '#666',
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative min-w-[160px]">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
                <MdExpandMore />
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-full bg-[#0B2A4A] rounded-lg shadow-2xl z-50 overflow-hidden">
                    {sortOptions.map((opt) => (
                      <button key={opt.value} onClick={() => { setSortBy(opt.value as any); setShowFilters(false); }} className="w-full text-left px-4 py-3 text-[10px] font-bold text-white hover:bg-white/10 uppercase tracking-widest">
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-8">
        <AnimatePresence mode="wait">
          {filteredProducts.length === 0 ? (
            <motion.div className="text-center py-20 text-gray-500">No products found</motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              {filteredProducts.map((product, index) => {
                const selectedVariantId = selectedVariants[product.id] || product.variants[0]?.id;
                const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0];
                if (!selectedVariant) return null;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                  >
                    {/* Top Accent Line */}
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.goldDark})` }} />
                    
                    {/* Image Section - Fixed Aspect Ratio */}
                    <Link href={`/product/${product.id}`} className="relative aspect-square w-full overflow-hidden bg-gray-50">
                      <Image 
                        src={selectedVariant.images[0]?.url || ''} 
                        alt={product.name} 
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.promoOldPrice && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[8px] font-black bg-yellow-400 text-[#0B2A4A]">SALE</span>
                      )}
                      <button onClick={(e) => handleLike(e, product)} className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-md z-10">
                        {likedProducts.includes(product.id) ? <MdFavorite className="text-red-500" size={16} /> : <MdFavoriteBorder className="text-gray-400" size={16} />}
                      </button>
                    </Link>
                    
                    {/* Content Section - Uses flex-1 and flex-col for equal height */}
                    <div className="p-3 flex flex-col flex-1 justify-between">
                      <div>
                        {/* Visible & Functional Variants Balls */}
                        {product.variants.length > 1 && (
                          <div className="flex items-center gap-2 mb-3">
                            {product.variants.slice(0, 6).map((variant) => (
                              <button 
                                key={variant.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedVariants(prev => ({...prev, [product.id]: variant.id}));
                                }}
                                className={`w-4 h-4 rounded-full border transition-all hover:scale-125 shadow-sm ${
                                  selectedVariantId === variant.id 
                                  ? 'ring-2 ring-blue-500 ring-offset-1 border-transparent scale-110' 
                                  : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: variant.colorCode }}
                                title={variant.colorName}
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-bold text-xs md:text-sm text-[#0B2A4A] line-clamp-1 truncate uppercase">{product.name}</h3>
                          <div className="flex items-center text-red-500 text-[10px]">
                            <MdFavorite />
                            <span className="text-gray-600 ml-0.5">{product.likes || 0}</span>
                          </div>
                        </div>

                        {/* Forced Single Line Description */}
                        <p className="text-[10px] text-gray-500 truncate mb-2 whitespace-nowrap">
                          Best {product.category} in market - {product.model}
                        </p>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {selectedVariant.ram && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 font-bold">
                              {selectedVariant.ram}
                            </span>
                          )}
                          {selectedVariant.rom && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600 font-bold">
                              {selectedVariant.rom}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer Section */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                        <div className="flex flex-col">
                          {product.promoOldPrice && (
                            <span className="text-[9px] text-gray-400 line-through">₦{product.promoOldPrice.toLocaleString()}</span>
                          )}
                          <span className="text-xs md:text-sm font-black text-[#0B2A4A]">
                            ₦{selectedVariant.price?.toLocaleString()}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => handleAddToCart(e, product)} 
                          className="p-2 rounded-lg bg-[#0B2A4A] text-white hover:scale-110 transition-transform shadow-md"
                        >
                          <MdShoppingCart size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <InstallmentSection />
    </div>
  );
};

export default StorePageUi;