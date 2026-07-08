'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, Calendar, ShieldAlert, Award, FileText, ClipboardList, RefreshCw, 
  MapPin, Check, Plus, AlertCircle, Trash2
} from 'lucide-react';

const MOCK_CARE_BUDDIES = [
  { id: 'buddy-ravi', name: 'Ravi Kumar', rating: '4.9', skills: ['BP Check', 'Grocery Shopping', 'Physiotherapy'], locations: ['Bengaluru'] },
  { id: 'buddy-anand', name: 'Anand Sen', rating: '4.8', skills: ['Hospital Visit', 'Medicine Pickup'], locations: ['Bengaluru'] },
  { id: 'buddy-priya', name: 'Priya Sharma', rating: '4.9', skills: ['Blood Sugar Check', 'BP Check', 'Medication Reminder'], locations: ['Bengaluru'] }
];

export default function AdminConsole({
  profile,
  isApproved,
  setIsApproved,
  bookings,
  setBookings,
  sosEvent,
  setSosEvent,
  walletBalance,
  setWalletBalance,
  setTransactions
}) {
  const [activeTab, setActiveTab] = useState('approvals'); // approvals, assignments, sos, ledger
  const [selectedBuddyId, setSelectedBuddyId] = useState(MOCK_CARE_BUDDIES[0].id);
  const [sosTimer, setSosTimer] = useState(0);

  // Assisted booking inputs
  const [assistedSvc, setAssistedSvc] = useState('BP Check');
  const [assistedDate, setAssistedDate] = useState('Tomorrow');
  const [assistedSlot, setAssistedSlot] = useState('Morning (8–11)');

  useEffect(() => {
    let timer = null;
    if (sosEvent && sosEvent.status === 'active') {
      timer = setInterval(() => {
        setSosTimer(prev => prev + 1);
      }, 1000);
    } else {
      setSosTimer(0);
    }
    return () => clearInterval(timer);
  }, [sosEvent]);

  const handleApproveProfile = () => {
    setIsApproved(true);
    alert('Elder profile verified and approved. Guardian link invite dispatched.');
  };

  const handleAssignBuddy = (bookingId) => {
    const assignedBuddy = MOCK_CARE_BUDDIES.find(b => b.id === selectedBuddyId);
    
    setBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        return { 
          ...bk, 
          status: 'buddy_assigned', 
          buddy: { 
            name: assignedBuddy.name, 
            rating: assignedBuddy.rating 
          } 
        };
      }
      return bk;
    }));

    alert(`Care Buddy "${assignedBuddy.name}" assigned to booking.`);
  };

  const handleAcknowledgeSos = () => {
    setSosEvent(prev => ({ 
      ...prev, 
      status: 'acknowledged', 
      acknowledged_by: 'admin-id',
      acknowledged_at: new Date().toISOString()
    }));
  };

  const handleResolveSos = () => {
    setSosEvent(null);
  };

  const handleAssistedBooking = (e) => {
    e.preventDefault();
    const costs = { 'BP Check': 2, 'Physiotherapy': 5, 'Hospital Visit': 6 };
    const cost = costs[assistedSvc] || 3;

    if (walletBalance < cost) {
      alert(`Cannot book. Insufficient coupon wallet balance (${walletBalance} CP). Request Guardian to buy packs.`);
      return;
    }

    const newBooking = {
      id: crypto.randomUUID(),
      service_label: assistedSvc,
      category_id: 'health',
      scheduled_date: assistedDate,
      scheduled_time_slot: assistedSlot,
      address: profile ? profile.address : '42 Rose Garden',
      status: 'requested',
      cost,
      created_at: new Date().toISOString(),
      buddy: null,
      otp: Math.floor(1000 + Math.random() * 9000).toString()
    };

    setBookings([newBooking, ...bookings]);
    setWalletBalance(walletBalance - cost);
    
    setTransactions(prev => [{
      id: crypto.randomUUID(),
      booking_id: newBooking.id,
      amount: -cost,
      transaction_type: 'booking_debit',
      notes: `Admin Assisted Booking: ${assistedSvc}`,
      created_at: new Date().toISOString()
    }, ...prev]);

    alert(`Admin-assisted booking created successfully. Deducted ${cost} CP.`);
  };

  const pendingAssignments = bookings.filter(b => b.status === 'requested');

  return (
    <div className="flex-grow bg-[#0b0f19] text-slate-100 flex flex-col overflow-hidden h-full">
      
      {/* 1. Header Navigation (Dark Premium) */}
      <div className="bg-[#0f172a] border-b border-slate-800/80 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">Operational Control Panel</span>
          <h1 className="text-base font-black mt-0.5 tracking-tight text-white">Amiko Safety Operations Console</h1>
        </div>
        
        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-xs overflow-x-auto">
          {[
            { id: 'approvals', label: 'Elders Queue', icon: UserCheck },
            { id: 'assignments', label: 'Assign Desk', icon: Calendar },
            { id: 'sos', label: 'Safety SOS Desk', icon: ShieldAlert },
            { id: 'ledger', label: 'Ops Ledger', icon: ClipboardList }
          ].map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4.5 py-2.5 rounded-lg font-black flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Icon className="h-4.5 w-4.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main content viewport */}
      <div className="flex-1 p-6 overflow-y-auto screen-scroll bg-[#0b0f19]">
        
        {/* Tab A: Elder Approvals */}
        {activeTab === 'approvals' && (
          <div className="max-w-2xl space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-white leading-none">Elder Approvals Queue</h2>
              <p className="text-xs text-slate-500 mt-1">Review background details and link invitations.</p>
            </div>

            {profile ? (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="font-extrabold text-base text-white leading-tight">{profile.full_name} ({profile.age})</h3>
                    <p className="text-xs text-slate-500 mt-1 font-mono">{profile.phone}</p>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${isApproved ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-amber-950/40 text-amber-400 border border-amber-800/40'}`}>
                    {isApproved ? 'Approved' : 'Pending Review'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-300">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Address</p>
                    <p className="font-medium mt-0.5">{profile.address}, {profile.city_locality}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Medical Conditions</p>
                    <p className="font-medium mt-0.5">{profile.medical_conditions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Guardian Link</p>
                    <p className="font-medium mt-0.5">{profile.guardian_name} ({profile.guardian_relationship})</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Guardian Email</p>
                    <p className="font-medium mt-0.5">{profile.guardian_email}</p>
                  </div>
                </div>

                {!isApproved && (
                  <button 
                    onClick={handleApproveProfile}
                    className="w-full btn-primary h-12 rounded-xl text-xs font-bold mt-2"
                  >
                    Confirm BGV &amp; Approve Elder Profile
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-12 text-center bg-slate-900/40 border border-slate-800 border-dashed rounded-3xl">No new elder registrations found.</p>
            )}
          </div>
        )}

        {/* Tab B: Care Buddy Assignments */}
        {activeTab === 'assignments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            
            {/* Direct Buddy Assignment */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-white leading-none">Buddy Assigning Desk</h2>
                <p className="text-xs text-slate-500 mt-1">Assign verified buddies to pending bookings.</p>
              </div>

              <div className="space-y-3">
                {pendingAssignments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">No bookings pending assignment.</p>
                ) : (
                  pendingAssignments.map(bk => (
                    <div key={bk.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-sm text-white">{bk.service_label}</h4>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">Date: {bk.scheduled_date} ({bk.scheduled_time_slot})</p>
                        </div>
                        <span className="text-[9px] font-black uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">{bk.cost} CP</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 block">Select Care Buddy</label>
                        <select 
                          value={selectedBuddyId} 
                          onChange={e => setSelectedBuddyId(e.target.value)}
                          className="w-full h-11 px-3 border border-slate-800 rounded-xl bg-[#0b0f19] outline-none text-xs font-semibold text-slate-300"
                        >
                          {MOCK_CARE_BUDDIES.map(b => (
                            <option key={b.id} value={b.id}>{b.name} (★{b.rating})</option>
                          ))}
                        </select>
                      </div>

                      <button 
                        onClick={() => handleAssignBuddy(bk.id)}
                        className="w-full btn-primary h-11 rounded-xl text-xs font-bold"
                      >
                        Assign Buddy
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Admin-Assisted Booking flow */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl h-fit space-y-4">
              <div>
                <h2 className="text-lg font-black text-white leading-none">Create Assisted Booking</h2>
                <p className="text-xs text-slate-500 mt-1">Deduct coupons &amp; book on behalf of elder.</p>
              </div>

              <form onSubmit={handleAssistedBooking} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Service Type</label>
                  <select value={assistedSvc} onChange={e => setAssistedSvc(e.target.value)} className="w-full h-11 px-3 border border-slate-800 rounded-xl bg-[#0b0f19] outline-none text-xs text-slate-300 font-semibold">
                    <option>BP Check</option>
                    <option>Physiotherapy</option>
                    <option>Hospital Visit</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Date</label>
                    <input type="text" value={assistedDate} onChange={e => setAssistedDate(e.target.value)} className="w-full h-11 px-3 border border-slate-800 rounded-xl bg-[#0b0f19] outline-none font-semibold text-slate-300" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Slot</label>
                    <input type="text" value={assistedSlot} onChange={e => setAssistedSlot(e.target.value)} className="w-full h-11 px-3 border border-slate-800 rounded-xl bg-[#0b0f19] outline-none font-semibold text-slate-300" />
                  </div>
                </div>
                <button type="submit" className="w-full h-12 bg-white hover:bg-slate-100 text-[#0b0f19] font-black rounded-xl text-xs mt-3 shadow-sm transition-colors">
                  Create Assisted Booking
                </button>
              </form>
            </div>

          </div>
        )}

        {/* Tab C: SOS Emergency Desk (Pulsing Radar Map) */}
        {activeTab === 'sos' && (
          <div className="space-y-4 max-w-xl animate-fade-in">
            <div>
              <h2 className="text-lg font-black text-white leading-none">Safety SOS Emergency Desk</h2>
              <p className="text-xs text-slate-500 mt-1">Real-time GPS coordinate response desk.</p>
            </div>
            
            {sosEvent ? (
              <div className="bg-red-950/20 border-2 border-red-800 p-6 rounded-3xl space-y-4">
                
                {/* Pulsing Radar Interface */}
                <div className="relative w-full h-44 bg-[#0a060d] border border-red-900/60 rounded-2xl overflow-hidden flex items-center justify-center">
                  <span className="absolute h-36 w-36 rounded-full border border-red-700/20 animate-ping"></span>
                  <span className="absolute h-24 w-24 rounded-full border border-red-700/30 animate-pulse"></span>
                  <div className="relative z-20 flex flex-col items-center">
                    <MapPin className="h-8 w-8 text-red-500 animate-bounce" />
                    <span className="text-[9px] font-black tracking-widest text-red-500 bg-red-950/80 px-2 py-0.5 rounded-full uppercase mt-2">Margaret: Active SOS</span>
                  </div>
                  {/* Timer display */}
                  <div className="absolute top-3 right-3 bg-red-950/80 px-3 py-1.5 rounded-xl border border-red-900/40 text-[10px] font-black text-red-400">
                    SLA RESPONSE TIME: {sosTimer}s
                  </div>
                </div>

                <div className="flex justify-between items-start border-b border-red-900/40 pb-3">
                  <div>
                    <h3 className="font-black text-red-400 text-lg leading-tight">Margaret Wilson SOS</h3>
                    <p className="text-xs text-red-600 font-bold mt-1">Locality: Bengaluru - 12.9716° N, 77.5946° E</p>
                  </div>
                  <span className="text-[9px] font-black uppercase bg-red-600 text-white px-2.5 py-1 rounded-full animate-pulse">CRITICAL</span>
                </div>

                <div className="text-xs text-slate-300 grid grid-cols-2 gap-3">
                  <p><strong>Primary Guardian:</strong> Sarah Wilson (+91 98123 45678)</p>
                  <p><strong>Secondary Backup:</strong> Tom Wilson (Son)</p>
                  <p><strong>Ambulance:</strong> Bengaluru 108 Dispatcher Alerted</p>
                  <p><strong>Status:</strong> {sosEvent.status}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  {sosEvent.status === 'active' && (
                    <button 
                      onClick={handleAcknowledgeSos}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-extrabold h-12 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Acknowledge SOS Alert
                    </button>
                  )}
                  {sosEvent.status === 'acknowledged' && (
                    <button 
                      onClick={handleResolveSos}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-12 rounded-xl text-xs transition-colors shadow-sm"
                    >
                      Resolve Emergency (Mark Safe)
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-12 text-center bg-slate-900/40 border border-slate-800 rounded-3xl">No active SOS alerts. Security systems nominal.</p>
            )}
          </div>
        )}

        {/* Tab D: Payments Reconciliation Ledger */}
        {activeTab === 'ledger' && (
          <div className="space-y-4 max-w-xl animate-fade-in">
            <div>
              <h2 className="text-lg font-black text-white leading-none">Operational Ledger Audit</h2>
              <p className="text-xs text-slate-500 mt-1">Log book of manual coupon credits &amp; debits.</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="bg-amber-950/20 border border-amber-900/60 p-4 rounded-2xl flex items-start gap-2.5 text-xs text-amber-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="leading-relaxed">All manual coupon adjustments bypass standard checkout rules but strictly trigger audit ledger transactions.</p>
              </div>

              <div className="space-y-3 text-xs">
                <button 
                  onClick={() => {
                    setWalletBalance(prev => prev + 5);
                    setTransactions(prev => [{
                      id: crypto.randomUUID(),
                      booking_id: null,
                      amount: 5,
                      transaction_type: 'manual_adjustment',
                      notes: 'Manual Adjustment by Admin (Correction)',
                      created_at: new Date().toISOString()
                    }, ...prev]);
                    alert('Balance adjusted: +5 Coupons credited.');
                  }}
                  className="w-full h-11 bg-white hover:bg-slate-100 text-[#0b0f19] font-black rounded-xl"
                >
                  Adjust Balance (+5 CP)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
