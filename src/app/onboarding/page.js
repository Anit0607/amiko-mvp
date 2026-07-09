'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ArrowRight, Shield, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState(null);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);

  // Elder registration states
  const [name, setName] = useState('Margaret Wilson');
  const [age, setAge] = useState('74');
  const [address, setAddress] = useState('42 Rose Garden, MG Road');
  const [locality, setLocality] = useState('Bengaluru');
  const [medical, setMedical] = useState('Hypertension');
  const [guardianName, setGuardianName] = useState('Sarah Wilson');
  const [guardianPhone, setGuardianPhone] = useState('+91 98123 45678');
  const [guardianEmail, setGuardianEmail] = useState('sarah@example.com');
  const [guardianRel, setGuardianRel] = useState('Daughter');

  // Consent states
  const [consentElder, setConsentElder] = useState(true);
  const [consentGuardian, setConsentGuardian] = useState(true);
  const [consentLocation, setConsentLocation] = useState(true);
  const [consentMedical, setConsentMedical] = useState(true);
  const [consentDisclaimer, setConsentDisclaimer] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('amiko_session');
    if (!session) {
      router.push('/auth');
      return;
    }
    const { role: userRole, phone: userPhone } = JSON.parse(session);
    setRole(userRole);
    setPhone(userPhone);

    // If it's admin or buddy, we bypass detailed wizard and onboard instantly
    if (userRole === 'admin' || userRole === 'buddy') {
      const profileData = { full_name: userRole === 'admin' ? 'Operations Admin' : 'Care Buddy Ravi', phone: userPhone };
      localStorage.setItem(`amiko_profile_${userPhone}`, JSON.stringify(profileData));
      router.push(`/${userRole}`);
    }
  }, [router]);

  const handleSubmitElder = async () => {
    if (!consentElder || !consentGuardian || !consentLocation || !consentMedical || !consentDisclaimer) {
      alert("Please accept all care agreements to complete registration.");
      return;
    }

    const profileData = {
      full_name: name,
      age: parseInt(age),
      phone,
      address,
      city_locality: locality,
      medical_conditions: medical,
      guardian_name: guardianName,
      guardian_phone: guardianPhone,
      guardian_email: guardianEmail,
      guardian_relationship: guardianRel,
      status: 'pending'
    };

    try {
      const res = await fetch('/api/elders/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name,
          age,
          address,
          city_locality: locality,
          medical_conditions: medical,
          guardian_phone: guardianPhone
        })
      });

      if (res.ok) {
        localStorage.setItem(`amiko_profile_${phone}`, JSON.stringify(profileData));
        localStorage.setItem('amiko_registered_elder', JSON.stringify(profileData));
        router.push('/elder');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Guardian onboarding flow
  const handleSubmitGuardian = async () => {
    const profileData = {
      full_name: guardianName,
      phone,
      linked_elder_phone: guardianPhone || '+91 98765 43210',
      status: 'active'
    };

    try {
      const res = await fetch('/api/guardians/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          guardian_name: guardianName,
          elder_phone: guardianPhone || '+91 98765 43210'
        })
      });

      if (res.ok) {
        localStorage.setItem(`amiko_profile_${phone}`, JSON.stringify(profileData));
        router.push('/guardian');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!role) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking credentials...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-[19px]">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex flex-col h-[700px] animate-fade-in">
        
        {/* Onboarding Wizard Header */}
        <div className="p-4 border-b flex items-center justify-between shrink-0 bg-slate-50">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.push('/auth')}
            className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-500 bg-white"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Part {step} of 4</span>
          <div className="w-12"></div>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 screen-scroll">
          
          {role === 'elder' && (
            <>
              {step === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">What is your name?</h2>
                  <p className="text-sm text-slate-500 font-semibold">Your Care Buddy needs this information to know who they are assisting.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Your Full Name</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Margaret Wilson" className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Your Age</label>
                        <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Your Phone</label>
                        <input disabled value={phone} className="w-full h-16 px-4 border-2 border-slate-100 bg-slate-100 outline-none rounded-xl font-bold text-base text-slate-500" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Where is your home?</h2>
                  <p className="text-sm text-slate-500 font-semibold">This address will be shared only with your matched Care Buddy.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Home Address</label>
                      <input value={address} onChange={e => setAddress(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">City</label>
                        <input value={locality} onChange={e => setLocality(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Medical Conditions</label>
                        <input value={medical} onChange={e => setMedical(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Emergency Contact</h2>
                  <p className="text-sm text-slate-500 font-semibold">Your family member who will manage coupon balance approvals.</p>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Guardian Name</label>
                      <input value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Relationship</label>
                        <input value={guardianRel} onChange={e => setRegGuardianRel(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Mobile</label>
                        <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">Email Address</label>
                      <input value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 animate-fade-in text-xs font-semibold text-slate-600">
                  <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Care Agreements</h2>
                  
                  <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed font-semibold">
                    <strong>DISCLAIMER:</strong> Amiko is an assistant service for daily errands and care support. We are not an emergency hospital or ambulance provider. For medical crises, please call 108.
                  </div>

                  <div className="space-y-3 pt-2">
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
            </>
          )}

          {role === 'guardian' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-2xl font-black text-slate-800 leading-tight font-headers">Guardian Details</h2>
              <p className="text-sm text-slate-500 font-semibold">Verify details to link with Margaret Wilson.</p>
              
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Your Full Name</label>
                  <input value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Sarah Wilson" className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Linking Elder Phone Number</label>
                  <input value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} className="w-full h-16 px-4 border-2 border-slate-100 focus:border-orange-500 outline-none rounded-xl font-bold text-base text-slate-800 bg-slate-50/50" />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-slate-50 shrink-0">
          {role === 'elder' && step < 4 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-base font-bold"
            >
              Next Step <ArrowRight className="h-5 w-5" />
            </button>
          ) : role === 'elder' ? (
            <button 
              onClick={handleSubmitElder}
              className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-base font-bold"
            >
              Accept &amp; Complete
            </button>
          ) : (
            <button 
              onClick={handleSubmitGuardian}
              className="w-full btn-primary h-16 rounded-2xl flex items-center justify-center gap-1.5 shadow-sm text-base font-bold"
            >
              Link &amp; Enter Dashboard
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
