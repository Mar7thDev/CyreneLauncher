import LanguagePage from '@/pages/language'
import FeatureGate from '@/components/featureGate'
import { createFileRoute } from '@tanstack/react-router'

function LanguageRoute() {
  return (
    <FeatureGate feature="languageTools">
      <LanguagePage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/language')({
  component: LanguageRoute,
})
