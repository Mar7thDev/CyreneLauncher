import { createFileRoute } from '@tanstack/react-router'
import HowToPage from '@/pages/howto'

export const Route = createFileRoute('/howto')({
  component: HowToPage,
})
