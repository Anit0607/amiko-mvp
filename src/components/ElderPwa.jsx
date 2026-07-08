'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, Users, Calendar, Clock, Phone, Settings, Mic, MapPin, 
  Smile, ShieldAlert, BookOpen, User, Check, ArrowRight, ArrowLeft,
  Volume2, ShoppingBag, Truck, Info, Star, Shield, HelpCircle
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import LiveMap from './LiveMap';

const SERVICE_CATEGORIES = [
  { id: 'health', title: 'Health Support', tone: 'success', icon: Heart, desc: 'BP, Blood Sugar, Physio' },
  { id: 'travel', title: 'Travel & Accompaniment', tone: 'primary', icon: Truck, desc: 'Hospital, Bank, Temple' },
  { id: 'shopping', title: 'Shopping & Essentials', tone: 'accent', icon: ShoppingBag, desc: 'Grocery, Medicine' },
  { id: 'homeSupport', title: 'Home Support', tone: 'info', icon: Settings, desc: 'Plumber, Electrician' }
];

export default function ElderPwa({ 
  bookings, 
  setBookings, 
  walletBalance, 
  setWalletBalance,
  setTransactions,
  sosEvent,
  setSosEvent,
  profile,
  setProfile,
  isApproved,
  setIsApproved,
  settings,
  setSettings
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home'); // home, schedule, coupons, profile
  const [screen, setScreen] = useState('home_view'); // home_view, category_view, confirm_view, voice_view, settings_view
  
  // Custom states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingTime, setBookingTime] = useState('Morning (8–11)');
  const [mood, setMood] = useState(null);

  // Voice recognition states
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef(null);

  // SOS hold progress
  const [sosHoldPercent, setSosHoldPercent] = useState(0);
  const sosTimerRef = useRef(null);

  // Speech Recognition hook
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceState('error');
      setVoiceText('Speech recognition not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-IN';

    rec.onstart = () => {
      setVoiceState('listening');
      setVoiceText('Listening for your request...');
    };

    rec.onerror = (e) => {
      console.error(e);
      setVoiceState('error');
      setVoiceText('Could not hear clearly. Please try again.');
    };

    rec.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setVoiceState('understood');

      const lower = text.toLowerCase();
      let matchedCat = 'shopping';
      let matchedSvc = 'Grocery Shopping';

      if (lower.includes('doctor') || lower.includes('hospital') || lower.includes('clinic')) {
        matchedCat = 'travel';
        matchedSvc = 'Hospital Visit';
      } else if (lower.includes('physio') || lower.includes('physiotherapy')) {
        matchedCat = 'health';
        matchedSvc = 'Physiotherapy';
      } else if (lower.includes('blood') || lower.includes('sugar') || lower.includes('sugar check')) {
        matchedCat = 'health';
        matchedSvc = 'Blood Sugar Check';
      } else if (lower.includes('bp') || lower.includes('pressure') || lower.includes('blood pressure')) {
        matchedCat = 'health';
        matchedSvc = 'BP Check';
      } else if (lower.includes('bank') || lower.includes('money')) {
        matchedCat = 'travel';
        matchedSvc = 'Bank Visit';
      } else if (lower.includes('medicine') || lower.includes('pharmacy') || lower.includes('pill')) {
        matchedCat = 'shopping';
        matchedSvc = 'Medicine Pickup';
      } else if (lower.includes('temple') || lower.includes('church') || lower.includes('prayer')) {
        matchedCat = 'travel';
        matchedSvc = 'Temple Visit';
      } else if (lower.includes('plumber') || lower.includes('leak')) {
        matchedCat = 'homeSupport';
        matchedSvc = 'Plumber';
      } else if (lower.includes('wire') || lower.includes('light') || lower.includes('electrician')) {
        matchedCat = 'homeSupport';
        matchedSvc = 'Electrician';
      }

      setSelectedCategory(SERVICE_CATEGORIES.find(c => c.id === matchedCat));
      setSelectedService(matchedSvc);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const startSosHold = () => {
    setSosHoldPercent(0);
    sosTimerRef.current = setInterval(() => {
      setSosHoldPercent(prev => {
        if (prev >= 100) {
          clearInterval(sosTimerRef.current);
          triggerSosAlert();
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const endSosHold = () => {
    clearInterval(sosTimerRef.current);
    if (sosHoldPercent < 100) {
      setSosHoldPercent(0);
    }
  };

  const triggerSosAlert = () => {
    const newSos = {
      id: crypto.randomUUID(),
      elder_id: 'margaret-wilson-id',
      gps_lat: 12.9716,
      gps_lng: 77.5946,
      status: 'active',
      created_at: new Date().toISOString()
    };
    setSosEvent(newSos);
    localStorage.setItem('amiko_sos_event', JSON.stringify(newSos));
    router.push('/sos');
  };

  const handleCreateBooking = () => {
    const couponCosts = {
      'BP Check': 2, 'Blood Sugar Check': 2, 'Physiotherapy': 5, 'Lab Test Assistance': 4,
      'Medication Reminder': 1, 'Hospital Visit': 6, 'Bank Visit': 6, 'Pharmacy Visit': 3,
      'Temple Visit': 4, 'Grocery Shopping': 3, 'Medicine Pickup': 3, 'Utility Bill Assistance': 2,
      'Document Submission': 3, 'Electrician': 5, 'Plumber': 5, 'Carpenter': 5,
      'Appliance Repair': 6, 'Emergency Home Maintenance': 8
    };

    const cost = couponCosts[selectedService] || 3;

    if (walletBalance < cost) {
      alert(`You need ${cost} coupons, but you only have ${walletBalance}. Please call Sarah to add coupons.`);
      return;
    }

    const newBooking = {
      id: crypto.randomUUID(),
      service_label: selectedService,
      category_id: selectedCategory.id,
      scheduled_date: bookingDate,
      scheduled_time_slot: bookingTime,
      address: profile ? profile.address : '42 Rose Garden',
      status: 'requested',
      cost,
      created_at: new Date().toISOString(),
      otp: Math.floor(1000 + Math.random() * 9000).toString()
    };

    setBookings([newBooking, ...bookings]);
    setWalletBalance(walletBalance - cost);
    
    setTransactions(prev => [{
      id: crypto.randomUUID(),
      booking_id: newBooking.id,
      amount: -cost,
      transaction_type: 'booking_debit',
      notes: `Care Visit: ${selectedService}`,
      created_at: new Date().toISOString()
    }, ...prev]);

    setScreen('home_view');
    setActiveTab('schedule');
  };

  const activeBooking = bookings.find(b => b.status === 'buddy_assigned' || b.status === 'buddy_en_route' || b.status === 'service_started');

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-[#0f172a] relative overflow-hidden select-none text-[19px]">
      
      {/* Scrollable Viewport (Leaves room at bottom for tab bar) */}
      <div className="flex-1 overflow-y-auto pb-28 screen-scroll">
        
        {/* ================= TAB 1: HOME ================= */}
        {activeTab === 'home' && screen === 'home_view' && (
          <div className="p-5 space-y-5 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-slate-800 leading-none font-headers">Good morning, Margaret</h1>
                <p className="text-xs text-slate-400 font-extrabold mt-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Sarah is connected as your Guardian
                </p>
              </div>
              <button 
                onClick={() => setScreen('settings_view')}
                className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
              >
                <Settings className="h-6 w-6" />
              </button>
            </div>

            {/* Daily Wellness Check (Mood log) */}
            <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex items-center justify-between text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5"><Smile className="h-4.5 w-4.5 text-orange-500" /> Daily Wellness check:</span>
              <div className="flex gap-1.5">
                {['😊 Great', '🙂 Good', '😐 Okay', '😔 Unwell'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => { setMood(m.split(' ')[1]); alert('Daily update sent to Sarah.'); }}
                    className={`px-2 py-1 rounded-lg border text-[10px] ${mood === m.split(' ')[1] ? 'border-orange-500 bg-orange-50/30 font-bold' : 'border-slate-100 bg-slate-50'}`}
                  >
                    {m.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Companion Banner */}
            {activeBooking && (
              <div 
                onClick={() => { setActiveTab('schedule'); }}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4.5 rounded-3xl shadow-md cursor-pointer flex items-center justify-between animate-pulse"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Companion Coming</span>
                  <h4 className="font-extrabold text-sm mt-1.5 leading-tight">{activeBooking.service_label}</h4>
                  <p className="text-xs opacity-90 mt-0.5">Ravi Kumar is on his way.</p>
                </div>
                <span className="text-xs font-black bg-white text-orange-600 px-3 py-1.5 rounded-xl uppercase">Track</span>
              </div>
            )}

            {/* Large Status Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-[32px] shadow-lg space-y-4">
              <div>
                <h3 className="text-xl font-black font-headers leading-none">Need help today?</h3>
                <p className="text-xs text-slate-400 mt-2 font-semibold">Book a friendly helper to assist with health checks, local trips, or errand tasks.</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedCategory(SERVICE_CATEGORIES[0]); setScreen('category_view'); }}
                  className="flex-grow h-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl font-black text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                >
                  Book Care Support
                </button>
                <button 
                  onClick={() => { setScreen('voice_view'); startSpeechRecognition(); }}
                  className="h-16 w-16 bg-white/10 text-orange-400 rounded-2xl flex items-center justify-center shrink-0 hover:bg-white/15"
                  aria-label="Speak request"
                >
                  <Mic className="h-7 w-7" />
                </button>
              </div>
            </div>

            {/* Four Large Category Cards */}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Browse Support Areas</span>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat); setScreen('category_view'); }}
                      className="bg-white border border-slate-100 hover:border-orange-500 p-4 rounded-3xl text-left transition-all flex flex-col justify-between min-h-[135px] hover:shadow-sm"
                    >
                      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${cat.tone === 'success' ? 'bg-emerald-50 text-emerald-600' : cat.tone === 'primary' ? 'bg-blue-50 text-blue-600' : cat.tone === 'accent' ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                        <Icon className="h-5 w-5 fill-current/10" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-tight">{cat.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1 font-semibold leading-normal">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: SCHEDULE ================= */}
        {activeTab === 'schedule' && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-slate-800 leading-none font-headers">My Schedule</h2>
              <p className="text-xs text-slate-400 font-extrabold uppercase mt-2 tracking-wider">Upcoming and past visits</p>
            </div>

            {/* Live Map Tracking Frame */}
            {activeBooking && (activeBooking.status === 'buddy_en_route' || activeBooking.status === 'service_started') && (
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Live Helper Location</span>
                <LiveMap isActive={true} />
              </div>
            )}

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-12 bg-white rounded-3xl border border-dashed">No care visits scheduled yet.</p>
              ) : (
                bookings.map(bk => (
                  <div key={bk.id} className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start pb-3 border-b">
                      <div>
                        <h4 className="font-black text-slate-800 text-base">{bk.service_label}</h4>
                        <p className="text-xs text-slate-400 mt-1.5 font-semibold flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {bk.scheduled_date} ({bk.scheduled_time_slot})</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl ${bk.status === 'service_completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                        {bk.status.replace('_', ' ')}
                      </span>
                    </div>

                    {bk.buddy ? (
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center font-bold">R</div>
                          <div>
                            <p className="text-slate-800 font-bold">{bk.buddy.name}</p>
                            <p className="text-[9px] text-slate-400">Matched Care Buddy</p>
                          </div>
                        </div>
                        <a href="tel:+919876543210" className="h-10 px-3.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl flex items-center justify-center font-bold">Call Buddy</a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-semibold">Finding caregiver buddy...</p>
                    )}

                    {bk.status !== 'service_completed' && (
                      <div className="bg-slate-50 border p-3.5 rounded-2xl text-center space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Helper Passcode</span>
                        <p className="text-3xl font-black tracking-widest text-slate-800">{bk.otp}</p>
                        <p className="text-[10px] text-slate-400 leading-normal max-w-[240px] mx-auto mt-1 font-semibold">Provide this code to your helper upon arrival.</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: COUPONS ================= */}
        {activeTab === 'coupons' && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-slate-800 leading-none font-headers">My Coupons</h2>
              <p className="text-xs text-slate-400 font-extrabold uppercase mt-2 tracking-wider">Coupon wallet balances</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-[32px] shadow-md text-center space-y-2">
              <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest inline-block">Wallet Balance</span>
              <h3 className="text-4xl font-black font-headers">{walletBalance} Coupons</h3>
              <p className="text-xs opacity-90 max-w-[240px] mx-auto pt-2 leading-relaxed">Sarah Wilson handles coupon refills. Ask Sarah to buy packs if balance runs low.</p>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Recent Log Details</span>
              <div className="bg-white border rounded-3xl p-2 divide-y divide-slate-50 shadow-sm text-xs font-semibold">
                <div className="p-3.5 flex justify-between">
                  <span>BP Check (Yesterday)</span>
                  <span className="text-red-600 font-bold">-2 CP</span>
                </div>
                <div className="p-3.5 flex justify-between">
                  <span>Initial Refill by Sarah</span>
                  <span className="text-emerald-600 font-bold">+20 CP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: PROFILE ================= */}
        {activeTab === 'profile' && (
          <div className="p-5 space-y-5 animate-fade-in">
            <div>
              <h2 className="text-2xl font-black text-slate-800 leading-none font-headers">My Profile</h2>
              <p className="text-xs text-slate-400 font-extrabold uppercase mt-2 tracking-wider">Your account profile details</p>
            </div>

            <div className="bg-white border rounded-[30px] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-black text-xl">M</div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">Margaret Wilson</h3>
                  <p className="text-xs text-slate-400 font-semibold">{profile ? profile.phone : '+91 98765 43210'}</p>
                </div>
              </div>

              <div className="text-xs text-slate-600 space-y-2 border-t pt-4 font-semibold">
                <p><strong>Home address:</strong> {profile ? profile.address : '42 Rose Garden'}</p>
                <p><strong>Locality:</strong> {profile ? profile.city_locality : 'Bengaluru'}</p>
                <p><strong>Conditions:</strong> {profile ? profile.medical_conditions : 'Hypertension'}</p>
                <p><strong>Guardian Contact:</strong> Sarah Wilson (Daughter)</p>
              </div>
            </div>

            <button 
              onClick={() => { localStorage.removeItem('amiko_session'); router.push('/auth'); }}
              className="w-full h-16 border-2 border-red-200 hover:bg-red-50 text-red-600 font-bold rounded-2xl text-sm flex items-center justify-center transition-colors"
            >
              Sign Out Account
            </button>
          </div>
        )}

        {/* ================= SUBPAGE: CATEGORY SERVICES LIST ================= */}
        {screen === 'category_view' && selectedCategory && (
          <div className="p-5 space-y-5 animate-fade-in bg-white min-h-full">
            <div className="flex items-center gap-3.5 border-b pb-4 shrink-0">
              <button 
                onClick={() => setScreen('home_view')} 
                className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-800 font-headers leading-none">{selectedCategory.title}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Select service needed</p>
              </div>
            </div>

            <div className="space-y-3">
              {(selectedCategory.id === 'health' 
                ? ['BP Check (2 Coupons)', 'Blood Sugar Check (2 Coupons)', 'Physiotherapy (5 Coupons)', 'Lab Test Assistance (4 Coupons)', 'Medication Reminder (1 Coupon)']
                : selectedCategory.id === 'travel'
                ? ['Hospital Visit (6 Coupons)', 'Bank Visit (6 Coupons)', 'Pharmacy Visit (3 Coupons)', 'Temple Visit (4 Coupons)']
                : selectedCategory.id === 'shopping'
                ? ['Grocery Shopping (3 Coupons)', 'Medicine Pickup (3 Coupons)', 'Utility Bill Assistance (2 Coupons)', 'Document Submission (3 Coupons)']
                : ['Electrician (5 Coupons)', 'Plumber (5 Coupons)', 'Carpenter (5 Coupons)', 'Appliance Repair (6 Coupons)', 'Emergency Maintenance (8 Coupons)']
              ).map(label => {
                const cleanLabel = label.split(' (')[0];
                const costText = label.split(' (')[1].replace(')', '');
                return (
                  <button 
                    key={label}
                    onClick={() => { setSelectedService(cleanLabel); setScreen('confirm_view'); }}
                    className="w-full bg-slate-50 hover:bg-orange-50/50 border border-slate-100 hover:border-orange-500 p-5 rounded-3xl flex items-center justify-between text-left transition-all h-20"
                  >
                    <span className="font-extrabold text-base text-slate-800">{cleanLabel}</span>
                    <span className="text-xs font-black bg-white border text-orange-700 px-3 py-1.5 rounded-full">{costText}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= SUBPAGE: BOOKING CONFIRMATION ================= */}
        {screen === 'confirm_view' && selectedCategory && selectedService && (
          <div className="p-5 space-y-5 bg-white min-h-full animate-fade-in">
            <div className="flex items-center gap-3.5 border-b pb-4 shrink-0">
              <button 
                onClick={() => setScreen('category_view')} 
                className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <h2 className="text-xl font-black text-slate-800 font-headers leading-none">Confirm Care Visit</h2>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Select schedule slots</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-5 rounded-3xl shadow-sm">
              <span className="text-[10px] font-black bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-widest">{selectedCategory.title}</span>
              <h3 className="text-2xl font-black mt-2 font-headers">{selectedService}</h3>
            </div>

            <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800 leading-relaxed font-semibold">
                <strong>Important:</strong> Care visits require at least 12 hours lead time to dispatch a matched buddy.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Which day?</label>
              <div className="flex gap-2">
                {['Tomorrow', 'In 2 days', 'In 3 days'].map(dOpt => (
                  <button 
                    key={dOpt}
                    onClick={() => setBookingDate(dOpt)}
                    className={`flex-grow h-16 border-2 rounded-2xl font-bold text-sm ${bookingDate === dOpt ? 'border-orange-500 bg-orange-50/30 text-orange-850' : 'border-slate-200/65 bg-white text-slate-650'}`}
                  >
                    {dOpt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">What time slot?</label>
              <div className="grid grid-cols-2 gap-2">
                {['Morning (8–11)', 'Noon (11–2)', 'Afternoon (2–5)', 'Evening (5–7)'].map(tOpt => (
                  <button 
                    key={tOpt}
                    onClick={() => setBookingTime(tOpt)}
                    className={`h-16 border-2 rounded-2xl font-bold text-xs ${bookingTime === tOpt ? 'border-orange-500 bg-orange-50/30 text-orange-850' : 'border-slate-200/65 bg-white text-slate-650'}`}
                  >
                    {tOpt}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleCreateBooking}
              className="w-full btn-primary h-18 rounded-2xl text-base font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              Verify &amp; Book Care helper
            </button>
          </div>
        )}

        {/* ================= SUBPAGE: VOICE DICTATION ================= */}
        {screen === 'voice_view' && (
          <div className="p-5 space-y-5 bg-white min-h-full flex flex-col justify-between animate-fade-in">
            <div className="flex items-center gap-3.5 border-b pb-4 shrink-0">
              <button 
                onClick={() => setScreen('home_view')} 
                className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-black text-slate-800 font-headers leading-none">Voice Assistant</h2>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
              <button 
                onClick={startSpeechRecognition}
                className={`h-44 w-44 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${voiceState === 'listening' ? 'bg-red-500 sos-pulse' : 'bg-orange-500'}`}
              >
                <Mic className="h-20 w-20" />
              </button>

              <div className="mt-10 space-y-4 w-full">
                <VoiceVisualizer state={voiceState} />
                <p className="text-base font-bold text-slate-700 min-h-[56px] px-4 leading-relaxed bg-slate-50 py-4 rounded-2xl border border-slate-100">
                  {voiceText || 'Tap the microphone and speak your request. (e.g. "I need blood pressure checked tomorrow")'}
                </p>
              </div>

              {voiceState === 'understood' && selectedService && (
                <div className="w-full bg-white border border-slate-200/80 p-5 rounded-3xl text-left animate-fade-in mt-6 shadow-sm">
                  <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-full">Detected Request</span>
                  <h4 className="font-extrabold text-base mt-2 text-slate-800">{selectedService}</h4>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setScreen('confirm_view')} className="flex-grow btn-primary h-12 rounded-xl text-xs font-bold">
                      Yes, Proceed
                    </button>
                    <button onClick={() => { setSelectedCategory(null); setScreen('home_view'); }} className="px-4 border text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= SUBPAGE: ACCESSIBILITY SETTINGS ================= */}
        {screen === 'settings_view' && (
          <div className="p-5 space-y-5 bg-[#f8fafc] min-h-full animate-fade-in">
            <div className="flex items-center gap-3.5 border-b pb-4 shrink-0 bg-white p-4 -mx-5 -mt-5">
              <button 
                onClick={() => setScreen('home_view')} 
                className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <h2 className="text-xl font-black text-slate-800 font-headers leading-none">Accessibility Settings</h2>
            </div>

            <div className="bg-white border rounded-[30px] p-2 divide-y divide-slate-100 shadow-sm text-sm">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Larger Font Size</h4>
                  <p className="text-[10px] text-slate-400">Increase labels for readability</p>
                </div>
                <div className="flex border rounded-lg overflow-hidden border-slate-200">
                  {['normal', 'large', 'xlarge'].map(sz => (
                    <button 
                      key={sz}
                      onClick={() => setSettings(prev => ({ ...prev, fontSize: sz }))}
                      className={`px-3 py-1.5 font-bold text-xs uppercase ${settings.fontSize === sz ? 'bg-orange-500 text-white' : 'bg-slate-50 text-slate-600'}`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">High Contrast Mode</h4>
                  <p className="text-[10px] text-slate-400">Pure black and white screens</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, contrastMode: !prev.contrastMode }))}
                  className={`h-8 w-14 rounded-full transition-all relative ${settings.contrastMode ? 'bg-orange-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${settings.contrastMode ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Voice Guidance</h4>
                  <p className="text-[10px] text-slate-400">Auditory focus alerts</p>
                </div>
                <button 
                  onClick={() => setSettings(prev => ({ ...prev, voiceGuidance: !prev.voiceGuidance }))}
                  className={`h-8 w-14 rounded-full transition-all relative ${settings.voiceGuidance ? 'bg-orange-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${settings.voiceGuidance ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ================= FLOATING RED SOS BUTTON ================= */}
      {/* Positioned on the right side just above the bottom persistent bar */}
      <div className="absolute bottom-24 right-4 z-40">
        <button 
          onMouseDown={startSosHold}
          onMouseUp={endSosHold}
          onTouchStart={startSosHold}
          onTouchEnd={endSosHold}
          className="h-20 w-20 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-lg flex flex-col items-center justify-center shadow-lg hover:from-red-750 transition-all select-none active:scale-95 sos-pulse relative overflow-hidden"
          aria-label="Trigger SOS emergency help"
        >
          {/* Hold Progress Tracker Ring */}
          {sosHoldPercent > 0 && (
            <span className="absolute inset-0 bg-red-900/60 transition-all" style={{ height: `${sosHoldPercent}%` }}></span>
          )}
          <ShieldAlert className="h-6 w-6 relative z-10" />
          <span className="text-[9px] font-black mt-0.5 tracking-wider relative z-10 uppercase leading-none">SOS</span>
        </button>
      </div>

      {/* ================= PERSISTENT BOTTOM TAB BAR ================= */}
      {/* 64px+ height navigation links for high accessibility */}
      <nav className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-200/80 shadow-lg flex items-center justify-around z-30 shrink-0">
        {[
          { id: 'home', label: 'Home', icon: Heart },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'coupons', label: 'Coupons', icon: Shield },
          { id: 'profile', label: 'Profile', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id && screen === 'home_view';
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setScreen('home_view'); }}
              className={`flex-1 h-full flex flex-col items-center justify-center transition-all ${isSelected ? 'text-orange-500 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-600'}`}
              style={{ minHeight: '64px' }}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] uppercase font-black tracking-widest mt-1">{tab.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
