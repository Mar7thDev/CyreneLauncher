import DiffPage from '@/pages/diff'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/diff')({
  component: DiffPage,
})

