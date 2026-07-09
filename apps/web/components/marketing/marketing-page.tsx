import { MarketingCta } from '@/components/marketing/cta';
import { MarketingFaq } from '@/components/marketing/faq';
import { MarketingFeatures } from '@/components/marketing/features';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingHero } from '@/components/marketing/hero';
import { MarketingPricing } from '@/components/marketing/pricing';
import { SiteHeader } from '@/components/marketing/site-header';

export function MarketingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteHeader />
      <main>
        <MarketingHero />
        <MarketingFeatures />
        <MarketingPricing />
        <MarketingFaq />
        <MarketingCta />
      </main>
      <MarketingFooter />
    </div>
  );
}
