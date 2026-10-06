import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">{t('common.settings', 'Settings')}</h1>
      <EmptyState
        icon={Settings}
        title={t('common.settings', 'Settings')}
        description="Settings page - Coming soon"
      />
    </div>
  )
}
