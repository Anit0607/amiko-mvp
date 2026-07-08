'use client';

import React, { useState, useEffect } from 'react';
import { Heart, Users, ShieldCheck, UserCheck, ShieldAlert, LogOut, ArrowRight } from 'lucide-react';
import ElderPwa from '../components/ElderPwa';
import GuardianDashboard from '../components/GuardianDashboard';
import AdminConsole from '../components/AdminConsole';
import CareBuddyPortal from '../components/CareBuddyPortal';

export default function HomePage() {
  const [session, setSession] = useState(null); // null or { role: 'elder' | 'guardian' | 'admin' | 'buddy' }

  // Global shared state syncing with DB/localStorage
  const [profile, setProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [walletBalance, setWalletBalance] = useState(18);
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);
  
  const [settings, setSettings] = useState({
    fontSize: 'normal',
    contrastMode: false,
    voiceGuidance: false
  });

  // Seed default data for testability
  useEffect(() => {
    setTransactions([
      {
        id: crypto.randomUUID(),
        booking_id: null,
        amount: 20,
        transaction_type: 'purchase',
        invoice_number: 'INV-2026-8802',
        reference_id: 'pay_ord_100223',
        notes: 'Initial Pack Purchase: 20 Coupons',
        created_at: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        booking_id: 'b-default',
        amount: -2,
        transaction_type: 'booking_debit',
        notes: 'BP Check (Completed)',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]);

    setBookings([
      {
        id: 'b-default',
        service_label: 'BP Check',
        category_id: 'health',
        scheduled_date: 'Yesterday',
        scheduled_time_slot: 'Morning (8–11)',
        address: '42 Rose Garden, MG Road',
        status: 'service_completed',
        cost: 2,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        buddy: { name: 'Ravi Kumar', rating: '4.9' },
        otp: '4401'
      }
    ]);

    setProfile({
      full_name: 'Margaret Wilson',
      age: 74,
      phone: '+91 98765 43210',
      address: '42 Rose Garden, MG Road',
      city_locality: 'Bengaluru',
      medical_conditions: 'Hypertension',
      guardian_name: 'Sarah Wilson',
      guardian_phone: '+91 98123 45678',
      guardian_email: 'sarah@example.com',
      guardian_relationship: 'Daughter'
    });
    setIsApproved(true);
  }, []);

  const handleRoleSelect = (role) => {
    setSession({ role });
  };

  const handleSignOut = () => {
    setSession(null);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${settings.contrastMode ? 'high-contrast' : ''}`}>
      
      {/* 1. Landing Screen (Role Login Selector) */}
      {!session && (
        <div className="flex-1 bg-gradient-to-br from-orange-50/60 via-white to-slate-50 flex flex-col justify-center items-center p-6 md:p-12">
          <div className="max-w-3xl w-full text-center space-y-6 animate-fade-in">
            <div className="h-16 w-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-3xl flex items-center justify-center text-white shadow-md mx-auto">
              <Heart className="h-9 w-9 fill-white/10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight font-headers">Amiko Companion Errands Care</h1>
              <p className="text-sm md:text-base font-semibold text-slate-500 max-w-xl mx-auto leading-relaxed">
                Dedicated daily errand assistance and accompanied outings for elder citizens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 text-left">
              
              {/* Elder App */}
              <button 
                onClick={() => handleRoleSelect('elder')}
                className="bg-white border hover:border-orange-500 p-6 rounded-3xl transition-all flex items-start gap-4 hover:shadow-sm"
              >
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Heart className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Elder Client Portal</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">Request care helper buddies, speak requests, and check schedules.</p>
                </div>
              </button>

              {/* Guardian Dashboard */}
              <button 
                onClick={() => handleRoleSelect('guardian')}
                className="bg-white border hover:border-orange-500 p-6 rounded-3xl transition-all flex items-start gap-4 hover:shadow-sm"
              >
                <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Guardian Dashboard</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">Monitor care visits, buy coupon packs, and verify safety status.</p>
                </div>
              </button>

              {/* Care Buddy Portal */}
              <button 
                onClick={() => handleRoleSelect('buddy')}
                className="bg-white border hover:border-orange-500 p-6 rounded-3xl transition-all flex items-start gap-4 hover:shadow-sm"
              >
                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Care Buddy Portal</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">Accept job tickets, navigation routes, and close tasks with client passcodes.</p>
                </div>
              </button>

              {/* Admin Panel */}
              <button 
                onClick={() => handleRoleSelect('admin')}
                className="bg-white border hover:border-orange-500 p-6 rounded-3xl transition-all flex items-start gap-4 hover:shadow-sm"
              >
                <div className="h-12 w-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Operations Console</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">Verify elder registrations, assign buddies, and monitor SOS emergency desks.</p>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* 2. Logged In Portal (Full Screen, no mockup wraps) */}
      {session && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          
          {/* Top Bar for Sign Out (Hidden for Elder PWA to maintain clean mobile UI, shown for other dashboards) */}
          {session.role !== 'elder' && (
            <div className="bg-[#0f172a] text-white px-6 py-3 flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-orange-500" />
                <span className="text-xs font-black uppercase tracking-wider">Amiko {session.role.toUpperCase()} Workspace</span>
              </div>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-bold transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}

          {/* Render target role view in full screen container */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            
            {session.role === 'elder' && (
              <div className="w-full h-full max-w-md mx-auto bg-[#f8fafc] shadow-2xl relative border-x border-slate-200">
                <div className="absolute top-2 right-2 z-50">
                  <button 
                    onClick={handleSignOut} 
                    className="h-10 px-3 bg-white/40 backdrop-blur border rounded-full text-slate-500 font-bold text-xs"
                  >
                    Logout
                  </button>
                </div>
                <ElderPwa
                  state={session.role}
                  setState={handleRoleSelect}
                  bookings={bookings}
                  setBookings={setBookings}
                  walletBalance={walletBalance}
                  setWalletBalance={setWalletBalance}
                  setTransactions={setTransactions}
                  sosEvent={sosEvent}
                  setSosEvent={setSosEvent}
                  profile={profile}
                  setProfile={setProfile}
                  isApproved={isApproved}
                  setIsApproved={setIsApproved}
                  settings={settings}
                  setSettings={setSettings}
                />
              </div>
            )}

            {session.role === 'guardian' && (
              <GuardianDashboard
                profile={profile}
                walletBalance={walletBalance}
                setWalletBalance={setWalletBalance}
                transactions={transactions}
                setTransactions={setTransactions}
                bookings={bookings}
                sosEvent={sosEvent}
              />
            )}

            {session.role === 'admin' && (
              <AdminConsole
                profile={profile}
                isApproved={isApproved}
                setIsApproved={setIsApproved}
                bookings={bookings}
                setBookings={setBookings}
                sosEvent={sosEvent}
                setSosEvent={setSosEvent}
                walletBalance={walletBalance}
                setWalletBalance={setWalletBalance}
                setTransactions={setTransactions}
              />
            )}

            {session.role === 'buddy' && (
              <CareBuddyPortal
                bookings={bookings}
                setBookings={setBookings}
                setTransactions={setTransactions}
                walletBalance={walletBalance}
              />
            )}

          </div>
        </div>
      )}

    </div>
  );
}
