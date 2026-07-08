'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, User, Check, ShieldAlert, Navigation, Mic, Calendar, Clock, 
  Settings, Volume2, Shield, Heart, ShoppingBag, Truck, Info, Star,
  ArrowRight, ArrowLeft, AlertCircle, VolumeX, CheckSquare, Smile
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import LiveMap from './LiveMap';

const SERVICE_CATEGORIES = [
  { id: 'health', title: 'Health Support', tone: 'success', icon: Heart, desc: 'BP, Blood Sugar, Physio' },
  { id: 'travel', title: 'Accompaniment', tone: 'primary', icon: Truck, desc: 'Hospital, Bank, Temple' },
  { id: 'shopping', title: 'Essentials', tone: 'accent', icon: ShoppingBag, desc: 'Grocery, Medicine' },
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
  const [screen, setScreen] = useState('onboarding'); // onboarding, auth, register, waitingApproval, home, category, confirm, schedule, buddyActive, voiceRequest, sosActive, settings
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [mood, setMood] = useState(null);
  
  // Registration Wizard Step
  const [regStep, setRegStep] = useState(1);
  
  // Registration state
  const [regName, setRegName] = useState('Margaret Wilson');
  const [regAge, setRegAge] = useState('74');
  const [regPhone, setRegPhone] = useState('+91 98765 43210');
  const [regAddress, setRegAddress] = useState('42 Rose Garden, MG Road');
  const [regLocality, setRegLocality] = useState('Bengaluru');
  const [regMedical, setRegMedical] = useState('Hypertension');
  const [regGuardianName, setRegGuardianName] = useState('Sarah Wilson');
  const [regGuardianPhone, setRegGuardianPhone] = useState('+91 98123 45678');
  const [regGuardianEmail, setRegGuardianEmail] = useState('sarah@example.com');
  const [regGuardianRel, setRegGuardianRel] = useState('Daughter');

  // Consent states
  const [consentElder, setConsentElder] = useState(true);
  const [consentGuardian, setConsentGuardian] = useState(true);
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentMedical, setConsentMedical] = useState(true);
  const [consentDisclaimer, setConsentDisclaimer] = useState(true);

  // Booking states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('Tomorrow');
  const [bookingTime, setBookingTime] = useState('Morning (8–11)');

  // Voice state
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceText, setVoiceText] = useState('');
  const recognitionRef = useRef(null);

  // SOS hold progress
  const [sosHoldPercent, setSosHoldPercent] = useState(0);
  const sosTimerRef = useRef(null);

  useEffect(() => {
    if (isApproved && screen === 'waitingApproval') {
      setScreen('home');
    }
  }, [isApproved, screen]);

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
    setScreen('sosActive');
    const newSos = {
      id: crypto.randomUUID(),
      elder_id: 'margaret-wilson-id',
      gps_lat: 12.9716,
      gps_lng: 77.5946,
      status: 'active',
      created_at: new Date().toISOString()
    };
    setSosEvent(newSos);
  };

  const handleRegisterSubmit = () => {
    if (!consentElder || !consentGuardian || !consentLocation || !consentMedical || !consentDisclaimer) {
      alert("Please accept all agreements to get started.");
      return;
    }
    const newProfile = {
      full_name: regName,
      age: parseInt(regAge),
      phone: regPhone,
      address: regAddress,
      city_locality: regLocality,
      medical_conditions: regMedical,
      guardian_name: regGuardianName,
      guardian_phone: regGuardianPhone,
      guardian_email: regGuardianEmail,
      guardian_relationship: regGuardianRel
    };
    setProfile(newProfile);
    setScreen('waitingApproval');
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
      alert(`You need ${cost} coupons, but you have ${walletBalance}. Please call Sarah to add more coupons.`);
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

    setScreen('schedule');
  };

  const activeBooking = bookings.find(b => b.status === 'buddy_assigned' || b.status === 'buddy_en_route' || b.status === 'service_started');

  // Check if persistent bottom bar should be hidden
  const hidePersistentBar = ['onboarding', 'auth', 'register', 'sosActive'].includes(screen);

  return (
    <div className="flex flex-col h-full bg-[#fcfdff] text-[#0f172a] relative overflow-hidden select-none text-[19px]">
      
      {/* 1. Onboarding Screen */}
      {screen === 'onboarding' && (
        <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div className="h-28 w-28 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-[30%] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-8">
              <Heart className="h-14 w-14 fill-white/20" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-800 leading-tight">
              {onboardingIndex === 0 ? 'Friendly Care for Seniors.' : onboardingIndex === 1 ? 'Accompanied Outings.' : 'Emergency Assistance.'}
            </h1>
            <p className="text-lg font-semibold text-slate-500 mt-4 leading-relaxed">
              {onboardingIndex === 0 
                ? 'Your companion Care Buddy is just one tap away. Help with health checks, banking, or groceries.' 
                : onboardingIndex === 1 
                ? 'A verified Care Buddy goes with you to the hospital, bank, temple, or shopping runs.'
                : 'Help is always available. Instantly alerts your family and our 24/7 care team.'}
            </p>
            
            <div className="flex gap-2.5 mt-8">
              {[0, 1, 2].map(i => (
                <span key={i} className={`h-2.5 rounded-full transition-all ${i === onboardingIndex ? 'w-8 bg-orange-500' : 'w-2.5 bg-slate-200'}`}></span>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 shrink-0">
            <button 
              onClick={() => onboardingIndex < 2 ? setOnboardingIndex(onboardingIndex + 1) : setScreen('auth')}
              className="w-full btn-primary h-18 rounded-2xl flex items-center justify-center gap-2 shadow-md text-lg font-extrabold"
            >
              {onboardingIndex === 2 ? 'Let’s Start' : 'Next'} <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setScreen('auth')}
              className="w-full text-slate-400 font-bold text-sm py-2 hover:text-slate-600 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* 2. Login Screen */}
      {screen === 'auth' && (
        <div className="flex-1 p-6 flex flex-col justify-between bg-white animate-fade-in">
          <div>
            <div className="flex items-center gap-4 mt-8">
              <div className="h-16 w-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Heart className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 leading-tight">Welcome to Amiko</h1>
                <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">Erran Care Network</p>
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Phone className="h-6 w-6" /></div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Detected Number</span>
                    <h3 className="font-extrabold text-slate-800 text-lg">{phoneInput}</h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setScreen('register')}
                  className="w-full btn-primary h-16 rounded-2xl mt-5 shadow-sm text-sm font-bold flex items-center justify-center gap-2"
                >
                  Continue with this number <ArrowRight className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-xs font-black uppercase tracking-wider">Or change number</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Your Phone Number</label>
                <input 
                  type="text" 
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-slate-800 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Register Wizard Screen */}
      {screen === 'register' && (
        <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button 
              onClick={() => regStep > 1 ? setRegStep(regStep - 1) : setScreen('auth')}
              className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Part {regStep} of 4</span>
            <div className="w-12"></div>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 screen-scroll space-y-6">
            
            {/* Step 1: Elder Details */}
            {regStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Tell us your name</h2>
                <p className="text-sm text-slate-500 font-semibold">Your Care Buddy needs this information to know who they are assisting.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Your Full Name</label>
                    <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Margaret Wilson" className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Your Age</label>
                      <input type="number" value={regAge} onChange={e => setRegAge(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Your Mobile</label>
                      <input value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {regStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Where is your home?</h2>
                <p className="text-sm text-slate-500 font-semibold">This address will be shared only with your matched Care Buddy.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Home Address</label>
                    <input value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">City</label>
                      <input value={regLocality} onChange={e => setRegLocality(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Medical Conditions</label>
                      <input value={regMedical} onChange={e => setRegMedical(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Guardian Details */}
            {regStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Responsible Contact</h2>
                <p className="text-sm text-slate-500 font-semibold">Your family member who will manage coupon balance approvals.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Guardian Name</label>
                    <input value={regGuardianName} onChange={e => setRegGuardianName(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Relationship</label>
                      <input value={regGuardianRel} onChange={e => setRegGuardianRel(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Mobile</label>
                      <input value={regGuardianPhone} onChange={e => setRegGuardianPhone(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                    <input value={regGuardianEmail} onChange={e => setRegGuardianEmail(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Consents & Disclaimer */}
            {regStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Care Agreements</h2>
                
                <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed font-semibold">
                  <strong>DISCLAIMER:</strong> Amiko is an assistant service for daily errands and care support. We are not an emergency hospital or ambulance provider. For medical crises, please call 108.
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentElder} onChange={e => setConsentElder(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-500 rounded" />
                    <span>I want to register with Amiko companion care.</span>
                  </label>
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentGuardian} onChange={e => setConsentGuardian(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-500 rounded" />
                    <span>Allow my linked guardian to support my account.</span>
                  </label>
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentLocation} onChange={e => setConsentLocation(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-500 rounded" />
                    <span>Let my helper see my location during care visits.</span>
                  </label>
                  <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentMedical} onChange={e => setConsentMedical(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-500 rounded" />
                    <span>Keep my medical concerns stored safely.</span>
                  </label>
                  <label className="flex items-start gap-3 p-4 bg-orange-50/40 rounded-2xl border border-orange-100 cursor-pointer">
                    <input type="checkbox" checked={consentDisclaimer} onChange={e => setConsentDisclaimer(e.target.checked)} className="mt-1 h-5 w-5 accent-orange-500 rounded" />
                    <span className="text-slate-800 font-bold">I accept the Medical Disclaimer.</span>
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Footer Trigger */}
          <div className="p-4 border-t bg-white shrink-0">
            {regStep < 4 ? (
              <button 
                type="button" 
                onClick={() => setRegStep(regStep + 1)}
                className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                Next Step <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleRegisterSubmit}
                className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                Submit Agreements
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Waiting Approval Screen */}
      {screen === 'waitingApproval' && (
        <div className="flex-1 p-6 flex flex-col justify-between bg-[#f8fafc] text-center animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="h-20 w-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Clock className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Reviewing Profile</h1>
            <p className="text-sm text-slate-500 font-semibold max-w-xs mt-3 leading-relaxed">
              Our care team is verifying your registration. Your account will be active shortly.
            </p>
            
            <div className="w-full bg-white border border-slate-100 p-5 rounded-3xl mt-8 text-left space-y-3 shadow-sm text-xs">
              <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">What happens next</p>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Team reviews your home address</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Guardian links their coupons account</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Home Screen (Cleaned up: 4 Priority Actions, Large Icons, Emotional feel) */}
      {screen === 'home' && (
        <div className="flex-1 flex flex-col justify-between bg-slate-50/70 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-white border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-sm">M</div>
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Welcome back</span>
                <h2 className="text-lg font-black text-slate-800 leading-tight">Margaret Wilson</h2>
              </div>
            </div>
            <button 
              onClick={() => setScreen('settings')}
              className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>

          {/* Home body (4 core actions) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 screen-scroll pb-24">
            
            {/* Subtle Mood indicator chip at top */}
            <div className="flex items-center justify-between bg-white border p-3 rounded-2xl text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><Smile className="h-4.5 w-4.5 text-orange-500" /> Daily Wellness check:</span>
              <div className="flex gap-1.5">
                {['😊 Great', '🙂 Good', '😐 Okay', '😔 Unwell'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => { setMood(m.split(' ')[1]); alert('Wellness signal sent to Sarah.'); }}
                    className={`px-2 py-1 rounded-lg border text-[10px] ${mood === m.split(' ')[1] ? 'border-orange-500 bg-orange-50/30 font-bold' : 'border-slate-100 bg-slate-50'}`}
                  >
                    {m.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage tracking banner */}
            {activeBooking && (
              <button 
                onClick={() => setScreen('buddyActive')}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4.5 rounded-3xl text-left flex items-center justify-between shadow-md"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Helper coming</span>
                  <h4 className="font-extrabold text-base mt-1.5 leading-tight">{activeBooking.service_label}</h4>
                  <p className="text-xs opacity-90 mt-0.5">Ravi is on his way. Tap to track.</p>
                </div>
                <span className="h-10 px-3 bg-white text-orange-600 font-extrabold text-xs rounded-xl flex items-center justify-center uppercase">Track</span>
              </button>
            )}

            {/* 4 Core Priority Cards */}
            <div className="grid grid-cols-1 gap-3.5 pt-2">
              
              {/* Card 1: Book Help */}
              <button 
                onClick={() => { setSelectedCategory(SERVICE_CATEGORIES[0]); setScreen('category'); }}
                className="w-full h-24 bg-white border border-slate-100 hover:border-orange-500 hover:shadow-sm p-4.5 rounded-3xl text-left transition-all flex items-center gap-4.5"
              >
                <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Heart className="h-7 w-7 fill-emerald-600/10" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">Book Care Help</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">Request a helper for health checks, banks, or temple outings.</p>
                </div>
              </button>

              {/* Card 2: Speak Request */}
              <button 
                onClick={() => { setScreen('voiceRequest'); startSpeechRecognition(); }}
                className="w-full h-24 bg-slate-900 hover:bg-slate-950 text-white p-4.5 rounded-3xl text-left transition-all flex items-center gap-4.5 shadow-md"
              >
                <div className="h-14 w-14 bg-white/10 text-orange-400 rounded-2xl flex items-center justify-center shrink-0">
                  <Mic className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">Speak Request</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">Just say your request out loud (e.g. "Hospital visit tomorrow").</p>
                </div>
              </button>

              {/* Card 3: My Schedule */}
              <button 
                onClick={() => setScreen('schedule')}
                className="w-full h-24 bg-white border border-slate-100 hover:border-orange-500 hover:shadow-sm p-4.5 rounded-3xl text-left transition-all flex items-center gap-4.5"
              >
                <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 leading-tight">My Schedule</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal font-semibold">View your upcoming companion visits and passcodes.</p>
                </div>
              </button>

            </div>

          </div>

        </div>
      )}

      {/* 6. Category Screen */}
      {screen === 'category' && selectedCategory && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('home')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Check className="h-6 w-6 rotate-45" /></button>
            <div>
              <h2 className="text-lg font-black text-slate-800">Select Care Help</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Which help do you need?</p>
            </div>
            <div className="w-12"></div>
          </div>

          {/* Category tabs */}
          <div className="flex bg-slate-50 border-b p-1 gap-1 overflow-x-auto shrink-0 select-none">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 h-12 rounded-xl text-xs font-black whitespace-nowrap ${selectedCategory.id === cat.id ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 screen-scroll bg-slate-50/50 pb-24">
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
                  onClick={() => { setSelectedService(cleanLabel); setScreen('confirm'); }}
                  className="w-full bg-white border border-slate-100 p-5 rounded-3xl flex items-center justify-between text-left hover:border-orange-500 hover:shadow-sm transition-all h-20"
                >
                  <span className="font-extrabold text-base text-slate-800">{cleanLabel}</span>
                  <span className="text-xs font-black bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">{costText}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Confirm Screen */}
      {screen === 'confirm' && selectedCategory && selectedService && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('category')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-6 w-6 rotate-45" /></button>
            <div>
              <h2 className="text-lg font-black text-slate-800">Confirm Care Booking</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Check schedule slot</p>
            </div>
            <div className="w-12"></div>
          </div>

          <div className="flex-1 p-5 space-y-6 overflow-y-auto screen-scroll bg-slate-50/50 pb-24">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-5 rounded-3xl shadow-sm">
              <span className="text-[10px] font-black uppercase bg-white/20 px-2.5 py-0.5 rounded-full">{selectedCategory.title}</span>
              <h3 className="text-xl font-black mt-2">{selectedService}</h3>
            </div>

            <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800 leading-relaxed font-semibold">
                <strong>Schedule Notice:</strong> We need about 12 hours to matching your caregiver buddy.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Which day?</label>
              <div className="flex gap-2">
                {['Tomorrow', 'In 2 days', 'In 3 days'].map(dOpt => (
                  <button 
                    key={dOpt}
                    onClick={() => setBookingDate(dOpt)}
                    className={`flex-grow h-16 border-2 rounded-2xl font-bold text-sm ${bookingDate === dOpt ? 'border-orange-500 bg-orange-50/30 text-orange-800' : 'border-slate-200/60 bg-white text-slate-600'}`}
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
                    className={`h-16 border-2 rounded-2xl font-bold text-xs ${bookingTime === tOpt ? 'border-orange-500 bg-orange-50/30 text-orange-800' : 'border-slate-200/60 bg-white text-slate-600'}`}
                  >
                    {tOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-white shrink-0 pb-24">
            <button 
              onClick={handleCreateBooking}
              className="w-full btn-primary h-18 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-base font-bold"
            >
              Verify &amp; Book Service
            </button>
          </div>
        </div>
      )}

      {/* 8. My Schedule Screen (Dedicated viewing panel) */}
      {screen === 'schedule' && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('home')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-6 w-6 rotate-45" /></button>
            <div>
              <h2 className="text-lg font-black text-slate-800">My Schedule</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Upcoming care visits</p>
            </div>
            <div className="w-12"></div>
          </div>

          <div className="flex-grow p-5 space-y-4 overflow-y-auto screen-scroll bg-slate-50/50 pb-24">
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12 bg-white rounded-3xl border border-dashed">No care visits scheduled yet.</p>
            ) : (
              bookings.map(bk => (
                <div key={bk.id} className="bg-white border rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start pb-3 border-b">
                    <div>
                      <h4 className="font-black text-slate-800 text-base">{bk.service_label}</h4>
                      <p className="text-xs text-slate-400 mt-1 font-semibold">{bk.scheduled_date} ({bk.scheduled_time_slot})</p>
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
                          <p className="text-[10px] text-slate-400">Care Buddy matched</p>
                        </div>
                      </div>
                      <a href="tel:+919876543210" className="h-10 px-3 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl flex items-center justify-center font-bold">Call Buddy</a>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold">Saathi matching in progress...</p>
                  )}

                  {bk.status !== 'service_completed' && (
                    <div className="bg-slate-50 border p-3.5 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Buddy Passcode</span>
                      <p className="text-3xl font-black tracking-widest text-slate-800">{bk.otp}</p>
                      <p className="text-[10px] text-slate-400 leading-normal max-w-[240px] mx-auto mt-1 font-semibold">Share this code with your helper when they arrive.</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 9. Voice Request Screen */}
      {screen === 'voiceRequest' && (
        <div className="flex-1 p-5 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('home')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-6 w-6 rotate-45" /></button>
            <h2 className="text-lg font-black text-slate-800">Speak Request</h2>
            <div className="w-12"></div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center px-4 pb-24">
            <button 
              onClick={startSpeechRecognition}
              className={`h-44 w-44 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${voiceState === 'listening' ? 'bg-red-500 sos-pulse' : 'bg-orange-500'}`}
            >
              <Mic className="h-20 w-20" />
            </button>

            <div className="mt-10 space-y-4 w-full">
              <VoiceVisualizer state={voiceState} />
              <p className="text-base font-bold text-slate-700 min-h-[56px] px-4 leading-relaxed bg-slate-50 py-4 rounded-2xl border border-slate-100">
                {voiceText || 'Tap the microphone and speak your request. (e.g. "I need physiotherapy tomorrow morning")'}
              </p>
            </div>

            {voiceState === 'understood' && selectedService && (
              <div className="w-full bg-white border border-slate-200/80 p-5 rounded-3xl text-left animate-fade-in mt-6 shadow-sm">
                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-full">Detected Request</span>
                <h4 className="font-extrabold text-base mt-2 text-slate-800">{selectedService}</h4>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setScreen('confirm')} className="flex-grow btn-primary h-12 rounded-xl text-xs font-bold">
                    Yes, Proceed
                  </button>
                  <button onClick={() => { setSelectedCategory(null); setScreen('home'); }} className="px-4 border text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 10. Care Buddy Active Route Tracking */}
      {screen === 'buddyActive' && activeBooking && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('home')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-6 w-6 rotate-45" /></button>
            <div>
              <h2 className="text-base font-black text-slate-800">Care Buddy Tracking</h2>
              <p className="text-xs text-slate-400 font-bold">Ravi Kumar (★ 4.9 · Verified Companion)</p>
            </div>
            <div className="w-12"></div>
          </div>

          <div className="flex-grow p-4 space-y-4 overflow-y-auto screen-scroll bg-slate-50/50 pb-24">
            <LiveMap isActive={true} onArrived={() => console.log('Buddy Arrived')} />
            
            <div className="bg-white border border-slate-100 p-4.5 rounded-3xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl">R</div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 leading-tight">Ravi Kumar</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Background checked companion</p>
                </div>
              </div>
              <a href="tel:+919876543210" className="h-11 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5">
                <Phone className="h-4 w-4" /> Call Ravi
              </a>
            </div>

            <div className="bg-orange-50 border border-orange-200/60 p-5 rounded-3xl text-slate-800 text-center space-y-1">
              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block">Passcode for Helper</span>
              <p className="text-4xl font-black tracking-widest text-slate-800">{activeBooking.otp}</p>
              <p className="text-[10px] text-slate-500 max-w-[260px] mx-auto leading-relaxed mt-2 font-medium">
                Share this passcode with Ravi when he arrives at your home.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 11. SOS Active Emergency Room */}
      {screen === 'sosActive' && (
        <div className="flex-1 p-6 bg-red-700 text-white text-center flex flex-col justify-between animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center text-white mb-6 sos-pulse">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black tracking-wide">HELP REQUESTED</h1>
            <p className="text-lg font-extrabold opacity-95 max-w-xs mt-3 leading-relaxed">
              We have captured your coordinates and sent emergency notifications to Sarah Wilson and our care coordinator.
            </p>
            <div className="bg-white/10 p-5 rounded-3xl border border-white/15 max-w-xs mt-8 text-xs text-left space-y-3 w-full font-semibold">
              <p className="font-extrabold uppercase tracking-wider text-[10px]">Response pipeline</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Location shared</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Sarah notified via SMS/WhatsApp</p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping"></span> Saathi coordinators engaging help</p>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => { setSosEvent(null); setScreen('home'); }}
              className="w-full bg-white text-red-700 font-black h-16 rounded-2xl shadow-md text-sm hover:bg-slate-100"
            >
              I am safe now (Close SOS)
            </button>
            <a href="tel:108" className="block w-full border-2 border-white/40 hover:bg-white/10 font-bold h-14 rounded-2xl text-xs flex items-center justify-center gap-1.5">
              <Phone className="h-4 w-4" /> Call 108 Directly
            </a>
          </div>
        </div>
      )}

      {/* 12. Settings Room */}
      {screen === 'settings' && (
        <div className="flex-1 flex flex-col justify-between bg-[#f8fafc] animate-fade-in">
          <div className="p-4 bg-white border-b flex items-center justify-between shrink-0">
            <button onClick={() => setScreen('home')} className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-6 w-6 rotate-45" /></button>
            <h2 className="text-lg font-black text-slate-800">Accessibility Settings</h2>
            <div className="w-12"></div>
          </div>

          <div className="flex-grow p-4 space-y-4 overflow-y-auto screen-scroll pb-24">
            <div className="bg-white border rounded-3xl p-2 divide-y divide-slate-100 shadow-sm text-sm">
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
        </div>
      )}

      {/* 13. Persistent SOS & CALL SUPPORT Bottom Bar (Hidden during onboarding/auth) */}
      {!hidePersistentBar && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200/80 shadow-lg flex gap-3 z-30 shrink-0">
          {/* Emergency SOS Hold-to-Trigger Button */}
          <button 
            onMouseDown={startSosHold}
            onMouseUp={endSosHold}
            onTouchStart={startSosHold}
            onTouchEnd={endSosHold}
            className="flex-1 h-18 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-2xl flex flex-col items-center justify-center gap-0.5 shadow-md select-none relative overflow-hidden active:scale-95 transition-all"
          >
            {/* SOS Holding Progress overlay */}
            {sosHoldPercent > 0 && (
              <span className="absolute left-0 top-0 bottom-0 bg-red-800 transition-all opacity-80" style={{ width: `${sosHoldPercent}%` }}></span>
            )}
            <span className="relative z-10 flex items-center gap-1.5 text-sm font-black tracking-wide">
              <ShieldAlert className="h-5 w-5" /> SOS EMERGENCY
            </span>
            <span className="relative z-10 text-[9px] font-bold opacity-80 uppercase tracking-widest">Hold for 3 seconds</span>
          </button>

          {/* Call Support Button */}
          <a 
            href="tel:108"
            className="w-28 h-18 border-2 border-slate-200 hover:border-slate-300 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-700 select-none hover:bg-slate-100 transition-all"
          >
            <Phone className="h-5 w-5 text-slate-600" />
            <span className="text-[9px] font-black uppercase mt-1 tracking-wider">Call Support</span>
          </a>
        </div>
      )}

    </div>
  );
}
