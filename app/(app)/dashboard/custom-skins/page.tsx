import { redirect } from 'next/navigation'

export default function CustomSkinsPage() {
  // Redirect to approved skins page as the main custom skins page
  redirect('/dashboard/custom-skins/approved')
}