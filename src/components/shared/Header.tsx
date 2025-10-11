import Link from 'next/link'
import { createServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { signOut } from '@/app/actions'

export default async function Header() {
  const supabase = await createServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="w-full bg-card border-b sticky top-0 z-10">
      <nav className="container mx-auto flex items-center justify-between p-4">

        <Link href={user ? "/dashboard" : "/"} className="text-xl font-bold text-primary hover:opacity-80 transition-opacity">
          StudyPlatform
        </Link>


        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.email}
              </span>
              <form action={signOut}>
                <Button variant="outline" size="sm">Logout</Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
) }