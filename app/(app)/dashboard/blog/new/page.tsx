// This page will redirect to the content new page since they share the same functionality
import { redirect } from 'next/navigation'

export default function BlogNewPage() {
  // Redirect to the content new page since blog and content creation are the same
  redirect('/dashboard/content/new')
}
