'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface Article {
  title: string;
  url: string;
  urlToImage: string;
  source: { name: string };
  description: string;
}

const NewsSection = () => {
  const [news, setNews] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<'mobile' | 'technology'>('mobile');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/news?category=${activeTab}`);
        const data = await res.json();
        if (Array.isArray(data)) setNews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [activeTab]);

  return (
    <section className="py-10 md:py-20 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header & Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold text-[#1A1A1A]">Tech Pulse</h2>
            <p className="text-sm text-[#1A1A1A]/40 mt-1 uppercase tracking-widest font-bold">A.B.S.T Global Concept</p>
          </div>

          <div className="flex bg-black/5 p-1 rounded-lg w-fit">
            {(['mobile', 'technology'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab 
                    ? 'bg-[#1A1A1A] text-white shadow-md' 
                    : 'text-[#1A1A1A]/40 hover:text-[#1A1A1A]'
                }`}
              >
                {tab === 'mobile' ? 'Mobile' : 'Technology'}
              </button>
            ))}
          </div>
        </div>

        {/* News Grid: 2 columns on desktop, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-32 w-full bg-black/5 animate-pulse rounded-lg" />
              ))
            ) : (
              news.map((article, idx) => (
                <motion.a
                  key={article.url}
                  href={article.url}
                  target="_blank"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex bg-white rounded-lg overflow-hidden border border-black/5 hover:border-purple-200 hover:shadow-sm transition-all group h-32"
                >
                  {/* Fixed Image Square */}
                  <div className="relative w-32 h-full flex-shrink-0 bg-gray-100">
                    {article.urlToImage ? (
                      <Image 
                        src={article.urlToImage} 
                        alt="News" 
                        fill 
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-black/20 uppercase font-black">No Image</div>
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="p-4 flex flex-col justify-center overflow-hidden">
                    <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1">
                      {article.source.name}
                    </p>
                    <h3 className="text-sm font-bold text-[#1A1A1A] line-clamp-2 leading-snug group-hover:text-purple-700">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-[#1A1A1A]/50 mt-1 line-clamp-1">
                      {article.description}
                    </p>
                  </div>
                </motion.a>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;