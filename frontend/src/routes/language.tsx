import LanguagePage from '@/pages/language'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/language')({
  component: LanguagePage,
})

