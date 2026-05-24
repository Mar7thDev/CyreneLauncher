import { createFileRoute } from '@tanstack/react-router'
import AnalysisPage from '@/pages/analysis'

export const Route = createFileRoute('/analysis')({
  component: AnalysisPage,
})

