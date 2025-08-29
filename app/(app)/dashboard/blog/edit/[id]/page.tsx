// This page will redirect to the content edit page since they share the same functionality
import { redirect } from 'next/navigation'

interface BlogEditPageProps {
  params: { id: string }
}

export default function BlogEditPage({ params }: BlogEditPageProps) {
  // Redirect to the content edit page since blog and content editing are the same
  redirect(`/dashboard/content/edit/${params.id}`)
}
