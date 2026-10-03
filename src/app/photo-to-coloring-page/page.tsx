import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Photo to Coloring Page",
  description: "Prepare one standard coloring page from a photo you own or are authorized to use.",
  alternates: { canonical: '/photo-to-coloring-page' },
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="photo" />
}
