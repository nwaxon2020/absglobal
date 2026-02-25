'use client';

import HeroSection from '@/components/home/HeroSection';
import PromoSection from '@/components/home/PromoSection';
import LatestPhones from '@/components/home/LatestPhones';
import InstallmentSection from '@/components/home/InstallmentSection';

export default function HomePageUi() {
  return (
    <>
      <main>
        <HeroSection />
        <PromoSection />
        <LatestPhones />
        <InstallmentSection />
      </main>
    </>
  );
}