'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn, getSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { TwoFactorAuth } from './two-factor'
import type { AuthSessionType } from '@/lib/types/auth';
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react';

export function LoginForm() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [session, setSession] = React.useState<AuthSessionType | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loginAttempts, setLoginAttempts] = React.useState(0);
  const [lastAttemptTime, setLastAttemptTime] = React.useState<number | null>(null);
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  useEffect(() => {
    const checkSession = () => {
      if (session?.expires && Date.now() > new Date(session.expires).getTime()) {
        router.push('/login?session_expired=1');
      }
    };
    const interval = setInterval(checkSession, 60000);
    return () => clearInterval(interval);
  }, [session, router]);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        router.push('/login?session_expired=1');
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Add event listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('scroll', resetTimer);
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [router]);

  const roleRedirects = {
    admin: '/admin/dashboard',
    merchant: '/merchant/dashboard',
    customer: '/account'
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const result = await signIn('django', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setLoginAttempts(prev => prev + 1);
        toast({
          title: 'Error',
          description: 'Invalid credentials',
          variant: 'destructive'
        });
        return;
      }

      // Success - redirect based on user role
      const session = await getSession();
      
      if (session?.user?.role) {
        const roleRedirects = {
          admin: '/admin/dashboard',
          merchant: '/merchant/dashboard',
          customer: '/account'
        };
        const redirectPath = roleRedirects[session.user.role as keyof typeof roleRedirects] || '/account';
        router.push(redirectPath);
      } else {
        // If no role is found, redirect to a default page
        router.push('/account');
      }

    } catch (error) {
      setLoginAttempts(prev => prev + 1);
      toast({
        title: 'Error',
        description: 'Login failed',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (session) {
    return (
      <TwoFactorAuth 
        userId={session.user.id}
        phone={session.user.phone || ''}
        onSuccess={() => router.push('/dashboard')}
      />
    )
  }

  return (
    <div className="space-y-4">
      {error === 'insufficient_permissions' && (
        <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
          Insufficient permissions
        </div>
      )}
      {error === 'not_logged_in' && (
        <div className="text-destructive text-sm p-2 bg-destructive/10 rounded">
          Please log in first
        </div>
      )}
      {searchParams.get('session_expired') === '1' && (
        <div className="text-orange-600 text-sm p-2 bg-orange-50 border border-orange-200 rounded dark:text-orange-400 dark:bg-orange-950 dark:border-orange-800">
          Your session has expired. Please log in again.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      
      <Button 
        onClick={handleLogin}
        disabled={isLoading || !email || !password}
        className="w-full"
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </div>
  )
}
