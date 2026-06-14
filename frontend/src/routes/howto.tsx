import { createFileRoute } from '@tanstack/react-router'
import HowToPage from '@/pages/howto'
import FeatureGate from '@/components/featureGate'

function HowToRoute() {
  return (
    <FeatureGate feature="howTo">
      <HowToPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/howto')({
  component: HowToRoute,
})
