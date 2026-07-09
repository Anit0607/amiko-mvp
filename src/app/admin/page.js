'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsole from '../../components/AdminConsole';

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  //Synched states
  const [profile, setProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [walletBalance, setWalletBalance] = useState(18);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);

  const loadBackendState = async () => {
    try {
      // 1. Fetch registered elder
      const elderProfile = localStorage.getItem('amiko_registered_elder');
      if (elderProfile) {
        const prof = JSON.parse(elderProfile);
        setProfile(prof);
        setIsApproved(prof.status === 'active');
        
        // Fetch wallet balance for the linked elder's guardian
        const wRes = await fetch(`/api/wallet?phone=+91+98123+45678`); // Guardian phone
        if (wRes.ok) {
          const wData = await wRes.json();
          setWalletBalance(wData.balance);
        }
      }

      // 2. Fetch all bookings
      const bRes = await fetch('/api/bookings');
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }

      // 3. Fetch active SOS events
      const sRes = await fetch('/api/sos');
      if (sRes.ok) {
        const sData = await sRes.json();
        const activeSos = sData.sos_events?.find(s => s.phone === '+91 98765 43210');
        setSosEvent(activeSos || null);
      }
    } catch (err) {
      console.error('Error fetching admin states:', err);
    }
  };

  useEffect(() => {
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    
    const parsed = JSON.parse(rawSession);
    if (parsed.role !== 'admin') {
      router.push(`/${parsed.role}`);
      return;
    }
    setSession(parsed);

    loadBackendState();

    const handleStorageChange = (e) => {
      if (e.key === 'amiko_bookings' || e.key === 'amiko_wallet_balance' || e.key === 'amiko_sos_event') {
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

  // Admin approves elder registration
  const updateApproval = async (approved) => {
    if (!profile) return;
    try {
      const res = await fetch('/api/admin/approve-elder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ elder_phone: profile.phone })
      });

      if (res.ok) {
        setIsApproved(approved);
        const updated = { ...profile, status: approved ? 'active' : 'pending' };
        setProfile(updated);
        localStorage.setItem('amiko_registered_elder', JSON.stringify(updated));
        localStorage.setItem(`amiko_profile_${profile.phone}`, JSON.stringify(updated));
        
        // Notify other components
        localStorage.setItem('amiko_wallet_balance', Date.now().toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin assigns Care Buddy to booking
  const updateBookings = async (newBks) => {
    // Find the booking that has just been assigned a buddy
    const currentRequested = bookings.filter(b => b.status === 'requested');
    const updatedRecord = newBks.find(b => b.status === 'buddy_assigned');

    if (updatedRecord) {
      try {
        const res = await fetch(`/api/bookings/${updatedRecord.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ buddy_name: updatedRecord.buddy?.name })
        });
        if (res.ok) {
          localStorage.setItem('amiko_bookings', Date.now().toString());
          loadBackendState();
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // If admin creates booking on behalf of elder
      const latestBk = newBks[0];
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_label: latestBk.service_label,
            date: latestBk.scheduled_date,
            slot: latestBk.scheduled_time_slot,
            cost: latestBk.cost,
            phone: '+91 98765 43210' // Margaret phone
          })
        });

        if (res.ok) {
          localStorage.setItem('amiko_bookings', Date.now().toString());
          loadBackendState();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const updateWallet = async (newBal) => {
    // Manual adjustments
    try {
      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: `manual_adj_${Date.now()}`,
          coupons: 5,
          phone: '+91 98123 45678' // Sarah phone
        })
      });
      if (res.ok) {
        localStorage.setItem('amiko_wallet_balance', Date.now().toString());
        loadBackendState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateTransactions = (cb) => {
    // Audit logs handled server side
  };

  // Admin manages active SOS events
  const updateSos = async (newSos) => {
    if (!sosEvent) return;

    try {
      if (newSos && newSos.status === 'acknowledged') {
        const res = await fetch(`/api/sos/${sosEvent.id}/acknowledge`, { method: 'POST' });
        if (res.ok) {
          localStorage.setItem('amiko_sos_event', Date.now().toString());
          loadBackendState();
        }
      } else if (!newSos) {
        const res = await fetch(`/api/sos/${sosEvent.id}/resolve`, { method: 'POST' });
        if (res.ok) {
          setSosEvent(null);
          localStorage.removeItem('amiko_sos_event');
          localStorage.setItem('amiko_sos_event', Date.now().toString());
          loadBackendState();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking gates...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[740px]">
        <AdminConsole
          profile={profile}
          isApproved={isApproved}
          setIsApproved={updateApproval}
          bookings={bookings}
          setBookings={updateBookings}
          sosEvent={sosEvent}
          setSosEvent={updateSos}
          walletBalance={walletBalance}
          setWalletBalance={updateWallet}
          setTransactions={updateTransactions}
        />
      </div>
    </div>
  );
}
