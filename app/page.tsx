import dynamic from 'next/dynamic'
import { SiteHeader } from '@/components/landing/SiteHeader'
import { HeroSection } from '@/components/landing/HeroSection'
import { SiteFooter } from '@/components/landing/SiteFooter'

const LogoWall = dynamic(() => import('@/components/landing/LogoWall').then(m => m.LogoWall))
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection').then(m => m.FeaturesSection))
const HowItWorksSection = dynamic(() => import('@/components/landing/HowItWorksSection').then(m => m.HowItWorksSection))
const PricingSection = dynamic(() => import('@/components/landing/PricingSection').then(m => m.PricingSection))
const CtaSection = dynamic(() => import('@/components/landing/CtaSection').then(m => m.CtaSection))
const ScrollToTop = dynamic(() => import('@/components/landing/ScrollToTop').then(m => m.ScrollToTop))
const Chatbot = dynamic(() => import('@/components/landing/Chatbot').then(m => m.Chatbot))
const FreeCreditsPopup = dynamic(() => import('@/components/landing/FreeCreditsPopup').then(m => m.FreeCreditsPopup))

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1008] text-[#F5ECD7]">
      <SiteHeader />
      <main>
        <HeroSection />
        <LogoWall />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <CtaSection />
      </main>
      <SiteFooter />
      <ScrollToTop />
      <Chatbot />
      <FreeCreditsPopup />
    </div>
  )
}
