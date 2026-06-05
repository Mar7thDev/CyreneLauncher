import { createFileRoute } from '@tanstack/react-router'
import ConsolePage from '@/pages/console'

export const Route = createFileRoute('/console')({
  component: ConsolePage,
})
