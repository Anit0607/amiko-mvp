'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user session exists in client local storage
    const rawSession = localStorage.getItem('amiko_session');
    
    if (rawSession) {
      try {
        const { role, authenticated } = JSON.parse(rawSession);
        if (authenticated && role) {
          // Gated redirection based on active role
          router.replace(`/${role}`);
          return;
        }
      } catch (e) {
        console.error('Session parse error:', e);
      }
    }

    // Default fallback is login gate
    router.replace('/auth');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-500">
      Loading Amiko...
    </div>
  );
}
