import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { LayoutDashboard } from 'lucide-react'

export default function DashboardPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('nav.dashboard')}</h1>
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard - Coming soon"
        description="Your dashboard will show your activity and statistics"
      />
    </div>
  )
}
