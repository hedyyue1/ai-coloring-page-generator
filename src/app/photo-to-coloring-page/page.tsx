import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Photo to Coloring Page",
  description: "Turn a favorite photo into a clean, printable coloring page.",
  alternates: { canonical: '/photo-to-coloring-page' },
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="photo" />
}
