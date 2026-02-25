'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, FiShoppingCart, FiMenu, FiX, FiChevronDown, 
  FiLogOut, FiMail, FiSettings, FiShoppingBag, FiInfo, FiPhoneCall 
} from 'react-icons/fi';
import { useCart } from '@/components/CartContext';
import { auth, googleProvider } from '@/lib/firebase'; 
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import Cart from './Cart';
import Image from 'next/image';
import { products } from '@/types/index';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Mobile Dropdown States
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);

  const pathname = usePathname();
  const { cart } = useCart();
  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // LOGIC: Get unique Brands (e.g., iPhone, Samsung, Sony)
  const dynamicBrands = Array.from(new Set(products.map(p => p.name.split(' ')[0])));

  // LOGIC: Admin Key check
  const isAdmin = user?.uid === process.env.NEXT_PUBLIC_ADMIN_KEY;

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try { 
      await signInWithPopup(auth, googleProvider); 
      setIsOpen(false);
    } 
    catch (error) { console.error("Login failed", error); }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      setActiveDropdown(null);
    } catch (error) { console.error("Sign out failed", error); }
  };

  const isActive = (path: string) => pathname === path;

  const dropdownVariants = {
    hidden: { opacity: 0, y: 10, transition: { duration: 0.2 } },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  return (
    <>
      <nav className="shadow-lg fixed w-full z-50 border-b border-blue-500" style={{
          background: 'linear-gradient(135deg, #0B2A4A 0%, #1A3B5C 50%, #0F2B44 100%)'
        }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo Section */}
            <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative h-12 w-12 flex-shrink-0">
                    <Image 
                      src="/logo2.png" 
                      alt="ABST Icon" 
                      fill 
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-contain rounded-md transition-transform duration-300 group-hover:scale-105"
                    />
                </div>

                <div className="flex flex-col justify-center leading-none tracking-tight">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-sm font-black text-white uppercase italic">ABST.</span>
                      <span className="text-xs font-bold text-blue-400">Global Concept</span>
                    </div>
                    <span className="text-[9px] font-medium text-white/60 uppercase tracking-[0.3em] mt-0.5">MobileStore</span>
                </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/') ? 'text-yellow-400' : 'text-gray-200 hover:text-white'}`}>
                <FiHome />
                <span>Home</span>
              </Link>

              {/* STORE DROPDOWN */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('store')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-widest transition-colors ${pathname.includes('/store') ? 'text-yellow-400' : 'text-gray-200 hover:text-white'}`}>
                  <span>Store</span>
                  <FiChevronDown className={`transition-transform duration-300 ${activeDropdown === 'store' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'store' && (
                    <motion.div initial="hidden" animate="visible" exit="hidden" variants={dropdownVariants} className="absolute top-full left-0 pt-4 z-50">
                      <div className="bg-[#1A3B5C] border border-blue-500/30 rounded-lg shadow-2xl p-2 w-56 text-white text-xs uppercase">
                        <Link href="/store" className="block px-4 py-3 hover:text-yellow-400 hover:bg-white/5 rounded transition-all">All Products</Link>
                        <div className="relative group/sub">
                          <div className="flex justify-between items-center px-4 py-3 cursor-default hover:text-yellow-400">
                            Brands <FiChevronDown className="-rotate-90" />
                          </div>
                          <div className="absolute left-full top-0 pl-2 hidden group-hover/sub:block">
                            <div className="bg-[#1A3B5C] border border-blue-500/30 rounded-lg p-2 w-40">
                              {dynamicBrands.map((brand) => (
                                <Link key={brand} href={`/store?search=${brand}`} className="block px-4 py-2 hover:text-yellow-400 transition-all">{brand}</Link>
                              ))}
                            </div>
                          </div>
                        </div>
                        <Link href="/store?filter=latest" className="block px-4 py-3 font-bold text-blue-400 hover:text-yellow-400 rounded transition-all">Latest Arrivals</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ABOUT DROPDOWN */}
              <div className="relative" onMouseEnter={() => setActiveDropdown('about')} onMouseLeave={() => setActiveDropdown(null)}>
                <button className={`flex items-center space-x-1 text-xs font-bold uppercase tracking-widest transition-colors ${pathname.startsWith('/about') ? 'text-yellow-400' : 'text-gray-200 hover:text-white'}`}>
                  <span>About</span>
                  <FiChevronDown className={`transition-transform duration-300 ${activeDropdown === 'about' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeDropdown === 'about' && (
                    <motion.div initial="hidden" animate="visible" exit="hidden" variants={dropdownVariants} className="absolute top-full left-0 pt-4 z-50">
                      <div className="bg-[#1A3B5C] border border-blue-500/30 rounded-lg shadow-2xl p-2 w-48 text-xs uppercase text-white">
                        <Link href="/about" className="block px-4 py-3 hover:text-yellow-400 rounded transition-all">About Us</Link>
                        <Link href="/location" className="block px-4 py-3 hover:text-yellow-400 rounded transition-all">Location</Link>
                        <Link href="/faq" className="block px-4 py-3 hover:text-yellow-400 rounded transition-all">FAQ</Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link href="/contact" className={`text-xs font-bold uppercase tracking-widest transition-colors ${isActive('/contact') ? 'text-yellow-400' : 'text-gray-200 hover:text-white'}`}>
                Contact
              </Link>
            </div>

            {/* Icons & Auth */}
            <div className="flex items-center space-x-6">
              <button onClick={() => setIsCartOpen(true)} className="relative p-2 text-white hover:text-yellow-400 transition-colors">
                <FiShoppingCart size={22} />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              <div className="hidden md:block">
                {user ? (
                  <div className="relative" onMouseEnter={() => setActiveDropdown('user')} onMouseLeave={() => setActiveDropdown(null)}>
                    <div className="flex items-center space-x-2 cursor-pointer">
                      <span className={`text-[11px] font-bold uppercase ${isAdmin ? 'text-[#FFD700]' : 'text-white'}`}>
                        {isAdmin ? 'CEO' : user.displayName?.split(' ')[0]}
                      </span>
                      <div className={`w-12 h-12 rounded-full border-2 overflow-hidden relative ${isAdmin ? 'border-[#FFD700]' : 'border-blue-400'}`}>
                        <Image src={user.photoURL || '/default-avatar.png'} alt="user" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                      </div>
                    </div>
                    <AnimatePresence>
                      {activeDropdown === 'user' && (
                        <motion.div initial="hidden" animate="visible" exit="hidden" variants={dropdownVariants} className="absolute top-full right-0 pt-4 z-50">
                          <div className="bg-white rounded-lg shadow-xl w-40 overflow-hidden">
                            {isAdmin && (
                              <Link href="/admin" className="w-full flex items-center space-x-2 px-4 py-3 text-blue-600 hover:bg-blue-50 text-xs font-bold transition-colors border-b border-gray-100">
                                <FiSettings /> <span>Admin Panel</span>
                              </Link>
                            )}
                            <button onClick={handleSignOut} className="w-full flex items-center space-x-2 px-4 py-3 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors">
                              <FiLogOut /> <span>Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button onClick={handleSignIn} className="bg-white text-[#0B2A4A] px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-all">
                    Sign In
                  </button>
                )}
              </div>

              <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white transition-transform active:scale-90">
                {isOpen ? <FiX size={28} /> : <FiMenu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm md:hidden z-[60]" />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-[80%] bg-[#0B2A4A] shadow-2xl md:hidden z-[70] flex flex-col border-l border-blue-500/30 overflow-y-auto">
                
                <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5">
                  <span className="text-white font-black tracking-[0.3em] text-xs">A.B.S.T GLOBAL</span>
                  <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                    <FiX size={24} />
                  </button>
                </div>

                <div className="flex-grow p-8 flex flex-col space-y-4">
                    <Link href="/" className={`text-white font-bold uppercase tracking-widest text-sm flex items-center space-x-3 ${isActive('/') ? 'text-yellow-400' : ''}`} onClick={() => setIsOpen(false)}>
                      <FiHome /> <span>Home</span>
                    </Link>

                    {/* MOBILE STORE DROPDOWN */}
                    <div>
                      <button onClick={() => setMobileStoreOpen(!mobileStoreOpen)} className={`w-full flex justify-between items-center font-bold uppercase tracking-widest text-sm py-2 ${pathname.includes('/store') ? 'text-yellow-400' : 'text-white'}`}>
                        <div className="flex items-center space-x-3">
                          <FiShoppingBag /> <span>Store</span>
                        </div>
                        <FiChevronDown className={`transition-transform ${mobileStoreOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileStoreOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/20 rounded-lg ml-2">
                             <Link href="/store" className="block p-3 text-white/70 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>All Products</Link>
                             {dynamicBrands.map(brand => (
                               <Link key={brand} href={`/store?search=${brand}`} className="block p-3 text-white/70 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>{brand}</Link>
                             ))}
                             <Link href="/store?filter=latest" className="block p-3 text-blue-400 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>Latest Arrivals</Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* MOBILE ABOUT DROPDOWN */}
                    <div>
                      <button onClick={() => setMobileAboutOpen(!mobileAboutOpen)} className={`w-full flex justify-between items-center font-bold uppercase tracking-widest text-sm py-2 ${pathname.startsWith('/about') ? 'text-yellow-400' : 'text-white'}`}>
                        <div className="flex items-center space-x-3">
                          <FiInfo /> <span>About</span>
                        </div>
                        <FiChevronDown className={`transition-transform ${mobileAboutOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {mobileAboutOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-black/20 rounded-lg ml-2">
                             <Link href="/about" className="block p-3 text-white/70 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>About Us</Link>
                             <Link href="/location" className="block p-3 text-white/70 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>Location</Link>
                             <Link href="/faq" className="block p-3 text-white/70 text-xs font-bold uppercase" onClick={() => setIsOpen(false)}>FAQ</Link>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link href="/contact" className={`font-bold uppercase tracking-widest text-sm py-2 flex items-center space-x-3 ${isActive('/contact') ? 'text-yellow-400' : 'text-white'}`} onClick={() => setIsOpen(false)}>
                      <FiPhoneCall /> <span>Contact</span>
                    </Link>
                </div>

                <div className="p-8 bg-black/20 border-t border-white/5 mt-auto">
                  {user ? (
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full border-2 overflow-hidden relative flex-shrink-0 ${isAdmin ? 'border-[#FFD700]' : 'border-yellow-400'}`}>
                          <Image src={user.photoURL || '/default-avatar.png'} alt="user" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
                        </div>
                        <div className="overflow-hidden">
                          <p className={`font-bold text-sm truncate ${isAdmin ? 'text-[#FFD700]' : 'text-white'}`}>
                            {isAdmin ? 'CEO' : user.displayName}
                          </p>
                          <p className="text-white/40 text-[11px] truncate flex items-center gap-1">
                            <FiMail size={10} /> {user.email}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <Link href="/admin" onClick={() => setIsOpen(false)} className="w-full flex items-center justify-center space-x-2 py-4 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-widest">
                          <FiSettings /> <span>Admin Dashboard</span>
                        </Link>
                      )}

                      <button onClick={handleSignOut} className="w-full flex items-center justify-center space-x-2 py-4 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-black uppercase tracking-widest">
                        <FiLogOut /> <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button onClick={handleSignIn} className="w-full py-4 bg-white text-[#0B2A4A] rounded-lg text-xs font-black uppercase tracking-widest shadow-lg">
                      Sign In With Google
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Nav;