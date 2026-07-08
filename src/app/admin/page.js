'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminConsole from '../../components/AdminConsole';

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  // Synced states
  const [profile, setProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [walletBalance, setWalletBalance] = useState(18);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);

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

    // Initial state loading
    const loadState = () => {
      const elderProfile = localStorage.getItem('amiko_registered_elder');
      if (elderProfile) {
        const prof = JSON.parse(elderProfile);
        setProfile(prof);
        setIsApproved(prof.status === 'active');
      }

      const bal = localStorage.getItem('amiko_wallet_balance');
      if (bal !== null) setWalletBalance(parseInt(bal));

      const bks = localStorage.getItem('amiko_bookings');
      if (bks) setBookings(JSON.parse(bks));

      const sos = localStorage.getItem('amiko_sos_event');
      if (sos) setSosEvent(JSON.parse(sos));
    };

    loadState();

    // Cross-tab storage updates
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
      if (e.key === 'amiko_registered_elder' && e.newValue) {
        const prof = JSON.parse(e.newValue);
        setProfile(prof);
        setIsApproved(prof.status === 'active');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const updateApproval = (approved) => {
    setIsApproved(approved);
    if (profile) {
      const updated = { ...profile, status: approved ? 'active' : 'pending' };
      setProfile(updated);
      localStorage.setItem('amiko_registered_elder', JSON.stringify(updated));
      // Also update under their phone number
      localStorage.setItem(`amiko_profile_${profile.phone}`, JSON.stringify(updated));
    }
  };

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
    } else {
      localStorage.removeItem('amiko_sos_event');
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
