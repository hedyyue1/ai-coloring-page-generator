import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Text to Coloring Page",
  description: "Prepare one standard coloring page from an original adult-written theme.",
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="text" />
}
