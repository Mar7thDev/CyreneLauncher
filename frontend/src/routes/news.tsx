import NewsPage from '@/pages/news'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/news')({
  component: NewsPage,
})
