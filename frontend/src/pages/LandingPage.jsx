import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import LandingHeader from '../components/landing/LandingHeader'
import HeroSection from '../components/landing/HeroSection'
import CategorySection from '../components/landing/CategorySection'
import FeaturedGigsSection from '../components/landing/FeaturedGigsSection'
import HowItWorksSection from '../components/landing/HowItWorksSection'
import FeaturedFreelancersSection from '../components/landing/FeaturedFreelancersSection'
import FreelancerCTA from '../components/landing/FreelancerCTA'
import FinalCTA from '../components/landing/FinalCTA'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin/overview" replace />
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <HeroSection />
        <CategorySection />
        <FeaturedGigsSection />
        <HowItWorksSection />
        <FeaturedFreelancersSection />
        <FreelancerCTA />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
