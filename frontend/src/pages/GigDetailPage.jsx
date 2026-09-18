import { useTranslation } from 'react-i18next'

export default function GigDetailPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('gig.gigDetails')}</h1>
      <p>Gig detail page - Coming soon</p>
    </div>
  )
}
