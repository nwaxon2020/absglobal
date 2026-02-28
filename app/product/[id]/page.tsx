"use client";
import { Suspense, useState, useEffect, useRef, use } from 'react';
import {MdFavorite, MdFavoriteBorder, MdClose, MdChatBubble, MdShoppingCart, MdSend} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';
import { ProductLoader } from '@/components/LoadingStates';
import toast from 'react-hot-toast';

// Firebase Imports
import { db, auth, googleProvider } from '@/lib/firebase'; 
import { doc, getDoc, updateDoc, increment, arrayUnion, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const resolvedParams = use(params);
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  
  const [user, setUser] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      try {
        const docRef = doc(db, "products", resolvedParams.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setLikeCount(data.likes || 0);
          
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
            setSelectedImage(data.variants[0].images?.[0]?.url || '');
          }

          // Smart "You May Also Like" - Category & Similarity
          const q = query(
            collection(db, "products"),
            where("category", "==", data.category),
            limit(6)
          );
          const relatedSnap = await getDocs(q);
          const related = relatedSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(p => p.id !== docSnap.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (error) {
        toast.error("Error loading product data");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRelated();
  }, [resolvedParams.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    const likedItems = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    if (likedItems.includes(resolvedParams.id)) setIsLiked(true);
    return () => unsubscribe();
  }, [resolvedParams.id]);

  const handleLike = async () => {
    let likedItems = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    const docRef = doc(db, "products", product.id);
    try {
      if (isLiked) {
        likedItems = likedItems.filter((id: string) => id !== product.id);
        await updateDoc(docRef, { likes: increment(-1) });
        setLikeCount(prev => prev - 1);
      } else {
        likedItems.push(product.id);
        await updateDoc(docRef, { likes: increment(1) });
        setLikeCount(prev => prev + 1);
      }
      localStorage.setItem('likedProducts', JSON.stringify(likedItems));
      setIsLiked(!isLiked);
    } catch (e) { toast.error("Sync failed"); }
  };

  const handleAddToCart = () => {
    addToCart({ 
      ...product, 
      price: selectedVariant?.price || product.price, 
      image: selectedImage,
      variantName: selectedVariant?.colorName,
      quantity: 1 
    });
    toast.success("Added to selection!");
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || !user) return;
    const docRef = doc(db, "products", product.id);
    const newReview = {
      id: Date.now().toString(),
      userName: user.displayName || "Client",
      comment: reviewText,
      rating: 5,
      date: new Date().toLocaleDateString()
    };

    try {
      await updateDoc(docRef, { reviews: arrayUnion(newReview) });
      setProduct({ ...product, reviews: [newReview, ...product.reviews] });
      setReviewText('');
      toast.success("Review attached!");
    } catch (e) { toast.error("Failed to post review"); }
  };

  if (loading) return <ProductLoader />;
  if (!product) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[200]">Product not found</div>;

  return (
    <Suspense fallback={<ProductLoader />}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
        <div onClick={() => router.back()} className="absolute inset-0 bg-black/95 backdrop-blur-xl cursor-pointer" />

        <div className="relative bg-[#0A0A0A] md:rounded-2xl w-full max-w-5xl h-full md:max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl no-scrollbar z-10">
          
          <button onClick={() => router.back()} className="fixed top-4 right-4 z-50 p-2 bg-white/10 rounded-full hover:bg-red-500 transition-colors text-white">
            <MdClose size={24} />
          </button>

          <div className="flex flex-col md:flex-row min-h-full">
            {/* LEFT: IMAGE VIEWER */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent">
              <div className="relative w-full aspect-square flex items-center justify-center cursor-zoom-in" onClick={() => setIsPreviewOpen(true)}>
                <Image src={selectedImage} alt={product.name} fill className="object-contain drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)]" priority />
              </div>

              {/* VARIANT DOTS - DIRECTLY BELOW IMAGE */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Available Colors</p>
                <div className="flex gap-4">
                  {product.variants?.map((v: any) => (
                    <button 
                      key={v.id} 
                      onClick={() => { setSelectedVariant(v); setSelectedImage(v.images?.[0]?.url); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 ${selectedVariant?.id === v.id ? 'border-blue-500 scale-125' : 'border-white/10'}`}
                      style={{ backgroundColor: v.colorCode }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: PRODUCT CONTENT */}
            <div className="w-full md:w-1/2 p-6 md:p-10 text-white flex flex-col">
              <span className="text-blue-500 font-black text-[10px] tracking-[0.4em] uppercase mb-2 italic block">{product.category}</span>
              <h1 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter uppercase leading-none">{product.name}</h1>
              
              <div className="flex items-center gap-5 mb-8">
                <span className="text-2xl font-black text-white">₦{Number(selectedVariant?.price || product.price).toLocaleString()}</span>
                <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black transition-all ${isLiked ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/20'}`}>
                  {isLiked ? <MdFavorite /> : <MdFavoriteBorder />} {likeCount}
                </button>
              </div>

              {/* SPECS - ONLY IF AVAILABLE */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {selectedVariant?.ram && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                    <p className="text-[8px] text-white/40 font-black uppercase mb-1">Ram</p>
                    <p className="text-xs font-bold">{selectedVariant.ram}</p>
                  </div>
                )}
                {selectedVariant?.rom && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                    <p className="text-[8px] text-white/40 font-black uppercase mb-1">Storage</p>
                    <p className="text-xs font-bold">{selectedVariant.rom}</p>
                  </div>
                )}
                {selectedVariant?.battery && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
                    <p className="text-[8px] text-white/40 font-black uppercase mb-1">Battery</p>
                    <p className="text-xs font-bold">{selectedVariant.battery}</p>
                  </div>
                )}
              </div>

              {/* FEEDBACK SYSTEM */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-black uppercase italic tracking-tighter flex items-center gap-2"><MdChatBubble className="text-blue-500" /> Reviews</h3>
                  {user ? (
                    <div className="flex gap-2 flex-1 max-w-[200px] ml-4">
                      <input type="text" value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="Comment..." className="bg-white/5 border border-white/10 rounded-lg flex-1 px-3 py-2 text-[10px] outline-none" />
                      <button onClick={handleSubmitReview} className="bg-blue-600 p-2 rounded-lg"><MdSend size={14} /></button>
                    </div>
                  ) : (
                    <button onClick={() => signInWithPopup(auth, googleProvider)} className="text-[9px] font-black uppercase text-blue-400">Login to Review</button>
                  )}
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-[180px] overflow-y-auto no-scrollbar space-y-4">
                  {product.reviews?.length > 0 ? product.reviews.map((r: any) => (
                    <div key={r.id} className="border-b border-white/5 pb-3 last:border-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase">{r.userName}</span>
                        <span className="text-[8px] text-white/20">{r.date}</span>
                      </div>
                      <p className="text-[11px] italic text-white/70">"{r.comment}"</p>
                    </div>
                  )) : <p className="text-[10px] text-white/20 text-center italic">No feedback for this device yet.</p>}
                </div>
              </div>

              <button onClick={handleAddToCart} className="w-full bg-white text-black py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3">
                <MdShoppingCart size={20} /> Add to Selection
              </button>
            </div>
          </div>

          {/* SUGGESTED - DYNAMIC CATEGORY LOGIC */}
          <div className="p-8 md:p-12 bg-black/40 border-t border-white/10">
            <h2 className="text-xl font-black mb-8 italic uppercase tracking-tighter">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(item => (
                <Link key={item.id} href={`/product/${item.id}`} className="group bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-blue-500/50 transition-all">
                  <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-white/5">
                    <Image src={item.variants?.[0]?.images?.[0]?.url || "/logo2.png"} fill className="object-contain p-4 group-hover:scale-110 transition-transform" alt="" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-tighter truncate">{item.name}</p>
                  <p className="text-blue-500 font-black text-xs mt-1">₦{Number(item.variants?.[0]?.price || item.price).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* FULLSCREEN PREVIEW */}
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center p-4">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-8 right-8 text-white"><MdClose size={40} /></button>
            <div className="relative w-full h-full max-w-4xl max-h-[80vh]"><Image src={selectedImage} alt="" fill className="object-contain" /></div>
          </div>
        )}
      </div>
    </Suspense>
  );
}