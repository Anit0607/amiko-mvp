'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Phone, Check } from 'lucide-react';

export default function SosPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [sosEvent, setSosEvent] = useState(null);
  const [sosHoldPercent, setSosHoldPercent] = useState(0);
  const sosTimerRef = useRef(null);

  useEffect(() => {
    const rawSession = localStorage.getItem('amiko_session');
    if (!rawSession) {
      router.push('/auth');
      return;
    }
    const parsed = JSON.parse(rawSession);
    setSession(parsed);

    const loadState = () => {
      const sos = localStorage.getItem('amiko_sos_event');
      if (sos) setSosEvent(JSON.parse(sos));
    };

    loadState();

    const handleStorageChange = (e) => {
      if (e.key === 'amiko_sos_event') {
        setSosEvent(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

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
  };

  const handleResolveSos = () => {
    setSosEvent(null);
    localStorage.removeItem('amiko_sos_event');
    if (session && session.role) {
      router.push(`/${session.role}`);
    } else {
      router.push('/');
    }
  };

  if (!session) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-bold text-slate-500">Checking credentials...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-[19px]">
      <div className="w-full max-w-md h-[740px] bg-red-50 border border-red-200 rounded-[36px] overflow-hidden shadow-2xl flex flex-col justify-between p-6 text-center animate-fade-in">
        
        {/* Header */}
        <div className="p-4 flex items-center justify-between shrink-0">
          <button 
            onClick={() => router.push(`/${session.role}`)} 
            className="h-12 w-12 border rounded-full flex items-center justify-center text-slate-600 bg-white"
          >
            <Check className="h-6 w-6 rotate-45" />
          </button>
          <span className="text-xs font-black text-red-600 uppercase tracking-widest">Amiko Emergency Desk</span>
          <div className="w-12"></div>
        </div>

        {/* SOS Hold Trigger */}
        {!sosEvent ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-black text-red-800 leading-tight">Safety Emergency Alert</h2>
            <p className="text-sm text-red-600 font-semibold max-w-[280px] mt-3 leading-relaxed">
              Press and hold the button below for 3 seconds. It will instantly alert your guardian and our 24/7 care team.
            </p>

            <button 
              onMouseDown={startSosHold}
              onMouseUp={endSosHold}
              onTouchStart={startSosHold}
              onTouchEnd={endSosHold}
              className="mt-12 h-48 w-48 rounded-full bg-gradient-to-br from-red-600 to-rose-700 text-white font-black text-2xl flex flex-col items-center justify-center gap-1 shadow-lg active:scale-95 transition-all select-none sos-pulse"
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
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center bg-red-700 text-white p-5 rounded-3xl animate-fade-in">
            <div className="h-24 w-24 bg-white/20 rounded-full flex items-center justify-center text-white mb-6 sos-pulse">
              <ShieldAlert className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black tracking-wide">HELP REQUESTED</h1>
            <p className="text-sm font-extrabold opacity-95 max-w-xs mt-3 leading-relaxed">
              Your location is shared. Sarah Wilson and our care coordinator are notified.
            </p>
            
            <div className="w-full bg-white/10 p-5 rounded-3xl border border-white/15 text-xs text-left space-y-3 mt-8 font-semibold">
              <p className="font-extrabold uppercase tracking-wider text-[10px]">Response pipeline</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Location Shared</p>
              <p className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400" /> Family Alerted</p>
            </div>
          </div>
        )}

        {/* SOS Actions */}
        <div className="space-y-3 shrink-0">
          {sosEvent && (
            <button 
              onClick={handleResolveSos}
              className="w-full bg-white text-red-700 font-black h-16 rounded-2xl shadow-md text-sm hover:bg-slate-100 transition-colors"
            >
              I am safe now (Close SOS)
            </button>
          )}
          <a href="tel:108" className="block w-full border-2 border-white/40 bg-white hover:bg-slate-50 text-red-700 font-bold h-14 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors">
            <Phone className="h-4 w-4" /> Call 108 Directly
          </a>
        </div>

      </div>
    </div>
  );
}
