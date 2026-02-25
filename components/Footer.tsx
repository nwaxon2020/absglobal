'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiSend, FiMapPin, FiMail, FiLogOut } from 'react-icons/fi';
import { auth, googleProvider, db } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const q = query(collection(db, "newsletter_subscribers"), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast.error("This email is already on the elite list!");
      } else {
        await addDoc(collection(db, "newsletter_subscribers"), {
          email: email,
          subscribedAt: serverTimestamp(),
          userId: user?.uid || 'guest'
        });
        toast.success(`Welcome to the circle, ${email.split('@')[0]}!`);
      }
    } catch (error) {
      console.error("Newsletter Error:", error); // See the actual error in console
      toast.error("Failed to subscribe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthAction = async () => {
    if (user) {
      await signOut(auth);
      toast.success("Signed out successfully");
    } else {
      try {
        await signInWithPopup(auth, googleProvider);
        toast.success("Welcome back!");
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleFinanceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname !== '/') {
      router.push('/#finance');
    } else {
      document.getElementById('finance')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative text-white overflow-hidden border-t border-blue-500/30" style={{
      background: 'linear-gradient(135deg, #0B2A4A 0%, #0F2B44 100%)'
    }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image src="/logo2.png" alt="ABST Icon" fill className="object-contain rounded-md" />
              </div>
              <div className="flex flex-col justify-center leading-none tracking-tight">
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-black text-white uppercase italic">ABST.</span>
                  <span className="text-[10px] font-bold text-blue-400">Global Concept</span>
                </div>
                <span className="text-[8px] font-medium text-white/60 uppercase tracking-[0.2em] mt-0.5">MobileStore</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your premier destination for luxury automotive, fashion, and the latest mobile technology. Experience the A.B.S.T standard.
            </p>
            <div className="flex space-x-4">
              {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-blue-500 hover:text-white transition-all duration-300">
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Navigation */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-blue-400">Quick Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: 'Home', href: '/' },
                { name: 'Store', href: '/store' },
                { name: 'About Us', href: '/about' },
                { name: 'Latest Arrivals', href: '/store?filter=latest' },
                { name: 'Contact Us', href: '/contact' }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center group">
                    <span className="h-[1px] w-0 group-hover:w-4 bg-blue-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support & Categories */}
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-blue-400">Customer Support</h4>
            <ul className="space-y-4">
              {[
                { name: 'FAQ', href: '/faq' },
                { name: 'Location', href: '/location' },
                { name: 'Financing Plan', href: '#finance', action: handleFinanceClick },
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Account Access', href: '#', action: handleAuthAction }
              ].map((link) => (
                <li key={link.name}>
                  <button 
                    onClick={link.action ? link.action : undefined}
                    className="text-gray-400 hover:text-white text-sm transition-colors flex items-center group"
                  >
                    <span className="h-[1px] w-0 group-hover:w-4 bg-blue-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                    {link.name === 'Account Access' && user ? 'Sign Out' : link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Contact & Newsletter */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest mb-6 text-blue-400">Get In Touch</h4>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex items-start space-x-3">
                <FiMapPin className="text-blue-500 mt-1 flex-shrink-0" />
                <span>Lagos, Nigeria</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="text-blue-500 flex-shrink-0" />
                <span>ceo@abstglobal.com</span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3 text-center lg:text-left">
                {user ? `Logged in as ${user.displayName?.split(' ')[0]}` : 'Subscribe'}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex h-12">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="bg-white/5 border border-white/10 flex-1 px-4 py-2 text-sm text-gray-100 rounded-l-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  disabled={loading}
                  className="bg-blue-600 px-5 rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <FiSend size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          <p>&copy; {currentYear} ABST Global Concept. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-blue-500/50 italic">Empowering Digital Lifestyle</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;