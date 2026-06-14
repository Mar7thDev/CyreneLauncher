import { createFileRoute } from '@tanstack/react-router'
import AboutPage from '@/pages/about'
import FeatureGate from '@/components/featureGate'

function AboutRoute() {
  return (
    <FeatureGate feature="about">
      <AboutPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/about')({
  component: AboutRoute,
})
