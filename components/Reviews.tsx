"use client";
import React, { useState, useEffect, useRef } from 'react';
import { db, auth, googleProvider } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { MdStar, MdStarBorder, MdDelete, MdSend, MdPeople, MdOutlineSpeakerNotesOff, MdWarning } from 'react-icons/md';
import toast from 'react-hot-toast';
import Image from 'next/image';

const SiteReviews = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null); // State for confirmation
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "site_reviews"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReviews(docs);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error("Sign in failed");
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, "site_reviews", deletingId));
      toast.success("Review deleted");
      setDeletingId(null);
    } catch (error) {
      toast.error("Error deleting review");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return toast.error("Please provide a rating!");

    setLoading(true);
    try {
      await addDoc(collection(db, "site_reviews"), {
        userId: user.uid,
        userName: user.displayName || "Client",
        userPhoto: user.photoURL,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });
      setComment('');
      setRating(0);
      toast.success("Review posted!");
    } catch (error) {
      toast.error("Failed to post");
    } finally {
      setLoading(false);
    }
  };

  const userReview = reviews.find(r => r.userId === user?.uid);

  return (
    <div className="pt-15 pb-25 px-4 md:px-12 mx-auto bg-[#F5F5F5] relative">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <div className="bg-[#0B2A4A] text-yellow-400 px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-md mb-4">
          <MdPeople size={14} />
          {reviews.length} LIVE REVIEWS
        </div>
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-[#0B2A4A]">
          Client <span className="text-blue-600">Feedback</span>
        </h2>
        <div className="h-1 w-20 bg-yellow-400 mt-3 rounded-full" />
      </div>

      {/* Reviews Section */}
      <div className="mb-2 md:mb-6">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <MdOutlineSpeakerNotesOff className="text-gray-300 text-5xl mb-4" />
            <p className="text-gray-400 font-bold uppercase text-[11px] tracking-widest text-center px-4">No reviews yet.</p>
          </div>
        ) : (
          <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-8 no-scrollbar snap-x px-2">
            {reviews.map((rev) => (
              <motion.div
                key={rev.id}
                layout
                className="min-w-[300px] md:min-w-[360px] bg-white rounded-xl p-6 shadow-lg border border-gray-100 snap-center relative overflow-hidden"
              >
                {/* Real-time Confirmation Overlay */}
                <AnimatePresence>
                  {deletingId === rev.id && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 bg-[#0B2A4A]/95 flex flex-col items-center justify-center p-4 text-center"
                    >
                      <MdWarning className="text-yellow-400 text-3xl mb-2" />
                      <p className="text-white text-[10px] font-black uppercase mb-4 tracking-widest">Delete this review permanently?</p>
                      <div className="flex gap-3">
                        <button onClick={() => setDeletingId(null)} className="px-4 py-2 bg-white/10 text-white text-[9px] font-bold rounded-lg hover:bg-white/20">CANCEL</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white text-[9px] font-bold rounded-lg hover:bg-red-700 shadow-lg">DELETE</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400">
                    <Image src={rev.userPhoto || '/logo2.png'} alt="user" fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-[#0B2A4A]">{rev.userName}</h4>
                    <div className="flex text-yellow-500 text-xs">
                      {[...Array(5)].map((_, i) => (i < rev.rating ? <MdStar key={i} /> : <MdStarBorder key={i} />))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 italic leading-relaxed">"{rev.comment}"</p>
                
                {user?.uid === rev.userId && (
                  <button onClick={() => setDeletingId(rev.id)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-all">
                    <MdDelete size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0B2A4A] rounded-xl p-8 shadow-xl">
          {!user ? (
            <div className="text-center py-4">
              <h3 className="text-white font-black uppercase text-sm mb-4">Rate Your Experience</h3>
              <button onClick={handleSignIn} className="bg-white text-[#0B2A4A] px-6 py-2.5 rounded-lg text-[10px] font-black uppercase hover:bg-yellow-400">Sign In to Review</button>
            </div>
          ) : userReview ? (
            <div className="text-center py-4">
              <MdStar className="text-yellow-400 text-4xl mx-auto mb-3" />
              <h3 className="text-white font-black uppercase text-xs italic">Review Recorded</h3>
              <p className="text-white/40 text-[9px] mt-2 font-bold uppercase">To write a new one, delete your existing post above.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black uppercase text-xs italic tracking-widest">Select Rating:</h3>
                <div className="flex gap-1.5 bg-black/40 p-2.5 rounded-lg border border-white/10">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button key={num} type="button" onClick={() => setRating(num)} className={`text-2xl transition-all ${rating >= num ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(255,215,0,0.4)]' : 'text-white/10'}`}>
                      <MdStar />
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write your review here..." className="w-full bg-white/5 border border-white/10 rounded-lg p-4 text-white text-[11px] focus:outline-none focus:border-yellow-400 h-24 mb-4" required />
              <button type="submit" disabled={loading || rating === 0} className="w-full bg-yellow-400 text-[#0B2A4A] font-black uppercase py-4 rounded-lg text-[10px] tracking-widest hover:bg-yellow-500 disabled:opacity-30 transition-all">
                {loading ? "SAVING..." : "SUBMIT REVIEW"}
              </button>
            </form>
          )}
        </div>
      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
};

export default SiteReviews;