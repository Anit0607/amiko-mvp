'use client';

import React, { useState } from 'react';
import { 
  Check, Play, Navigation, CheckSquare, Upload, Phone, AlertTriangle, Wallet 
} from 'lucide-react';

export default function CareBuddyPortal({
  bookings,
  setBookings,
  setTransactions,
  walletBalance
}) {
  const [otpInput, setOtpInput] = useState('');
  const [buddyEarnings, setBuddyEarnings] = useState(1200.00); // rupees
  const [buddySettlements, setBuddySettlements] = useState(800.00);

  const activeJob = bookings.find(b => b.status === 'buddy_assigned' || b.status === 'buddy_en_route' || b.status === 'service_started');

  const handleStartTrip = () => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === activeJob.id) {
        return { ...bk, status: 'buddy_en_route' };
      }
      return bk;
    }));
  };

  const handleStartService = () => {
    setBookings(prev => prev.map(bk => {
      if (bk.id === activeJob.id) {
        return { ...bk, status: 'service_started' };
      }
      return bk;
    }));
  };

  const handleCompleteService = (e) => {
    e.preventDefault();
    if (otpInput !== activeJob.otp) {
      alert('Verification OTP does not match. Please verify with Margaret.');
      return;
    }

    setBookings(prev => prev.map(bk => {
      if (bk.id === activeJob.id) {
        return { ...bk, status: 'service_completed' };
      }
      return bk;
    }));

    const payout = activeJob.cost * 40;
    setBuddyEarnings(prev => prev + payout);
    setOtpInput('');
    alert(`OTP Verified. Visit completed. Payout of ₹${payout} credited.`);
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto screen-scroll space-y-6">
      
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Care Buddy App</span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Ravi Kumar</h1>
        </div>
        <div className="h-12 px-5 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-2xl flex items-center gap-2 shadow-sm shadow-blue-500/10">
          <Wallet className="h-5 w-5" />
          <span className="text-sm font-black">₹{buddyEarnings.toFixed(2)} Earned</span>
        </div>
      </div>

      {/* 2. Active job details */}
      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-4">Assigned Task</h2>
        {activeJob ? (
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start pb-3 border-b dark:border-slate-800">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400">Elder Client</span>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mt-1">Margaret Wilson</h3>
                <p className="text-xs text-slate-400 font-semibold">{activeJob.address}</p>
              </div>
              <span className="text-[9px] font-black uppercase bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-xl">
                {activeJob.status.replace('_', ' ')}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Service:</strong> {activeJob.service_label}</p>
              <p><strong>Schedule:</strong> {activeJob.scheduled_date} ({activeJob.scheduled_time_slot})</p>
              <p><strong>Payout Rate:</strong> ₹{(activeJob.cost * 40).toFixed(2)} (80% of coupons value)</p>
            </div>

            <div className="space-y-2 pt-2">
              {activeJob.status === 'buddy_assigned' && (
                <button 
                  onClick={handleStartTrip}
                  className="w-full btn-primary h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Play className="h-4 w-4" /> Start Trip (GPS Tracker Enabled)
                </button>
              )}
              {activeJob.status === 'buddy_en_route' && (
                <button 
                  onClick={handleStartService}
                  className="w-full btn-primary h-12 bg-gradient-to-r from-blue-500 to-sky-600 hover:from-blue-600 hover:to-sky-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CheckSquare className="h-4 w-4" /> Check In (Arrived at Location)
                </button>
              )}
              {activeJob.status === 'service_started' && (
                <form onSubmit={handleCompleteService} className="space-y-3">
                  <div className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-4 rounded-2xl space-y-2 text-xs">
                    <label className="text-xs font-bold text-slate-500 block">Input Verification OTP</label>
                    <input 
                      type="text" 
                      value={otpInput} 
                      onChange={e => setOtpInput(e.target.value)}
                      placeholder="Enter 4-digit code from Margaret"
                      required
                      className="w-full h-12 px-3 border dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-center font-bold text-lg tracking-widest outline-none focus:border-orange-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full btn-primary h-12 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Upload className="h-4 w-4" /> Complete &amp; Verify Service
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-12 text-center bg-white dark:bg-slate-900 border dark:border-slate-800 border-dashed rounded-3xl">No tasks assigned. Operations system nominal.</p>
        )}
      </div>

      {/* 3. Payout reports */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
        <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Earnings Ledger</h2>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
            <span className="text-slate-500">Settled Balance (Transferred)</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">₹{buddySettlements.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b dark:border-slate-800">
            <span className="text-slate-500">Pending Balance (Unsettled)</span>
            <span className="font-bold text-orange-600">₹{(buddyEarnings - buddySettlements).toFixed(2)}</span>
          </div>
          <button 
            onClick={() => {
              setBuddySettlements(buddyEarnings);
              alert('Earnings settlement initiated.');
            }}
            className="w-full h-11 border dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
          >
            Request Settlement Payout
          </button>
        </div>
      </div>

    </div>
  );
}
