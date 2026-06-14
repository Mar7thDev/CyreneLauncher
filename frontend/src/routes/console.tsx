import { createFileRoute } from '@tanstack/react-router'
import ConsolePage from '@/pages/console'
import FeatureGate from '@/components/featureGate'

function ConsoleRoute() {
  return (
    <FeatureGate feature="console">
      <ConsolePage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/console')({
  component: ConsoleRoute,
})
