'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ElderPwa from '../../components/ElderPwa';

export default function ElderPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  
  // Storage synced states
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

  useEffect(() => {
    // 1. Role-Gating: Check Session
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    
    const parsed = JSON.parse(rawSession);
    if (parsed.role !== 'elder') {
      // Redirect to their actual role-gated route
      router.push(`/${parsed.role}`);
      return;
    }
    setSession(parsed);

    // 2. Load Local Data
    const loadState = () => {
      const storedProfile = localStorage.getItem(`amiko_profile_${parsed.phone}`);
      if (storedProfile) {
        const prof = JSON.parse(storedProfile);
        setProfile(prof);
        setIsApproved(prof.status === 'active');
      } else {
        router.push('/onboarding');
      }

      const bal = localStorage.getItem('amiko_wallet_balance');
      if (bal !== null) setWalletBalance(parseInt(bal));

      const bks = localStorage.getItem('amiko_bookings');
      if (bks) setBookings(JSON.parse(bks));

      const sos = localStorage.getItem('amiko_sos_event');
      if (sos) setSosEvent(JSON.parse(sos));
    };

    loadState();

    // 3. Storage Synced Tab Listener
    const handleStorageChange = (e) => {
      if (e.key === 'amiko_wallet_balance' && e.newValue !== null) {
        setWalletBalance(parseInt(e.newValue));
      }
      if (e.key === 'amiko_bookings' && e.newValue) {
        setBookings(JSON.parse(e.newValue));
      }
      if (e.key === 'amiko_sos_event') {
        setSosEvent(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === `amiko_profile_${parsed.phone}` && e.newValue) {
        const prof = JSON.parse(e.newValue);
        setProfile(prof);
        setIsApproved(prof.status === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  // Set local state triggers that update storage
  const updateBookings = (newBks) => {
    setBookings(newBks);
    localStorage.setItem('amiko_bookings', JSON.stringify(newBks));
  };

  const updateWallet = (newBal) => {
    setWalletBalance(newBal);
    localStorage.setItem('amiko_wallet_balance', newBal.toString());
  };

  const updateTransactions = (cb) => {
    const rawTx = localStorage.getItem('amiko_transactions') || '[]';
    const txList = JSON.parse(rawTx);
    const updated = cb(txList);
    localStorage.setItem('amiko_transactions', JSON.stringify(updated));
  };

  const updateSos = (newSos) => {
    setSosEvent(newSos);
    if (newSos) {
      localStorage.setItem('amiko_sos_event', JSON.stringify(newSos));
      // Automatically redirect to SOS route
      router.push('/sos');
    } else {
      localStorage.removeItem('amiko_sos_event');
    }
  };

  if (!session || !profile) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking gates...</div>;

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
