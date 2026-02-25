"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { motion } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  // Get admin UID from environment variable
  const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_KEY;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // Debug logging
      console.log("AdminLayout - Current User:", currentUser?.email);
      console.log("AdminLayout - Current UID:", currentUser?.uid);
      console.log("AdminLayout - Expected UID:", ADMIN_UID);
      
      // Check if user exists and UID matches admin UID
      if (!currentUser) {
        console.log("Access Denied: No user authenticated");
        router.push("/");
        return;
      }
      
      if (currentUser.uid !== ADMIN_UID) {
        console.log("Access Denied: UID does not match admin key");
        router.push("/");
        return;
      }
      
      // User is authorized
      console.log("Access Granted: User is admin");
      setIsAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, ADMIN_UID]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B2A4A] flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full"
        />
        <p className="mt-4 text-white font-black uppercase tracking-widest text-[10px]">
          Verifying Credentials...
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Router will redirect, but just in case
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Admin Header */}
      <header className="bg-[#0B2A4A] p-4 border-b border-[#FFD700] flex justify-between items-center">
        <div>
          <h1 className="text-white font-black uppercase text-xs tracking-widest">
            ABST Dashboard <span className="text-[#FFD700] ml-2">Secure</span>
          </h1>
          <p className="text-white/40 text-[8px] font-bold mt-1">
            Logged in as: {auth.currentUser?.email}
          </p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-white/50 hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors"
        >
          Exit to Store
        </button>
      </header>
      
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}