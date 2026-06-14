import NewsPage from '@/pages/news'
import FeatureGate from '@/components/featureGate'
import { createFileRoute } from '@tanstack/react-router'

function NewsRoute() {
  return (
    <FeatureGate feature="news">
      <NewsPage />
    </FeatureGate>
  )
}

export const Route = createFileRoute('/news')({
  component: NewsRoute,
})
