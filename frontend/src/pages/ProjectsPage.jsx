import { useTranslation } from 'react-i18next'
import { EmptyState } from '../components/ui'
import { FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('project.myProjects')}</h1>
      <EmptyState
        icon={FolderKanban}
        title={t('project.noProjectsFound')}
        description="Projects page - Coming soon"
      />
    </div>
  )
}
