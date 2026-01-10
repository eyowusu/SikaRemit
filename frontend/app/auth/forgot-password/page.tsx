'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 text-center">Reset your password</h1>
      <p className="mt-2 text-sm text-gray-600 text-center">
        Enter your email and we'll send you a link to reset your password
      </p>

      <div className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
          />
        </div>

        <Button className="w-full">
          Send Reset Link
        </Button>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </>
  )
}
