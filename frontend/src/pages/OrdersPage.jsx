import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { ShoppingBag } from 'lucide-react'

export default function OrdersPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('order.myOrders')}</h1>
      <EmptyState
        icon={ShoppingBag}
        title={t('order.noOrdersFound')}
        description="Orders page - Coming soon"
      />
    </div>
  )
}
