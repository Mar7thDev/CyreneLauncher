import DiffPage from '@/pages/diff'
import FeatureGate from '@/components/featureGate'
import { createFileRoute } from '@tanstack/react-router'

function DiffRoute() {
  return (
    <FeatureGate feature="diffTools">
      <DiffPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/diff')({
  component: DiffRoute,
})
