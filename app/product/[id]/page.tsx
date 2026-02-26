"use client";
import { Suspense } from 'react';
import { useState, useEffect, useRef, use } from 'react';
import { 
  MdChevronLeft, 
  MdChevronRight, 
  MdStar, 
  MdFavorite, 
  MdFavoriteBorder, 
  MdClose, 
  MdChatBubble, 
  MdShoppingCart,
  MdSend
} from 'react-icons/md';
import { useRouter } from 'next/navigation';
import { products } from '@/types/index';
import Image from 'next/image';
import { useCart } from '@/components/CartContext';
import { ProductLoader } from '@/components/LoadingStates';
import toast from 'react-hot-toast';

// Firebase Imports
import { auth, googleProvider } from '@/lib/firebase'; 
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const resolvedParams = use(params);
  const product = products.find(p => p.id === parseInt(resolvedParams.id));
  
  const [selectedThumb, setSelectedThumb] = useState(product?.thumbnails[0]);
  const [selectedStorage, setSelectedStorage] = useState(product?.storage?.[0] || '');
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(product?.likes || 0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  
  const [user, setUser] = useState<User | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!product) return;
    const likedItems = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    if (likedItems.includes(product.id)) {
      setIsLiked(true);
      setLikeCount(product.likes + 1);
    } else {
      setLikeCount(product.likes);
    }
  }, [product]);

  if (!product || !selectedThumb) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white z-[200]">Product not found</div>;
  }

  const handleSignIn = async () => {
    try { 
      await signInWithPopup(auth, googleProvider); 
      toast.success("Signed in successfully!");
    } 
    catch (error) { 
      toast.error("Authentication failed");
    }
  };

  const handleLike = () => {
    let likedItems = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    if (isLiked) {
      likedItems = likedItems.filter((id: number) => id !== product.id);
      setLikeCount(prev => prev - 1);
    } else {
      likedItems.push(product.id);
      setLikeCount(prev => prev + 1);
    }
    localStorage.setItem('likedProducts', JSON.stringify(likedItems));
    setIsLiked(!isLiked);
  };

  const handleAddToCart = () => {
    addToCart({ ...product, quantity: 1, selectedStorage } as any);
    toast.success(`${product.name} (${selectedStorage}) added to selection!`);
  };

  const handleNextImage = () => {
    const currentIndex = product.thumbnails.findIndex(t => t.id === selectedThumb.id);
    const nextIndex = (currentIndex + 1) % product.thumbnails.length;
    setSelectedThumb(product.thumbnails[nextIndex]);
  };

  const handlePrevImage = () => {
    const currentIndex = product.thumbnails.findIndex(t => t.id === selectedThumb.id);
    const prevIndex = (currentIndex - 1 + product.thumbnails.length) % product.thumbnails.length;
    setSelectedThumb(product.thumbnails[prevIndex]);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    toast.success(`Review posted as ${user?.displayName?.split(' ')[0]}!`);
    setReviewText('');
  };

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  return (
    <Suspense fallback={<ProductLoader />}>
      {/* ✅ MOBILE FIX: Removed extra padding and added box-sizing logic to prevent right-side overflow */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-8">
        <div onClick={() => router.back()} className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer" />

        <div className="pt-8 relative bg-[#111111] md:rounded-lg w-full max-w-5xl h-full md:max-h-[92vh] overflow-y-auto border-x md:border border-white/10 shadow-2xl no-scrollbar z-10">
          
          <button onClick={() => router.back()} className="absolute top-3 -right-1 md:sticky md:top-4 md:float-right mr-4 z-50 p-1.5 bg-white/10 rounded-full hover:bg-white/20 text-white border border-white/5">
            <MdClose size={20} />
          </button>

          {/* PRODUCT IMAGE & INFOS */}
          <div className="flex flex-col md:flex-row">
            
            <div className="w-full md:w-5/12 p-4 md:p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 bg-black/20">
              <div className="relative w-full h-60 md:h-[350px] flex items-center justify-center cursor-pointer" onClick={() => setIsPreviewOpen(true)}>
                <Image src={selectedThumb.imageUrl} alt={product.name} fill className="object-contain drop-shadow-[0_15px_40px_rgba(59,130,246,0.2)]" />
              </div>

              <div className="flex items-center w-full mt-6 gap-1 justify-center">
                <button onClick={() => scrollRef.current?.scrollBy({left: -100, behavior: 'smooth'})} className="p-1.5 bg-white/5 rounded-full text-white hover:bg-white/10"><MdChevronLeft size={18} /></button>
                <div ref={scrollRef} className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-2 max-w-[280px]">
                  {product.thumbnails.map((t) => (
                    <button key={t.id} onClick={() => setSelectedThumb(t)} className={`relative shrink-0 w-12 h-12 rounded-lg border transition-all ${selectedThumb.id === t.id ? 'border-blue-500 bg-white/10' : 'border-transparent bg-white/5'}`}>
                      <Image src={t.imageUrl} fill className="object-contain p-1" alt="" />
                    </button>
                  ))}
                </div>
                <button onClick={() => scrollRef.current?.scrollBy({left: 100, behavior: 'smooth'})} className="p-1.5 bg-white/5 rounded-full text-white hover:bg-white/10"><MdChevronRight size={18} /></button>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col text-white">
              <div className="mb-6">
                {/* HEADER OF PRODUCT INFOS */}
                <span className="text-blue-400 font-bold text-[9px] tracking-[0.3em] uppercase mb-1 block italic">{product.model}</span>
                <h1 className="text-2xl md:text-3xl font-black mb-3 tracking-tighter uppercase leading-tight text-white">{product.name}</h1>
                
                <div className="flex items-center gap-4">
                  <span className="text-xl font-black text-white">₦{product.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-yellow-400 font-bold bg-white/5 px-3 py-1 rounded-full text-xs">
                    <MdStar size={14} /> <span>{product.rating}</span>
                  </div>
                  <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] transition-all ${isLiked ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-white/10 border-white/20 text-white'}`}>
                    {isLiked ? <MdFavorite size={16} /> : <MdFavoriteBorder size={16} />}
                    <span className="font-black">{likeCount}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* BODY OF PRODUCT INFOS */}
                <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                  <p className="text-[8px] text-white/60 font-black uppercase tracking-widest mb-0.5">Ram</p>
                  <p className="text-xs font-bold text-white">{product.ram || 'N/A'}</p>
                </div>
                
                {/* ✅ STORAGE FIX: Grid-2 on Mobile, Flex on Desktop */}
                <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                  <p className="text-[8px] text-white/60 font-black uppercase tracking-widest mb-2">Storage</p>
                  <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1.5">
                    {product.storage?.map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setSelectedStorage(s)}
                        className={`px-2 py-1.5 md:py-0.5 rounded text-[10px] font-bold border transition-all text-center ${selectedStorage === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/20 text-white/60'}`}
                      >
                        {s}
                      </button>
                    ))}
                    {!product.storage && <p className="text-xs font-bold text-white">Standard</p>}
                  </div>
                </div>
              </div>

              {/* Feedback Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-black flex items-center gap-2 uppercase italic tracking-tighter text-white">
                    <MdChatBubble className="text-blue-500" size={16} /> Feedback
                  </h3>
                  
                  {user ? (
                    <div className="flex gap-2 ml-2 flex-1 max-w-[250px]">
                      <input 
                        type="text"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder={`Comment as ${user.displayName?.split(' ')[0]}...`} 
                        className="bg-white/5 border border-white/10 rounded-lg flex-1 px-3 py-2 text-[10px] text-white outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleSubmitReview}
                        className="bg-blue-600 p-1.5 rounded-lg text-white hover:bg-blue-700 transition disabled:opacity-50"
                        disabled={!reviewText.trim()}
                      >
                        <MdSend size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleSignIn} 
                      className="bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-white/20 transition"
                    >
                      Sign in to comment
                    </button>
                  )}
                </div>

                <div className="relative min-h-[120px] bg-white/5 rounded-lg p-4 border border-white/10 max-h-[220px] overflow-y-auto no-scrollbar">
                  <div className="space-y-3">
                    {product.reviews.map(r => (
                      <div key={r.id} className="border-b border-white/10 pb-2 last:border-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-bold text-blue-400">{r.userName}</span>
                          <div className="flex text-yellow-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <MdStar key={i} size={10} className={i < r.rating ? "text-yellow-400" : "text-gray-600"} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[11px] text-white leading-tight italic">"{r.comment}"</p>
                        <span className="text-[8px] text-gray-500 mt-1 block">{r.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ADD TO CART */}
              <button onClick={handleAddToCart} className="w-full bg-white text-black py-4 rounded-lg font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 hover:text-white transition-all shadow-lg flex items-center justify-center gap-2">
                <MdShoppingCart size={18} /> Add to Selection
              </button>

              {/* GSM Arena External Link */}
              <div className="mt-3">
                <a 
                  href={`https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-blue-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#eff3f6] flex items-center justify-center overflow-hidden">
                      {/* Simple GSMArena-style icon representation */}
                      <span className="text-[10px] font-black text-red-500">GSM</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white group-hover:text-blue-400 transition-colors">Full Technical Specifications</p>
                      <p className="text-[8px] text-white/40 uppercase tracking-widest font-black">View on GSMArena.com</p>
                    </div>
                  </div>
                  <div className="text-white/20 group-hover:text-blue-500 transition-colors">
                    <MdChevronRight size={20} />
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* YOU MAY ALSO LIKE SECTION */}
          <div className="p-6 md:p-8 bg-black/40 border-t border-white/10">
            <h2 className="text-lg font-black mb-6 italic uppercase tracking-tighter text-white">Suggested</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(item => (
                <button key={item.id} onClick={() => { router.push(`/product/${item.id}`); setSelectedThumb(item.thumbnails[0]); setSelectedStorage(item.storage?.[0] || ''); setReviewText(''); }} className="group bg-white/5 p-3 rounded-lg border border-white/10 hover:border-blue-500/50 transition-all text-left">
                  <div className="relative aspect-square mb-2 flex items-center justify-center overflow-hidden">
                    <Image src={item.thumbnails[0].imageUrl} fill className="object-contain group-hover:scale-105 transition-transform p-1.5" alt={item.name} />
                  </div>
                  <p className="text-white font-bold text-[10px] truncate uppercase tracking-tighter">{item.name}</p>
                  <p className="text-blue-400 font-black text-[10px] mt-0.5">₦{item.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {isPreviewOpen && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center">
            <button onClick={() => setIsPreviewOpen(false)} className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full z-[160]"><MdClose size={32} /></button>
            <button onClick={handlePrevImage} className="absolute left-4 md:left-10 text-white p-3 bg-white/5 hover:bg-white/10 rounded-full z-[160]"><MdChevronLeft size={40} /></button>
            <div className="relative w-[90vw] h-[80vh]"><Image src={selectedThumb.imageUrl} alt={product.name} fill className="object-contain" /></div>
            <button onClick={handleNextImage} className="absolute right-4 md:right-10 text-white p-3 bg-white/5 hover:bg-white/10 rounded-full z-[160]"><MdChevronRight size={40} /></button>
          </div>
        )}

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>
    </Suspense>
  );
}