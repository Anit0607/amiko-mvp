'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GuardianDashboard from '../../components/GuardianDashboard';

export default function GuardianPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  // Synced states
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(18);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);

  useEffect(() => {
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    
    const parsed = JSON.parse(rawSession);
    if (parsed.role !== 'guardian') {
      router.push(`/${parsed.role}`);
      return;
    }
    setSession(parsed);

    // Initial state loading
    const loadState = () => {
      // Find linked elder's profile details
      const elderProfile = localStorage.getItem('amiko_registered_elder');
      if (elderProfile) {
        setProfile(JSON.parse(elderProfile));
      }

      const bal = localStorage.getItem('amiko_wallet_balance');
      if (bal !== null) setWalletBalance(parseInt(bal));

      const txs = localStorage.getItem('amiko_transactions');
      if (txs) setTransactions(JSON.parse(txs));

      const bks = localStorage.getItem('amiko_bookings');
      if (bks) setBookings(JSON.parse(bks));

      const sos = localStorage.getItem('amiko_sos_event');
      if (sos) setSosEvent(JSON.parse(sos));
    };

    loadState();

    // Sync state updates across tabs
    const handleStorageChange = (e) => {
      if (e.key === 'amiko_wallet_balance' && e.newValue !== null) {
        setWalletBalance(parseInt(e.newValue));
      }
      if (e.key === 'amiko_transactions' && e.newValue) {
        setTransactions(JSON.parse(e.newValue));
      }
      if (e.key === 'amiko_bookings' && e.newValue) {
        setBookings(JSON.parse(e.newValue));
      }
      if (e.key === 'amiko_sos_event') {
        setSosEvent(e.newValue ? JSON.parse(e.newValue) : null);
      }
      if (e.key === 'amiko_registered_elder' && e.newValue) {
        setProfile(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const updateWallet = (newBal) => {
    setWalletBalance(newBal);
    localStorage.setItem('amiko_wallet_balance', newBal.toString());
  };

  const updateTransactions = (newTxs) => {
    setTransactions(newTxs);
    localStorage.setItem('amiko_transactions', JSON.stringify(newTxs));
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking gates...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[740px]">
        <GuardianDashboard
          profile={profile}
          walletBalance={walletBalance}
          setWalletBalance={updateWallet}
          transactions={transactions}
          setTransactions={updateTransactions}
          bookings={bookings}
          sosEvent={sosEvent}
        />
      </div>
    </div>
  );
}
