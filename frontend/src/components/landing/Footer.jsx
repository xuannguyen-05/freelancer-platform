import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Link2, Mail } from 'lucide-react'
import Brand from '../common/Brand'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-border bg-card px-4 py-7 sm:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-7 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr] md:gap-10">
          <div>
            <Brand size="md" />
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{t('landing.footer.slogan')}</p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-foreground">{t('landing.footer.explore')}</h2>
            <nav className="mt-3 flex flex-col items-start gap-2.5 text-sm" aria-label={t('landing.footer.explore')}>
              <a href="#how-it-works" className="text-muted-foreground transition-colors hover:text-primary-600">{t('landing.footer.howItWorks')}</a>
              <Link to="/app/gigs" className="text-muted-foreground transition-colors hover:text-primary-600">{t('landing.footer.gigs')}</Link>
              <a href="#categories" className="text-muted-foreground transition-colors hover:text-primary-600">{t('landing.footer.categories')}</a>
            </nav>
          </div>

          <div>
            <h2 className="text-sm font-bold text-foreground">{t('landing.footer.contactHeading')}</h2>
            <nav className="mt-3 flex flex-col items-start gap-2.5 text-sm" aria-label={t('landing.footer.contactHeading')}>
              <a href="mailto:xuannguyen2152005@gmail.com" className="flex max-w-full items-center gap-2 break-all text-muted-foreground transition-colors hover:text-primary-600">
                <Mail className="h-4 w-4 shrink-0 text-primary-500" />
                <span>{t('landing.footer.email')}</span>
              </a>
              <a href="https://github.com/xuannguyen-05/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary-600">
                <Link2 className="h-4 w-4 shrink-0 text-primary-500" />
                <span>{t('landing.footer.github')}</span>
              </a>
              <a href="https://www.linkedin.com/in/nguyenpham05/" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary-600">
                <Link2 className="h-4 w-4 shrink-0 text-primary-500" />
                <span>{t('landing.footer.linkedin')}</span>
              </a>
            </nav>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-4 text-center text-sm text-muted-foreground md:text-left">
          {t('landing.footer.copyright')}
        </div>
      </div>
    </footer>
  )
}
