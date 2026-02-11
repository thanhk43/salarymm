'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
})

type LoginFormData = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email hoặc mật khẩu không đúng')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="email@example.com"
          autoComplete="email"
          disabled={isLoading}
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={isLoading}
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          'Đăng nhập'
        )}
      </Button>
    </form>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/30" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, oklch(0.7 0.02 260) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <Card className="relative z-10 w-full max-w-[420px] border-0 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mb-6 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground shadow-md shadow-primary/20">
              S
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">SalaryMM</CardTitle>
          <CardDescription className="text-balance">
            Hệ thống quản lý lương nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>

          <div className="mt-8 rounded-lg bg-muted/50 p-3">
            <p className="text-center text-xs font-medium text-muted-foreground mb-2">
              Tài khoản demo
            </p>
            <div className="space-y-1 text-center text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground/70">Admin:</span>{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">admin@salarymm.com</code>{' '}
                / admin123
              </p>
              <p>
                <span className="font-medium text-foreground/70">Employee:</span>{' '}
                <code className="rounded bg-muted px-1 py-0.5 text-[11px]">nguyenvana@salarymm.com</code>{' '}
                / employee123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
