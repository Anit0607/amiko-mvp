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

    // Initial state loading
    const loadState = () => {
      const bal = localStorage.getItem('amiko_wallet_balance');
      if (bal !== null) setWalletBalance(parseInt(bal));

      const bks = localStorage.getItem('amiko_bookings');
      if (bks) setBookings(JSON.parse(bks));
    };

    loadState();

    // Sync tab status updates
    const handleStorageChange = (e) => {
      if (e.key === 'amiko_wallet_balance' && e.newValue !== null) {
        setWalletBalance(parseInt(e.newValue));
      }
      if (e.key === 'amiko_bookings' && e.newValue) {
        setBookings(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  const updateBookings = (newBks) => {
    setBookings(newBks);
    localStorage.setItem('amiko_bookings', JSON.stringify(newBks));
  };

  const updateTransactions = (cb) => {
    const rawTx = localStorage.getItem('amiko_transactions') || '[]';
    const txList = JSON.parse(rawTx);
    const updated = cb(txList);
    localStorage.setItem('amiko_transactions', JSON.stringify(updated));
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking gates...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-[36px] overflow-hidden shadow-2xl relative h-[740px] flex flex-col">
        <CareBuddyPortal
          bookings={bookings}
          setBookings={updateBookings}
          setTransactions={updateTransactions}
          walletBalance={walletBalance}
        />
      </div>
    </div>
  );
}
