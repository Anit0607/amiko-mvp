'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldCheck, UserCheck, ShieldAlert, Users, Settings, 
  Layers, Info, Sparkles, Activity, ChevronRight, Moon, Sun
} from 'lucide-react';
import ElderPwa from '../../components/ElderPwa';
import GuardianDashboard from '../../components/GuardianDashboard';
import AdminConsole from '../../components/AdminConsole';
import CareBuddyPortal from '../../components/CareBuddyPortal';

export default function Sandbox() {
  const [activeRole, setActiveRole] = useState('elder'); // elder, guardian, admin, buddy

  // Global shared state for MVP flows
  const [profile, setProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);
  const [walletBalance, setWalletBalance] = useState(18); // Default start balance
  const [transactions, setTransactions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sosEvent, setSosEvent] = useState(null);
  
  const [settings, setSettings] = useState({
    fontSize: 'normal',
    contrastMode: false,
    voiceGuidance: false,
    darkMode: false
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
        created_at: new Date().toISOString()
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

  return (
    <div className={`min-h-screen bg-mesh-gradient flex flex-col ${settings.darkMode ? 'dark-theme' : ''} ${settings.contrastMode ? 'high-contrast' : ''}`}>
      
      {/* Top Workspace Bar */}
      <header className="glass-card m-4 mb-2 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 z-50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md">
            <Heart className="h-6 w-6 fill-white/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-headers">Amiko Real MVP Sandbox</h1>
              <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">v1.0.0</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cross-role flow testing simulator</p>
          </div>
        </div>

        {/* Global Stats HUD */}
        <div className="flex items-center gap-6 overflow-x-auto py-1">
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-850 pr-6 shrink-0">
            <Activity className="h-4 w-4 text-orange-500" />
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 block">SOS Desk</span>
              <span className={`text-xs font-bold ${sosEvent ? 'text-red-500 animate-pulse' : 'text-slate-700 dark:text-slate-300'}`}>
                {sosEvent ? 'CRITICAL ALERT' : 'NOMINAL'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-850 pr-6 shrink-0">
            <Users className="h-4 w-4 text-orange-500" />
            <div>
              <span className="text-[9px] font-black uppercase text-slate-400 block">Linked Link</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {profile ? 'Sarah & Margaret' : 'Waiting...'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-black bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-xl">
              Wallet Balance: {walletBalance} CP
            </span>
          </div>

          <button 
            onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 tap-target shrink-0"
            aria-label="Toggle dark mode"
          >
            {settings.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Sandbox Workspace */}
      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-6 overflow-hidden">
        
        {/* Left Control Sidebar */}
        <section className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          
          {/* Simulator Info Card */}
          <div className="glass-card p-5 space-y-4">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 font-headers">
              <Sparkles className="h-4.5 w-4.5 text-orange-500" /> Operational Scenarios
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-300 leading-relaxed font-semibold">
              This sandbox models the complete lifecycle of a booking. Test how the role portals interact in real time.
            </p>
            
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p><strong>Stage 1:</strong> Elder submits registration (consents verified).</p>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p><strong>Stage 2:</strong> Admin reviews and approves on database console.</p>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p><strong>Stage 3:</strong> Guardian purchases coupons (simulating Razorpay webhook).</p>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <p><strong>Stage 4:</strong> Elder creates booking. Buddy accepts, completes with OTP code.</p>
              </div>
            </div>
          </div>

          {/* Quick Persona Navigation */}
          <div className="glass-card p-5 space-y-3">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 font-headers">
              <Layers className="h-4.5 w-4.5 text-orange-500" /> Toggle Portals
            </h2>
            
            <div className="flex flex-col gap-2">
              {[
                { id: 'elder', label: 'Elder (Mobile App)', icon: Heart, desc: 'SOS, Voice, Bookings' },
                { id: 'guardian', label: 'Guardian Portal', icon: Users, desc: 'Buy Coupons, Logs, Alerts' },
                { id: 'admin', label: 'Admin Command', icon: UserCheck, desc: 'Approvals, Assignments, SOS Desk' },
                { id: 'buddy', label: 'Care Buddy App', icon: ShieldCheck, desc: 'Active Jobs, OTP Verification' }
              ].map(role => {
                const Icon = role.icon;
                const isSelected = activeRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRole(role.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 border-2 ${isSelected ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white/40 dark:bg-slate-900/40 border-transparent hover:border-slate-200 dark:hover:border-slate-800'}`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black leading-tight">{role.label}</h4>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>{role.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </section>

        {/* Right Display Area (Smartphone Mockup) */}
        <section className="flex-grow flex items-center justify-center relative overflow-hidden">
          {sosEvent && (
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-rose-700 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg z-40 animate-pulse text-xs max-w-4xl mx-auto border border-red-500/20">
              <span className="flex items-center gap-2 font-black">
                <ShieldAlert className="h-5 w-5" /> SOS EMERGENCY REQUEST ACTIVE - ELDER CALLED HELP
              </span>
              <button 
                onClick={() => setActiveRole('admin')} 
                className="bg-white hover:bg-slate-100 text-red-700 px-4 py-2 rounded-xl font-extrabold uppercase text-[10px] shadow-sm transition-all"
              >
                Go to SOS Operations Desk
              </button>
            </div>
          )}

          {activeRole === 'elder' && (
            <div className="phone-mockup-wrapper my-4">
              <div className="phone-mockup-frame">
                {/* Speaker Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6.5 bg-[#1e293b] rounded-b-2xl z-50 flex items-center justify-center">
                  <span className="h-2 w-14 rounded-full bg-slate-900"></span>
                  <span className="h-2 w-2 rounded-full bg-slate-900 ml-2"></span>
                </div>

                {/* Status Bar */}
                <div className="absolute top-0 left-0 right-0 h-10 px-6 pt-1.5 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 z-40 bg-white/20 backdrop-blur-md">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                    <span className="inline-block h-2.5 w-4 rounded-sm bg-slate-800 dark:bg-slate-200"></span>
                  </div>
                </div>

                {/* Elder App View */}
                <div className="w-full h-full pt-10">
                  <ElderPwa
                    state={activeRole}
                    setState={setActiveRole}
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
              </div>
            </div>
          )}

          {activeRole !== 'elder' && (
            <div className="w-full max-w-4xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[740px] animate-fade-in relative z-20">
              {activeRole === 'guardian' && (
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
              {activeRole === 'admin' && (
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
              {activeRole === 'buddy' && (
                <CareBuddyPortal
                  bookings={bookings}
                  setBookings={setBookings}
                  setTransactions={setTransactions}
                  walletBalance={walletBalance}
                />
              )}
            </div>
          )}
        </section>

      </main>

    </div>
  );
}
