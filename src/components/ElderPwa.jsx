'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, User, Check, ShieldAlert, Navigation, Mic, Calendar, Clock, 
  Settings, Volume2, Shield, Heart, ShoppingBag, Truck, Info, Star,
  ArrowRight, ArrowLeft, AlertCircle, VolumeX, CheckSquare
} from 'lucide-react';
import VoiceVisualizer from './VoiceVisualizer';
import LiveMap from './LiveMap';

const SERVICE_CATEGORIES = [
  { id: 'health', title: 'Health Support', tone: 'success', icon: Heart, desc: 'BP, Blood Sugar, Physio' },
  { id: 'travel', title: 'Accompaniment', tone: 'primary', icon: Truck, desc: 'Hospital, Bank, Temple' },
  { id: 'shopping', title: 'Essentials', tone: 'accent', icon: ShoppingBag, desc: 'Grocery, Medicine' },
  { id: 'homeSupport', title: 'Home Support', tone: 'info', icon: Settings, desc: 'Plumber, Electrician' },
  { id: 'emergency', title: 'Emergency', tone: 'destructive', icon: ShieldAlert, desc: '24/7 Safety SOS' }
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
  const [screen, setScreen] = useState('onboarding'); // onboarding, auth, register, waitingApproval, home, category, confirm, buddyActive, sos, settings
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [mood, setMood] = useState(null);
  
  // Registration Wizard Step
  const [regStep, setRegStep] = useState(1); // 1: Personal, 2: Location, 3: Guardian, 4: Consents
  
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
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, understood, error
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

  // Web Speech API initialization
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
        return prev + 4;
      });
    }, 120);
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
      alert("Please accept all disclaimers and consents.");
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
      alert(`Insufficient balance. Requires ${cost} coupons, but you only have ${walletBalance}. Please notify Sarah.`);
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
      notes: `Service Booking: ${selectedService}`,
      created_at: new Date().toISOString()
    }, ...prev]);

    setScreen('home');
  };

  const activeBooking = bookings.find(b => b.status === 'buddy_assigned' || b.status === 'buddy_en_route' || b.status === 'service_started');

  return (
    <div className={`flex flex-col h-full bg-[#f8fafc] text-[#0f172a] relative overflow-hidden select-none`}>
      
      {/* 1. Onboarding Screen */}
      {screen === 'onboarding' && (
        <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white">
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div className="h-24 w-24 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-[30%] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-8 transform hover:rotate-6 transition-transform">
              <Heart className="h-12 w-12 fill-white/20" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight text-slate-800 leading-tight">
              {onboardingIndex === 0 ? 'Care coordinates made simple.' : onboardingIndex === 1 ? 'Accompanied visits.' : 'Emergency safety desk.'}
            </h1>
            <p className="text-sm font-semibold text-slate-500 max-w-[270px] mt-4 leading-relaxed">
              {onboardingIndex === 0 
                ? 'Your companion Care Buddy is just one tap away. Verified daily errand care for seniors.' 
                : onboardingIndex === 1 
                ? 'Hospital checkups, banking tasks, shopping runs, or temple visits. A verified Buddy goes with you.'
                : 'Pulsing SOS alerts dispatch instantly to family, ambulance operators, and active dispatch teams.'}
            </p>
            
            <div className="flex gap-2 mt-10">
              {[0, 1, 2].map(i => (
                <span key={i} className={`h-2.5 rounded-full transition-all ${i === onboardingIndex ? 'w-8 bg-orange-500' : 'w-2.5 bg-slate-200'}`}></span>
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => onboardingIndex < 2 ? setOnboardingIndex(onboardingIndex + 1) : setScreen('auth')}
              className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-1.5 shadow-md text-base"
            >
              {onboardingIndex === 2 ? 'Get Started' : 'Next'} <ArrowRight className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setScreen('auth')}
              className="w-full text-slate-400 font-bold text-xs py-2 hover:text-slate-600 transition-colors tap-target"
            >
              Skip introduction
            </button>
          </div>
        </div>
      )}

      {/* 2. Login Screen */}
      {screen === 'auth' && (
        <div className="flex-1 p-6 flex flex-col justify-between bg-white animate-fade-in">
          <div>
            <div className="flex items-center gap-4 mt-8">
              <div className="h-14 w-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                <Heart className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 leading-tight">Amiko Sign In</h1>
                <p className="text-xs text-slate-400 font-bold uppercase mt-0.5 tracking-wider">Companion care network</p>
              </div>
            </div>

            <div className="mt-10 space-y-6">
              <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-3xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center"><Phone className="h-5 w-5" /></div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-orange-600 tracking-wider">Detected Account</span>
                    <h3 className="font-extrabold text-slate-800 text-base">{phoneInput}</h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setScreen('register')}
                  className="w-full btn-primary h-14 rounded-2xl mt-5 shadow-sm text-sm font-bold flex items-center justify-center gap-2 tap-target"
                >
                  Continue with this number <ArrowRight className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-300 text-[10px] font-black uppercase tracking-wider">Or enter manually</span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Mobile number</label>
                <input 
                  type="text" 
                  value={phoneInput} 
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full h-14 px-4 border-2 border-slate-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
          
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            By signing in, you authorize security verification steps. Standard carrier SMS rates apply for OTP dispatches.
          </p>
        </div>
      )}

      {/* 3. Register Wizard Screen */}
      {screen === 'register' && (
        <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <button 
              onClick={() => regStep > 1 ? setRegStep(regStep - 1) : setScreen('auth')}
              className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Step {regStep} of 4</span>
            <div className="w-10"></div>
          </div>

          {/* Form Scroll Area */}
          <div className="flex-1 overflow-y-auto p-5 screen-scroll space-y-5">
            
            {/* Step 1: Elder Details */}
            {regStep === 1 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-black text-slate-800 leading-tight">Tell us about yourself</h2>
                <p className="text-xs text-slate-400 font-semibold">Your Buddy needs this information to assist you.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Full Name</label>
                    <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="Margaret Wilson" className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Age</label>
                      <input type="number" value={regAge} onChange={e => setRegAge(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Phone</label>
                      <input value={regPhone} onChange={e => setRegPhone(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {regStep === 2 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-black text-slate-800 leading-tight">Where do you live?</h2>
                <p className="text-xs text-slate-400 font-semibold">Service boundary and GPS address mapping.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Home Address</label>
                    <input value={regAddress} onChange={e => setRegAddress(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">City/Locality</label>
                      <input value={regLocality} onChange={e => setRegLocality(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Medical Condition</label>
                      <input value={regMedical} onChange={e => setRegMedical(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Guardian Details */}
            {regStep === 3 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-black text-slate-800 leading-tight">Guardian Information</h2>
                <p className="text-xs text-slate-400 font-semibold">Responsible family contact for wallet setup.</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Guardian Name</label>
                    <input value={regGuardianName} onChange={e => setRegGuardianName(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Relationship</label>
                      <input value={regGuardianRel} onChange={e => setRegGuardianRel(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Mobile</label>
                      <input value={regGuardianPhone} onChange={e => setRegGuardianPhone(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                    <input value={regGuardianEmail} onChange={e => setRegGuardianEmail(e.target.value)} className="w-full h-13 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-semibold" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Consents & Disclaimer */}
            {regStep === 4 && (
              <div className="space-y-4 animate-fade-in">
                <h2 className="text-xl font-black text-red-600 leading-tight flex items-center gap-1.5">
                  <Shield className="h-5 w-5" /> Consents &amp; Disclaimers
                </h2>
                
                <div className="bg-red-50 border border-red-200/60 p-3.5 rounded-2xl text-[10px] text-red-800 leading-relaxed font-semibold">
                  <strong>DISCLAIMER:</strong> Amiko is a care coordination and errand assistance service. We are not a medical provider or ambulance service. Dial 108 for medical crises.
                </div>

                <div className="space-y-3 text-xs font-semibold text-slate-600">
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentElder} onChange={e => setConsentElder(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 accent-orange-500 rounded" />
                    <span>Authorize registration on Amiko care platform.</span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentGuardian} onChange={e => setConsentGuardian(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 accent-orange-500 rounded" />
                    <span>Authorize linking coupon wallet with Sarah.</span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentLocation} onChange={e => setConsentLocation(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 accent-orange-500 rounded" />
                    <span>Authorize location-sharing during active visits.</span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer">
                    <input type="checkbox" checked={consentMedical} onChange={e => setConsentMedical(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 accent-orange-500 rounded" />
                    <span>Authorize secure storage of medical concerns.</span>
                  </label>
                  <label className="flex items-start gap-3 p-3.5 bg-red-50/40 rounded-2xl border border-red-100 cursor-pointer">
                    <input type="checkbox" checked={consentDisclaimer} onChange={e => setConsentDisclaimer(e.target.checked)} className="mt-0.5 h-4.5 w-4.5 accent-red-600 rounded" />
                    <span className="text-red-950 font-bold">Accept the Medical Disclaimer.</span>
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
                className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                Next Step <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleRegisterSubmit}
                className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-sm"
              >
                Accept &amp; Submit Review
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
            <h1 className="text-2xl font-black text-slate-800">Verification Pending</h1>
            <p className="text-xs text-slate-500 font-semibold max-w-xs mt-3 leading-relaxed">
              Your profile is currently under review by our care operations team at <strong>eldercaresaathi.com</strong>.
            </p>
            
            <div className="w-full bg-white border border-slate-100 p-5 rounded-3xl mt-8 text-left space-y-3 shadow-sm text-xs">
              <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px]">Onboarding checklist</p>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Profile verifications (BGV address)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Sarah linked via secure passcode</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <span className="h-5 w-5 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Coupon wallet allocations enabled</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Urgent need? <a href="tel:108" className="text-red-600 underline font-black">Call Emergency 108</a>
          </div>
        </div>
      )}

      {/* 5. Home Screen */}
      {screen === 'home' && (
        <div className="flex-1 flex flex-col justify-between bg-slate-50/70 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-white border-b flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-sm">M</div>
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Good morning</span>
                <h2 className="text-base font-extrabold text-slate-800 leading-tight">Margaret Wilson</h2>
              </div>
            </div>
            <button 
              onClick={() => setScreen('settings')}
              className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50 tap-target"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Home body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 screen-scroll pb-24">
            
            {/* Active Visit Tracking Banner */}
            {activeBooking && (
              <div 
                onClick={() => setScreen('buddyActive')}
                className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4 rounded-3xl shadow-md cursor-pointer flex items-center justify-between animate-pulse"
              >
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">Live Visit</span>
                  <h4 className="font-extrabold text-sm mt-1">{activeBooking.service_label}</h4>
                  <p className="text-[10px] opacity-90 mt-0.5">Ravi Kumar is en route</p>
                </div>
                <span className="text-xs font-black bg-white text-orange-600 px-3 py-1.5 rounded-xl uppercase">View Map</span>
              </div>
            )}

            {/* Daily Mood logger */}
            <div className="bg-white border border-slate-100 p-4.5 rounded-3xl shadow-sm">
              <h3 className="text-sm font-black text-slate-800">How are you feeling today?</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Your Guardian will see your mood update.</p>
              
              <div className="flex gap-2 mt-3.5">
                {['😊 Great', '🙂 Good', '😐 Okay', '😔 Low', '😣 Unwell'].map(mOption => {
                  const emoji = mOption.split(' ')[0];
                  const label = mOption.split(' ')[1];
                  const isSel = mood === label;
                  return (
                    <button
                      key={label}
                      onClick={() => setMood(label)}
                      className={`flex-1 py-3.5 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all ${isSel ? 'border-orange-500 bg-orange-50/50' : 'border-transparent bg-slate-50 hover:bg-slate-100/70'}`}
                    >
                      <span className="text-2xl leading-none">{emoji}</span>
                      <span className="text-[9px] font-bold mt-1">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speak request shortcut */}
            <button 
              onClick={() => { setScreen('voiceRequest'); startSpeechRecognition(); }}
              className="w-full bg-gradient-to-br from-slate-900 to-slate-800 hover:to-slate-950 text-white rounded-3xl p-5 text-left flex items-center justify-between shadow-md tap-target"
            >
              <div>
                <h3 className="text-base font-black leading-none">Speak Your Request</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-2">"Take me to the bank tomorrow"</p>
              </div>
              <div className="h-12 w-12 bg-white/10 text-orange-500 rounded-full flex items-center justify-center shadow-inner">
                <Mic className="h-6 w-6" />
              </div>
            </button>

            {/* Categories list */}
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Book Services</h3>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_CATEGORIES.filter(c => c.id !== 'emergency').map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button 
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat); setScreen('category'); }}
                      className="bg-white border border-slate-100 hover:border-orange-200 hover:shadow-sm p-4 rounded-3xl text-left transition-all flex flex-col justify-between min-h-[125px] tap-target"
                    >
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${cat.tone === 'success' ? 'bg-emerald-50 text-emerald-600' : cat.tone === 'primary' ? 'bg-blue-50 text-blue-600' : cat.tone === 'accent' ? 'bg-orange-50 text-orange-600' : 'bg-sky-50 text-sky-600'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800 leading-tight">{cat.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-1">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bottom SOS Trigger */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t flex items-center gap-3">
            <button 
              onClick={() => setScreen('sos')}
              className="flex-grow btn-primary h-14 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 rounded-2xl flex items-center justify-center gap-2 shadow-md text-sm font-extrabold tap-target"
            >
              <ShieldAlert className="h-5 w-5" /> EMERGENCY SOS
            </button>
            <div className="h-14 bg-slate-50 border px-4 rounded-2xl flex flex-col justify-center text-center">
              <span className="text-[9px] font-black text-slate-400 uppercase">Wallet</span>
              <span className="text-sm font-black text-slate-800">{walletBalance} CP</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Category Screen */}
      {screen === 'category' && selectedCategory && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setScreen('home')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-50"><Check className="h-5 w-5 rotate-45" /></button>
            <div>
              <h2 className="text-base font-black text-slate-800">{selectedCategory.title}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Select a service</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 screen-scroll bg-slate-50/50">
            {(selectedCategory.id === 'health' 
              ? ['BP Check (2 CP)', 'Blood Sugar Check (2 CP)', 'Physiotherapy (5 CP)', 'Lab Test Assistance (4 CP)', 'Medication Reminder (1 CP)']
              : selectedCategory.id === 'travel'
              ? ['Hospital Visit (6 CP)', 'Bank Visit (6 CP)', 'Pharmacy Visit (3 CP)', 'Temple Visit (4 CP)']
              : selectedCategory.id === 'shopping'
              ? ['Grocery Shopping (3 CP)', 'Medicine Pickup (3 CP)', 'Utility Bill Assistance (2 CP)', 'Document Submission (3 CP)']
              : ['Electrician (5 CP)', 'Plumber (5 CP)', 'Carpenter (5 CP)', 'Appliance Repair (6 CP)', 'Emergency Home Maintenance (8 CP)']
            ).map(label => {
              const cleanLabel = label.split(' (')[0];
              const costText = label.split(' (')[1].replace(')', '');
              return (
                <button 
                  key={label}
                  onClick={() => { setSelectedService(cleanLabel); setScreen('confirm'); }}
                  className="w-full bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between text-left hover:border-orange-500 hover:shadow-sm transition-all tap-target"
                >
                  <span className="font-extrabold text-sm text-slate-800">{cleanLabel}</span>
                  <span className="text-[10px] font-black bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full">{costText}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Confirm Screen (Custom Styled Selectors instead of dropdowns) */}
      {screen === 'confirm' && selectedCategory && selectedService && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setScreen('category')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-5 w-5 rotate-45" /></button>
            <div>
              <h2 className="text-base font-black text-slate-800">Confirm Request</h2>
              <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">Booking slots</p>
            </div>
          </div>

          <div className="flex-1 p-5 space-y-5 overflow-y-auto screen-scroll bg-slate-50/50">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-5 rounded-3xl shadow-sm">
              <span className="text-[9px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">{selectedCategory.title}</span>
              <h3 className="text-xl font-black mt-2">{selectedService}</h3>
              <p className="text-xs opacity-90 mt-1">Inspected and verified slot requirements.</p>
            </div>

            {/* 12h Lead time advisory */}
            <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800 leading-relaxed font-semibold">
                <strong>Notice:</strong> Bookings require at least 12 hours lead time to dispatch a verified care associate. For urgent distress, trigger the SOS desk.
              </p>
            </div>

            {/* Date selection custom chips */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">When do you need help?</label>
              <div className="flex gap-2">
                {['Tomorrow', 'In 2 days', 'In 3 days'].map(dOpt => (
                  <button 
                    key={dOpt}
                    onClick={() => setBookingDate(dOpt)}
                    className={`flex-1 py-3.5 border-2 rounded-2xl font-bold text-xs ${bookingDate === dOpt ? 'border-orange-500 bg-orange-50/30 text-orange-800' : 'border-slate-200/60 bg-white text-slate-600'}`}
                  >
                    {dOpt}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot chips */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                {['Morning (8–11)', 'Noon (11–2)', 'Afternoon (2–5)', 'Evening (5–7)'].map(tOpt => (
                  <button 
                    key={tOpt}
                    onClick={() => setBookingTime(tOpt)}
                    className={`py-3.5 border-2 rounded-2xl font-bold text-xs ${bookingTime === tOpt ? 'border-orange-500 bg-orange-50/30 text-orange-800' : 'border-slate-200/60 bg-white text-slate-600'}`}
                  >
                    {tOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-white shrink-0">
            <button 
              onClick={handleCreateBooking}
              className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-sm"
            >
              Verify &amp; Book Service
            </button>
          </div>
        </div>
      )}

      {/* 8. Voice Request Screen */}
      {screen === 'voiceRequest' && (
        <div className="flex-1 p-5 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setScreen('home')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-5 w-5 rotate-45" /></button>
            <h2 className="text-base font-black text-slate-800">Voice Assistant Request</h2>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
            <button 
              onClick={startSpeechRecognition}
              className={`h-40 w-40 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${voiceState === 'listening' ? 'bg-red-500 sos-pulse' : 'bg-orange-500'}`}
            >
              <Mic className="h-16 w-16" />
            </button>

            <div className="mt-8 space-y-4 w-full">
              <VoiceVisualizer state={voiceState} />
              <p className="text-sm font-bold text-slate-700 min-h-[48px] px-4 leading-relaxed bg-slate-50 py-3 rounded-2xl border border-slate-100">
                {voiceText || 'Tap the microphone and speak your request. (e.g. "I need physiotherapy tomorrow morning")'}
              </p>
            </div>

            {voiceState === 'understood' && selectedService && (
              <div className="w-full bg-white border border-slate-200/80 p-5 rounded-3xl text-left animate-fade-in mt-6 shadow-sm">
                <span className="text-[9px] font-black uppercase text-orange-600 bg-orange-100/50 px-2 py-0.5 rounded-full">Parsed Service Details</span>
                <h4 className="font-extrabold text-base mt-2.5 text-slate-800">{selectedService}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-normal">Speech commands matched successfully to catalog options.</p>
                <div className="flex gap-2 mt-4.5">
                  <button onClick={() => setScreen('confirm')} className="flex-grow btn-primary h-11 rounded-xl text-xs">
                    Confirm &amp; Proceed
                  </button>
                  <button onClick={() => { setSelectedCategory(null); setScreen('home'); }} className="px-4 border text-slate-500 font-bold rounded-xl text-xs hover:bg-slate-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-400 text-center font-semibold">
            Powered by Browser Native Web Speech API
          </div>
        </div>
      )}

      {/* 9. Care Buddy Active Route Tracking */}
      {screen === 'buddyActive' && activeBooking && (
        <div className="flex-1 flex flex-col justify-between bg-white animate-fade-in">
          <div className="p-4 border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setScreen('home')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-5 w-5 rotate-45" /></button>
            <div>
              <h2 className="text-base font-black text-slate-800">Care Buddy En Route</h2>
              <p className="text-xs text-slate-400 font-bold">Ravi Kumar (★ 4.9 · Verified)</p>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-4 overflow-y-auto screen-scroll bg-slate-50/50">
            <LiveMap isActive={true} onArrived={() => console.log('Buddy Arrived')} />
            
            <div className="bg-white border border-slate-100 p-4 rounded-3xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-black text-xl">R</div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800">Ravi Kumar</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">Background verification complete</p>
                </div>
              </div>
              <a href="tel:+919876543210" className="h-10 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors">
                <Phone className="h-3.5 w-3.5" /> Call Ravi
              </a>
            </div>

            <div className="bg-orange-50 border border-orange-200/60 p-5 rounded-3xl text-slate-800 text-center space-y-1">
              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest block">Verification OTP Code</span>
              <p className="text-4xl font-black tracking-widest text-slate-800">{activeBooking.otp}</p>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed mt-2 font-medium">
                Provide this OTP code to Ravi in person when he arrives to authorize the check-in visit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 10. SOS Emergency Activation Page */}
      {screen === 'sos' && (
        <div className="flex-1 p-6 flex flex-col justify-between bg-red-50 text-center animate-fade-in">
          <div className="p-4 flex items-center justify-between">
            <button onClick={() => setScreen('home')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-600 bg-white"><Check className="h-5 w-5 rotate-45" /></button>
            <span className="text-xs font-black text-red-600 uppercase tracking-widest">Emergency Help Desk</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-xl font-black text-red-800">Emergency Alert</h2>
            <p className="text-xs text-red-600/90 font-semibold max-w-[280px] mt-2 leading-relaxed">
              Press and hold the button below for 3 seconds. The system immediately captures your coordinates and alerts Sarah, local EMS, and dispatch panels.
            </p>

            <button 
              onMouseDown={startSosHold}
              onMouseUp={endSosHold}
              onTouchStart={startSosHold}
              onTouchEnd={endSosHold}
              className="mt-10 h-48 w-48 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all select-none sos-pulse tap-target"
            >
              <span>HOLD</span>
              <span className="text-xs opacity-95">3 SECONDS</span>
            </button>

            {sosHoldPercent > 0 && (
              <div className="w-48 bg-red-200 h-2.5 rounded-full overflow-hidden mt-6">
                <div className="bg-red-600 h-full transition-all" style={{ width: `${sosHoldPercent}%` }}></div>
              </div>
            )}
          </div>

          {/* SOS Offline Fallback Options */}
          <div className="space-y-3 pt-6 border-t border-red-200/40">
            <span className="text-[10px] text-red-700 font-black uppercase tracking-wider block">If Offline, Call Immediately:</span>
            <div className="grid grid-cols-2 gap-3">
              <a href="tel:108" className="h-13 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm">
                <Phone className="h-4 w-4" /> Call 108 (EMS)
              </a>
              <a href="tel:+919812345678" className="h-13 bg-white border-2 border-red-200 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-sm">
                <Phone className="h-4 w-4" /> Call Sarah (Guardian)
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 11. SOS Active Emergency Room */}
      {screen === 'sosActive' && (
        <div className="flex-1 p-6 bg-red-700 text-white text-center flex flex-col justify-between animate-fade-in">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center text-white mb-6 sos-pulse">
              <ShieldAlert className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-black tracking-wide">SOS ACTIVE</h1>
            <p className="text-sm font-extrabold opacity-90 max-w-xs mt-3 leading-relaxed">
              GPS location snapshot captured. The Amiko Safety Operations console has prioritized your alert.
            </p>
            <div className="bg-white/10 p-5 rounded-3xl border border-white/15 max-w-xs mt-8 text-xs text-left space-y-3 w-full">
              <p className="font-extrabold uppercase tracking-wider text-[10px]">Response pipeline</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> GPS coordinates matched</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Sarah Wilson notified via SMS/WhatsApp</p>
              <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping"></span> Waiting for Admin operator pickup</p>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => { setSosEvent(null); setScreen('home'); }}
              className="w-full bg-white text-red-700 font-black h-14 rounded-2xl shadow-md text-sm hover:bg-slate-100"
            >
              I am safe now (Close SOS)
            </button>
            <a href="tel:108" className="block w-full border-2 border-white/40 hover:bg-white/10 font-bold h-12 rounded-2xl text-xs flex items-center justify-center gap-1.5">
              <Phone className="h-4 w-4" /> Call 108 Directly
            </a>
          </div>
        </div>
      )}

      {/* 12. Settings Room (Accessibility overrides) */}
      {screen === 'settings' && (
        <div className="flex-1 flex flex-col justify-between bg-[#f8fafc] animate-fade-in">
          <div className="p-4 bg-white border-b flex items-center gap-3 shrink-0">
            <button onClick={() => setScreen('home')} className="h-10 w-10 border rounded-full flex items-center justify-center text-slate-500"><Check className="h-5 w-5 rotate-45" /></button>
            <h2 className="text-base font-black text-slate-800">Accessibility Settings</h2>
          </div>

          <div className="flex-grow p-4 space-y-4 overflow-y-auto screen-scroll">
            <div className="bg-white border rounded-3xl p-2 divide-y divide-slate-100 shadow-sm">
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

    </div>
  );
}
