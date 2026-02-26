"use client";
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
  MdExpandMore // Added for the dropdown arrow
} from 'react-icons/md';
import { products } from '@/types/index';
import { useCart } from '@/components/CartContext';
import InstallmentSection from '@/components/home/InstallmentSection';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

// Theme colors from business card
const theme = {
  primary: '#0B2A4A', // Dark blue from card
  secondary: '#1A3B5C', // Medium blue
  accent: '#FFD700', // Gold/yellow from "ABST" text
  goldLight: '#c0a418',
  goldDark: '#B8860B',
  text: '#FFFFFF',
  background: '#F5F5F5'
};

const StorePageUi = () => {
  const router = useRouter();
  const { addToCart } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'accessory'>('all');
  const [sortBy, setSortBy] = useState<'all' | 'newest' | 'price-low' | 'price-high' | 'rating' | 'favorites'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [likedProducts, setLikedProducts] = useState<number[]>([]);

  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter');
  const urlSearch = searchParams.get('search');

  // Load liked products from localStorage
  useEffect(() => {
    const liked = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    setLikedProducts(liked);
  }, []);

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    if (urlSearch) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(urlSearch.toLowerCase())
      );
    }

    if (urlFilter === 'latest') {
      filtered = filtered
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    } 
    else {
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }

      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.model.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      switch (sortBy) {
        case 'favorites':
          filtered = filtered.filter(p => likedProducts.includes(p.id));
          break;
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'all':
        default:
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, sortBy, urlFilter, urlSearch, likedProducts]);

  const handleCategoryClick = (value: 'all' | 'phone' | 'accessory') => {
    if (value === 'all') {
      setSearchQuery('');
      setSortBy('all');
      router.push('/store'); 
    }
    setSelectedCategory(value);
  };

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ ...product, quantity: 1 });
    toast.success(`${product.name} added to cart!`);
  };

  const handleLike = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    let liked = [...likedProducts];
    if (liked.includes(product.id)) {
      liked = liked.filter(id => id !== product.id);
      toast.success(`${product.name} removed from wishlist`);
    } else {
      liked.push(product.id);
      toast.success(`${product.name} added to your favorites`);
    }
    
    localStorage.setItem('likedProducts', JSON.stringify(liked));
    setLikedProducts(liked);
  };

  const categories = [
    { value: 'all', label: 'All Products', color: theme.primary },
    { value: 'phone', label: 'Phones', color: theme.secondary },
    { value: 'accessory', label: 'Accessories', color: theme.accent }
  ];

  // Sorting Options for the Custom Dropdown
  const sortOptions = [
    { label: 'All Products', value: 'all' },
    { label: 'Price: Low to High', value: 'price-low' },
    { label: 'Price: High to Low', value: 'price-high' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'My Favorites', value: 'favorites' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.background }}>
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 50%, ${theme.primary} 100%)`
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96" style={{ backgroundColor: theme.accent, filter: 'blur(3xl)', opacity: 0.1 }}></div>
        </div>
        
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-16 pb-4 md:pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text" placeholder="Search products by name, model, or description..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-2 pl-14 rounded-2xl bg-white/10 backdrop-blur-md border-2 focus:outline-none text-white placeholder-white/50"
                style={{ borderColor: theme.accent }}
              />
              <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl" style={{ color: theme.accent }} />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20">
                  <MdClose size={16} className="text-white" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-2.5 md:px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryClick(cat.value as any)}
                  className="px-4 py-2 rounded md:rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap"
                  style={{
                    backgroundColor: selectedCategory === cat.value ? cat.color : '#f0f0f0',
                    color: selectedCategory === cat.value ? '#fff' : '#666',
                    border: `1px solid ${selectedCategory === cat.value ? 'transparent' : '#ddd'}`
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-bold"
                style={{ borderColor: theme.primary, color: theme.primary }}
              >
                <MdFilterList />
                Sort
              </button>
              
              {/* DESIGNED CUSTOM DROPDOWN REPLACING <SELECT> */}
              <div className="relative min-w-[160px]">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-bold bg-white transition-all hover:border-blue-400"
                  style={{ borderColor: theme.primary, color: theme.primary }}
                >
                  <span>{sortOptions.find(o => o.value === sortBy)?.label}</span>
                  <MdExpandMore className={`text-lg transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showFilters && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 -mt-1.5 w-full bg-[#0B2A4A] rounded-b-lg shadow-2xl overflow-hidden z-50 border border-white/10"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value as any);
                              setShowFilters(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                              sortBy === option.value ? 'bg-yellow-400 text-[#0B2A4A]' : 'text-white hover:bg-white/10'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-xs text-gray-500">
                {filteredProducts.length} products
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 py-8">
        <AnimatePresence mode="wait">
          {filteredProducts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <p className="text-gray-500 text-lg">No products found matching "{searchQuery}"</p>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }} whileHover={{ y: -5 }}
                  className="group relative bg-white md:rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.goldLight})` }} />
                  <Link href={`/product/${product.id}`} className="block">
                    <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 p-3">
                      <Image 
                        src={product.thumbnails[0].imageUrl} 
                        alt={product.name} 
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                      />
                      {product.originalPrice && (
                        <span className="absolute top-2 left-2 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wider" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.goldDark})`, color: theme.primary }}>SALE</span>
                      )}
                      <button onClick={(e) => handleLike(e, product)} className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform">
                        {likedProducts.includes(product.id) ? <MdFavorite style={{ color: theme.accent }} size={16} /> : <MdFavoriteBorder style={{ color: theme.primary }} size={16} />}
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-xs md:text-sm truncate" style={{ color: theme.primary }}>{product.name}</h3>
                        <div className="flex items-center gap-0.5 text-yellow-500 text-xs"><MdStar /><span className="text-gray-600">{product.rating}</span></div>
                      </div>
                      <p className="text-[10px] text-gray-500 mb-2 line-clamp-2">{product.description.substring(0, 60)}...</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.ram && <span className="text-[8px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.primary + '10', color: theme.primary }}>{product.ram}</span>}
                        {product.storage && <span className="text-[8px] px-2 py-0.5 rounded-full" style={{ backgroundColor: theme.secondary + '10', color: theme.secondary }}>{product.storage[0]}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          {product.originalPrice && <span className="text-[8px] text-gray-400 line-through block">₦{product.originalPrice.toLocaleString()}</span>}
                          <span className="text-sm font-black" style={{ color: theme.primary }}>₦{product.price.toLocaleString()}</span>
                        </div>
                        <button onClick={(e) => handleAddToCart(e, product)} className="p-2 rounded-lg transition-all hover:scale-110" style={{ backgroundColor: theme.primary, color: 'white' }}><MdShoppingCart size={14} /></button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
          <InstallmentSection />
      </div>
    </div>
  );
};

export default StorePageUi;