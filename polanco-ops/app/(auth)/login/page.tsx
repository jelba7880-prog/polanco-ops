'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password. Try again.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/polanco-logo.png"
            alt="Polanco Exotic Cars"
            width={160}
            height={64}
            className="object-contain"
            priority
          />
        </div>

        {/* Gold divider */}
        <div className="h-px bg-gold mb-6 opacity-40" />

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-ink mb-1">
            Operations Hub
          </h1>
          <p className="font-inter text-sm text-ink-muted">
            Polanco Exotic Cars · Lekki
          </p>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@polanco.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
          />

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 bottom-3 text-ink-muted hover:text-ink transition-all duration-150 ease-out active:scale-[0.97]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-danger font-inter text-center">
              {error}
            </p>
          )}

          <Button
            onClick={handleSignIn}
            loading={loading}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-ink-muted font-inter mt-8">
          Access is by invitation only.
        </p>

      </div>
    </div>
  )
}
