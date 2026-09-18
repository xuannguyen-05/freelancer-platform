import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { MessageSquare } from 'lucide-react'

export default function MessagesPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('message.messages')}</h1>
      <EmptyState
        icon={MessageSquare}
        title={t('message.noMessagesFound')}
        description="Messages page - Coming soon"
      />
    </div>
  )
}
