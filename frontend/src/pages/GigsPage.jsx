import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { Briefcase } from 'lucide-react'

export default function GigsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('gig.gigs')}</h1>
      <EmptyState
        icon={Briefcase}
        title={t('gig.noGigsFound')}
        description="Gigs page - Coming soon"
      />
    </div>
  )
}
