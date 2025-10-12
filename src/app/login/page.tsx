'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LogIn, UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setIsLoading(true)
    setMessage(null)

    const authMethod = action === 'signIn' 
      ? supabase.auth.signInWithPassword
      : supabase.auth.signUp;
      
    const { error } = await authMethod({
      email,
      password,
      ...(action === 'signUp' && {
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
    }, }), })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (action === 'signIn') {
      router.push('/dashboard')
      router.refresh()
    } else {
      setMessage({ type: 'success', text: 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.' })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm relative overflow-hidden backdrop-blur-sm bg-card/80 dark:bg-card/50">
        {/* Borda superior que você criou */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
        
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Acesse a Plataforma
          </CardTitle>
          <CardDescription className="pt-1">
            Entre com seu e-mail e senha para continuar.
          </CardDescription>
        </CardHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signIn'); }}>
          <CardContent className="space-y-4">
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'error' 
                  ? 'bg-red-100/80 text-red-900 dark:bg-red-950/40 dark:text-red-300' 
                  : 'bg-green-100/80 text-green-900 dark:bg-green-950/40 dark:text-green-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="seu@email.com" 
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input 
                  id="password"
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••" 
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>

            <Button 
              onClick={() => handleAuthAction('signUp')}
              variant="outline" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Criar nova conta
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
) }