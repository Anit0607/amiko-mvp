'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElderPwa from '../../components/ElderPwa';

export default function ElderPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  
  // Backend synced states
  const [profile, setProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [walletBalance, setWalletBalance] = useState(18);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);
  
  const [settings, setSettings] = useState({
    fontSize: 'normal',
    contrastMode: false,
    voiceGuidance: false
  });

  const loadBackendState = async (phone) => {
    try {
      // 1. Fetch wallet balance & transaction history
      const wRes = await fetch(`/api/wallet?phone=${encodeURIComponent(phone)}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWalletBalance(wData.balance);
      }

      // 2. Fetch care bookings
      const bRes = await fetch(`/api/bookings?phone=${encodeURIComponent(phone)}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }

      // 3. Fetch active SOS events
      const sRes = await fetch('/api/sos');
      if (sRes.ok) {
        const sData = await sRes.json();
        const activeSos = sData.sos_events?.find(s => s.phone === phone);
        setSosEvent(activeSos || null);
      }
    } catch (err) {
      console.error('Error fetching backend details:', err);
    }
  };

  useEffect(() => {
    // 1. Role-Gating: Check Session
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    
    const parsed = JSON.parse(rawSession);
    if (parsed.role !== 'elder') {
      router.push(`/${parsed.role}`);
      return;
    }
    setSession(parsed);

    // 2. Load profile info
    const storedProfile = localStorage.getItem(`amiko_profile_${parsed.phone}`);
    if (storedProfile) {
      const prof = JSON.parse(storedProfile);
      setProfile(prof);
      setIsApproved(prof.status === 'active');
    } else {
      router.push('/onboarding');
      return;
    }

    loadBackendState(parsed.phone);

    // 3. Setup polling or cross-tab synchronization listener
    const handleStorageChange = (e) => {
      if (e.key === 'amiko_bookings' || e.key === 'amiko_wallet_balance' || e.key === 'amiko_sos_event') {
        loadBackendState(parsed.phone);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Polling interval to simulate database updates
    const interval = setInterval(() => loadBackendState(parsed.phone), 4000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [router]);

  // Create booking via POST API
  const updateBookings = async (newBks) => {
    if (!session) return;
    const latestBk = newBks[0]; // ElderPwa adds new bookings to index 0

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_label: latestBk.service_label,
          date: latestBk.scheduled_date,
          slot: latestBk.scheduled_time_slot,
          cost: latestBk.cost,
          phone: session.phone
        })
      });

      if (res.ok) {
        // Trigger cross-tab sync notify
        localStorage.setItem('amiko_bookings', Date.now().toString());
        loadBackendState(session.phone);
      } else {
        const err = await res.json();
        alert(err.error || 'Booking failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Booking failed.');
    }
  };

  // Simulated local wallet setters
  const updateWallet = async (newBal) => {
    setWalletBalance(newBal);
    localStorage.setItem('amiko_wallet_balance', newBal.toString());
  };

  const updateTransactions = (cb) => {
    // Handled in backend, local state stub
  };

  // Trigger SOS via POST API
  const updateSos = async (newSos) => {
    if (!session) return;

    try {
      if (newSos) {
        const res = await fetch('/api/sos/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: session.phone })
        });
        if (res.ok) {
          const data = await res.json();
          setSosEvent(data.sos);
          localStorage.setItem('amiko_sos_event', JSON.stringify(data.sos));
          router.push('/sos');
        }
      } else {
        if (sosEvent) {
          const res = await fetch(`/api/sos/${sosEvent.id}/resolve`, { method: 'POST' });
          if (res.ok) {
            setSosEvent(null);
            localStorage.removeItem('amiko_sos_event');
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!session || !profile) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking credentials...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-6">
      <div className="w-full max-w-md h-[740px] bg-white border border-slate-200 rounded-[36px] overflow-hidden shadow-2xl relative">
        <ElderPwa
          bookings={bookings}
          setBookings={updateBookings}
          walletBalance={walletBalance}
          setWalletBalance={updateWallet}
          setTransactions={updateTransactions}
          sosEvent={sosEvent}
          setSosEvent={updateSos}
          profile={profile}
          setProfile={setProfile}
          isApproved={isApproved}
          setIsApproved={setIsApproved}
          settings={settings}
          setSettings={setSettings}
        />
      </div>
    </div>
  );
}
