import { createFileRoute } from '@tanstack/react-router'
import AnalysisPage from '@/pages/analysis'
import FeatureGate from '@/components/featureGate'

function AnalysisRoute() {
  return (
    <FeatureGate feature="analysis">
      <AnalysisPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/analysis')({
  component: AnalysisRoute,
})
