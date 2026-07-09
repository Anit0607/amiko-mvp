'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GuardianDashboard from '../../components/GuardianDashboard';

export default function GuardianPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  //Synched states
  const [profile, setProfile] = useState(null);
  const [walletBalance, setWalletBalance] = useState(18);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);

  const loadBackendState = async (phone) => {
    try {
      // 1. Fetch linked elder's profile info
      const elderProfile = localStorage.getItem('amiko_registered_elder');
      if (elderProfile) {
        setProfile(JSON.parse(elderProfile));
      }

      // 2. Fetch wallet balance & transaction ledger
      const wRes = await fetch(`/api/wallet?phone=${encodeURIComponent(phone)}`);
      if (wRes.ok) {
        const wData = await wRes.json();
        setWalletBalance(wData.balance);
        setTransactions(wData.transactions || []);
      }

      // 3. Fetch elder's bookings
      const bRes = await fetch('/api/bookings?phone=+91+98765+43210'); // Default linked elder phone
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookings(bData.bookings || []);
      }

      // 4. Fetch active SOS alerts
      const sRes = await fetch('/api/sos');
      if (sRes.ok) {
        const sData = await sRes.json();
        const activeSos = sData.sos_events?.find(s => s.phone === '+91 98765 43210');
        setSosEvent(activeSos || null);
      }
    } catch (err) {
      console.error('Error fetching backend details:', err);
    }
  };

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

    loadBackendState(parsed.phone);

    // Synchronize tab updates
    const handleStorageChange = (e) => {
      if (e.key === 'amiko_bookings' || e.key === 'amiko_wallet_balance' || e.key === 'amiko_sos_event') {
        loadBackendState(parsed.phone);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Polling interval
    const interval = setInterval(() => loadBackendState(parsed.phone), 4000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [router]);

  // Handle simulated purchase webhook post to API
  const updateWallet = async (newBal) => {
    // Handled via payments webhook triggers
  };

  const updateTransactions = async (newTxs) => {
    if (!session) return;
    const latestTx = newTxs[0]; // GuardianDashboard adds the new purchase at index 0

    if (latestTx && latestTx.transaction_type === 'purchase') {
      try {
        // 1. Create order
        const oRes = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: latestTx.amount * 50, phone: session.phone })
        });

        if (oRes.ok) {
          const oData = await oRes.json();
          // 2. Dispatch webhook (Signature capturing)
          const wRes = await fetch('/api/payments/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: oData.order_id,
              coupons: latestTx.amount,
              phone: session.phone
            })
          });

          if (wRes.ok) {
            localStorage.setItem('amiko_wallet_balance', Date.now().toString());
            loadBackendState(session.phone);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
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
