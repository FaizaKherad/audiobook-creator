'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const image = searchParams.get('image');

    if (email) {
      login(email, name || '', image || '');
      router.push('/');
    } else {
      router.push('/auth?error=missing_user_info');
    }
  }, [email, name, image, login, router, searchParams]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-lg font-medium text-foreground">Completing sign in...</p>
    </div>
  );
}
