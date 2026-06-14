import FireflyToolsPage from '@/pages/fireflytools'
import FeatureGate from '@/components/featureGate'
import { createFileRoute } from '@tanstack/react-router'

function SrToolsRoute() {
  return (
    <FeatureGate feature="srTools">
      <FireflyToolsPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/srtools')({
  component: SrToolsRoute,
})

