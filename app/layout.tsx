import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/components/CartContext';
import NewsSection from '@/components/NewsSection';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import { Toaster } from 'react-hot-toast';
import SiteReviews from '@/components/Reviews';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MobileStore - Your Ultimate Phone Shop',
  description: 'Discover the latest smartphones and accessories',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          {/* Toaster added with high z-index to show above overlays */}
          <Nav/>
          {children}
          <NewsSection/>
          <SiteReviews/>
          <Footer/>
        </CartProvider>
        <Toaster 
          position="top-center"
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
              fontSize: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)'
            },
          }}
        />
      </body>
    </html>
  );
}