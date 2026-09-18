import { useTranslation } from 'react-i18next'
import { Button } from '../components/ui'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">{t('error.pageNotFound')}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button onClick={() => window.location.href = '/'}>
        <Home className="h-4 w-4 mr-2" />
        {t('nav.home')}
      </Button>
    </div>
  )
}
