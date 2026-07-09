'use client';

import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingFaq } from '@/components/landing/LandingFaq';
import { LandingCta, LandingFooter } from '@/components/landing/LandingFooter';

function ReceiptTear() {
  return <hr className="receipt-tear" aria-hidden />;
}

export function LandingPage() {
  return (
    <div className="landing-theme min-h-dvh flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <ReceiptTear />
        <LandingFeatures />
        <ReceiptTear />
        <LandingPricing />
        <ReceiptTear />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
