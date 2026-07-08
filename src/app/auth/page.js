'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Phone, ArrowRight } from 'lucide-react';
import supabase from '../../lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('+91 98765 43210');
  const [role, setRole] = useState('elder'); // Default choice for simulation signup
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Simulate authentication or login check
      // In real production with OTP, we call: supabase.auth.signInWithOtp({ phone })
      
      // Save session details to localStorage for persistence
      const sessionData = {
        phone,
        role,
        authenticated: true,
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('amiko_session', JSON.stringify(sessionData));

      // 2. Redirect based on profile status
      // In a real database, we check if their profile exists in tables
      const storedProfile = localStorage.getItem(`amiko_profile_${phone}`);
      
      if (!storedProfile && (role === 'elder' || role === 'guardian')) {
        // New user needs onboarding details
        router.push('/onboarding');
      } else {
        // Redirect to role-gated dashboard
        router.push(`/${role}`);
      }
    } catch (err) {
      console.error(err);
      alert('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-lg space-y-8 animate-fade-in">
        
        <div className="text-center space-y-3">
          <div className="h-16 w-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center text-white shadow-md mx-auto">
            <Heart className="h-8 w-8 fill-white/10" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 font-headers">Welcome to Amiko</h1>
          <p className="text-sm font-semibold text-slate-500">Sign in with your mobile number to connect to your care network.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
            <input 
              type="text" 
              required
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full h-14 px-4 border-2 border-slate-100 focus:border-orange-500 rounded-2xl outline-none font-bold text-slate-800 text-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Select Your Role</label>
            <select 
              value={role} 
              onChange={e => setRole(e.target.value)}
              className="w-full h-14 px-3 border-2 border-slate-100 rounded-2xl bg-white outline-none font-bold text-sm text-slate-700"
            >
              <option value="elder">Elder Client (Margaret)</option>
              <option value="guardian">Family Guardian (Sarah)</option>
              <option value="buddy">Care Buddy companion (Ravi)</option>
              <option value="admin">Operations Coordinator (Admin)</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full btn-primary h-14 rounded-2xl flex items-center justify-center gap-1.5 shadow-md text-base font-bold"
          >
            {loading ? 'Sending OTP Code...' : 'Get Passcode'} <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed font-semibold">
          By continuing, you agree to receive SMS notifications. Safety is our priority.
        </p>

      </div>
    </div>
  );
}
