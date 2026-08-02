import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Text to Coloring Page",
  description: "Create a printable coloring page from your own description.",
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="text" />
}
