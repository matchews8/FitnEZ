// Root page — just redirects the user to the right place.
// The middleware handles most routing, but this catches the "/" path.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/reserve')
  } else {
    redirect('/login')
  }
}
