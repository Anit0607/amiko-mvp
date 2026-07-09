'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CareBuddyPortal from '../../components/CareBuddyPortal';

export default function BuddyPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  // Synced states
  const [bookings, setBookings] = useState([]);
  const [walletBalance, setWalletBalance] = useState(18);

  const loadBackendState = async () => {
    try {
      // 1. Fetch active bookings (jobs)
      const bRes = await fetch('/api/bookings');
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }
    } catch (err) {
      console.error('Error fetching jobs details:', err);
    }
  };

  useEffect(() => {
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    
    const parsed = JSON.parse(rawSession);
    if (parsed.role !== 'buddy') {
      router.push(`/${parsed.role}`);
      return;
    }
    setSession(parsed);

    loadBackendState();

    const handleStorageChange = (e) => {
      if (e.key === 'amiko_bookings') {
        loadBackendState();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(loadBackendState, 4000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [router]);

  // Handle job status updates
  const updateBookings = async (newBks) => {
    // Find active job status change
    const currentActive = bookings.find(b => b.status === 'buddy_assigned' || b.status === 'buddy_en_route' || b.status === 'service_started');
    const updatedRecord = newBks.find(b => b.id === currentActive?.id);

    if (updatedRecord) {
      try {
        if (updatedRecord.status === 'buddy_en_route') {
          // Start Trip
          const res = await fetch(`/api/buddy/jobs/${updatedRecord.id}/start`, { method: 'POST' });
          if (res.ok) {
            localStorage.setItem('amiko_bookings', Date.now().toString());
            loadBackendState();
          }
        } else if (updatedRecord.status === 'service_started') {
          // Arrived check-in (simulate state locally or add endpoint)
          const dbData = localStorage.getItem('amiko_bookings') || '';
          localStorage.setItem('amiko_bookings', Date.now().toString());
          loadBackendState();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Complete job with physical OTP check
  const handleCompleteService = async (jobId, otp) => {
    try {
      const res = await fetch(`/api/buddy/jobs/${jobId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      if (res.ok) {
        localStorage.setItem('amiko_bookings', Date.now().toString());
        loadBackendState();
        alert('Helper passcode matched. Visit closed.');
        return true;
      } else {
        const err = await res.json();
        alert(err.error || 'Incorrect helper passcode');
        return false;
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Visit completion failed.');
      return false;
    }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking gates...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[36px] overflow-hidden shadow-2xl relative h-[740px] flex flex-col">
        <CareBuddyPortal
          bookings={bookings}
          setBookings={updateBookings}
          onCompleteService={handleCompleteService}
          walletBalance={walletBalance}
        />
      </div>
    </div>
  );
}
