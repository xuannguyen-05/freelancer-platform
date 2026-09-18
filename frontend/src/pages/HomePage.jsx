import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui'
import { Search, Briefcase, Users, Star } from 'lucide-react'

export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4 text-foreground">
          Find the Perfect Freelancer
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Connect with talented freelancers for your projects. Get quality work done on time and on budget.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg">{t('auth.register')}</Button>
          <Button variant="outline" size="lg">{t('auth.login')}</Button>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            type="text"
            placeholder={t('gig.searchGigs')}
            className="w-full pl-12 pr-4 py-4 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {t('common.search')}
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-6">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-primary-600" />
          <h3 className="text-xl font-semibold mb-2">Find Gigs</h3>
          <p className="text-muted-foreground">Browse thousands of gigs from talented freelancers</p>
        </div>
        <div className="text-center p-6">
          <Users className="h-12 w-12 mx-auto mb-4 text-primary-600" />
          <h3 className="text-xl font-semibold mb-2">Hire Experts</h3>
          <p className="text-muted-foreground">Connect with verified professionals for your projects</p>
        </div>
        <div className="text-center p-6">
          <Star className="h-12 w-12 mx-auto mb-4 text-primary-600" />
          <h3 className="text-xl font-semibold mb-2">Get Results</h3>
          <p className="text-muted-foreground">Quality work delivered on time, every time</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-50 rounded-lg p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-muted-foreground mb-6">
          Join thousands of freelancers and buyers on Freelink today
        </p>
        <Button size="lg">{t('auth.register')}</Button>
      </section>
    </div>
  )
}
