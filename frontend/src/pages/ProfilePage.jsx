import { useTranslation } from 'react-i18next'

export default function ProfilePage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('freelancer.myProfile')}</h1>
      <p>Profile page - Coming soon</p>
    </div>
  )
}
