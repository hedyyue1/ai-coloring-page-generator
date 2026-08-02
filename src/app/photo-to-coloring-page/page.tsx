import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Photo to Coloring Page",
  description: "Prepare one standard coloring page from a photo you own or are authorized to use.",
}

import { ToolPage } from '@/screens/ToolPages'

export default function Page() {
  return <ToolPage mode="photo" />
}
