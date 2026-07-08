'use client';

import React, { useState } from 'react';
import { 
  CreditCard, Wallet, Heart, Calendar, Clock, AlertTriangle, CheckCircle, ArrowRightLeft, ShieldAlert 
} from 'lucide-react';

const COUPON_PACKS = [
  { count: 5, label: 'Starter', price: 250, badge: null },
  { count: 10, label: 'Standard', price: 500, badge: 'Popular' },
  { count: 20, label: 'Value', price: 950, badge: 'Save 5%' },
  { count: 50, label: 'Family', price: 2250, badge: 'Save 10%' }
];

export default function GuardianDashboard({
  profile,
  walletBalance,
  setWalletBalance,
  transactions,
  setTransactions,
  bookings,
  sosEvent
}) {
  const [selectedPack, setSelectedPack] = useState(COUPON_PACKS[1]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [checkoutStep, setCheckoutStep] = useState('pack'); // pack, credit_card, processing, success
  const [paymentOrderId, setPaymentOrderId] = useState('');
  const [cardFlip, setCardFlip] = useState(false);

  // Card input states
  const [cardNumber, setCardNumber] = useState('4532 7182 9901 2453');
  const [cardName, setCardName] = useState('SARAH WILSON');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('•••');

  const handleCardPayment = () => {
    setCheckoutStep('processing');
    const mockOrderId = `pay_ord_${Math.floor(100000 + Math.random() * 900000)}`;
    setPaymentOrderId(mockOrderId);

    setTimeout(() => {
      const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setWalletBalance(prev => prev + selectedPack.count);
      
      setTransactions(prev => [{
        id: crypto.randomUUID(),
        booking_id: null,
        amount: selectedPack.count,
        transaction_type: 'purchase',
        invoice_number: invoiceNum,
        reference_id: mockOrderId,
        notes: `Purchased Pack: ${selectedPack.count} Coupons`,
        created_at: new Date().toISOString()
      }, ...prev]);

      setCheckoutStep('success');
    }, 2500);
  };

  const initiatePayment = () => {
    if (paymentMethod === 'card') {
      setCheckoutStep('credit_card');
    } else {
      setCheckoutStep('processing');
      const mockOrderId = `pay_ord_${Math.floor(100000 + Math.random() * 900000)}`;
      setPaymentOrderId(mockOrderId);

      setTimeout(() => {
        const invoiceNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setWalletBalance(prev => prev + selectedPack.count);
        
        setTransactions(prev => [{
          id: crypto.randomUUID(),
          booking_id: null,
          amount: selectedPack.count,
          transaction_type: 'purchase',
          invoice_number: invoiceNum,
          reference_id: mockOrderId,
          notes: `Purchased Pack: ${selectedPack.count} Coupons`,
          created_at: new Date().toISOString()
        }, ...prev]);

        setCheckoutStep('success');
      }, 2000);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto screen-scroll space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Guardian Portal</span>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Sarah Wilson</h1>
        </div>
        <div className="h-12 px-5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl flex items-center gap-2 shadow-sm shadow-orange-500/10">
          <Wallet className="h-5 w-5" />
          <span className="text-sm font-black">{walletBalance} Coupons Available</span>
        </div>
      </div>

      {/* 2. Critical SOS Notification Alert */}
      {sosEvent && (
        <div className="bg-red-600 text-white p-5 rounded-3xl animate-bounce flex items-center justify-between shadow-lg shadow-red-600/10 border border-red-500/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center"><ShieldAlert className="h-6 w-6" /></div>
            <div>
              <p className="font-extrabold text-sm">Margaret triggered SOS Alert!</p>
              <p className="text-xs opacity-90">Live GPS tracking active on Admin safety console.</p>
            </div>
          </div>
          <button onClick={() => alert('Dispatching emergency support team...')} className="bg-white text-red-700 text-xs font-black px-4.5 py-2.5 rounded-xl uppercase shadow-sm">Call Support</button>
        </div>
      )}

      {/* 3. Link Status Profile */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl text-white font-black text-xl flex items-center justify-center shadow-sm">M</div>
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400">Caring For</p>
            <p className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight mt-0.5">
              {profile ? `${profile.full_name} (${profile.age})` : 'Margaret Wilson (74)'}
            </p>
            <p className="text-xs text-slate-400 mt-1"> Bengaluru · 560001</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl uppercase">Linked</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 4. Buy Coupons pack Panel */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-orange-500" /> Buy Care Coupons
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">1 coupon = ₹50. Purchase packs to credit wallet.</p>

            {checkoutStep === 'pack' && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {COUPON_PACKS.map(pack => (
                    <button
                      key={pack.count}
                      onClick={() => setSelectedPack(pack)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all relative active:scale-95 ${selectedPack.count === pack.count ? 'border-orange-500 bg-orange-50/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                    >
                      {pack.badge && (
                        <span className="absolute -top-2 right-2 text-[8px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">{pack.badge}</span>
                      )}
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{pack.label}</p>
                      <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{pack.count} CP</p>
                      <p className="text-xs font-extrabold text-slate-500 mt-1">₹{pack.price}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block">Payment Method</label>
                  <select 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full h-12 px-3 border dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none font-semibold text-xs text-slate-700 dark:text-slate-300"
                  >
                    <option value="upi">UPI (GPay / PhonePe)</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                </div>

                <button 
                  onClick={initiatePayment}
                  className="w-full btn-primary h-13 rounded-xl text-sm font-bold mt-4 shadow-sm flex items-center justify-center"
                >
                  Pay ₹{selectedPack.price} to Buy Pack
                </button>
              </div>
            )}

            {/* Credit Card Simulation Overlay with 3D Flip */}
            {checkoutStep === 'credit_card' && (
              <div className="mt-5 space-y-5 animate-fade-in">
                {/* 3D Flip Card representation */}
                <div 
                  onClick={() => setCardFlip(!cardFlip)}
                  className="perspective-container cursor-pointer w-full h-44"
                >
                  <div className={`relative w-full h-full rounded-2xl transition-all duration-700 transform-style preserve-3d ${cardFlip ? 'rotate-y-180' : ''}`} style={{ transform: cardFlip ? 'rotateY(180deg)' : 'none' }}>
                    
                    {/* Front side */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-5 rounded-2xl flex flex-col justify-between backface-hidden z-20">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black tracking-widest opacity-80">AMIKO SECURE CARD</span>
                        <div className="h-6 w-9 bg-white/20 rounded-md"></div>
                      </div>
                      <p className="text-lg font-bold tracking-widest font-mono">{cardNumber}</p>
                      <div className="flex justify-between items-end text-[10px]">
                        <div>
                          <p className="opacity-60">CARDHOLDER</p>
                          <p className="font-bold text-xs">{cardName}</p>
                        </div>
                        <div>
                          <p className="opacity-60">EXPIRES</p>
                          <p className="font-bold text-xs">{cardExpiry}</p>
                        </div>
                      </div>
                    </div>

                    {/* Back side */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white rounded-2xl flex flex-col justify-between backface-hidden py-5" style={{ transform: 'rotateY(180deg)' }}>
                      <div className="w-full h-10 bg-black"></div>
                      <div className="px-5 flex justify-between items-center text-xs">
                        <span className="opacity-60">AUTHORIZED SIGNATURE</span>
                        <span className="bg-white text-slate-800 px-3 py-1 font-bold rounded font-mono">{cardCvv}</span>
                      </div>
                      <p className="text-[8px] opacity-40 px-5 leading-none">Security check active. Valid signature only.</p>
                    </div>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Card Number</label>
                    <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} onFocus={() => setCardFlip(false)} className="w-full h-11 px-3 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Card Holder Name</label>
                    <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} onFocus={() => setCardFlip(false)} className="w-full h-11 px-3 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Expiry Date</label>
                    <input value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} onFocus={() => setCardFlip(false)} className="w-full h-11 px-3 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">CVV</label>
                    <input value={cardCvv} onChange={e => setCardCvv(e.target.value)} onFocus={() => setCardFlip(true)} className="w-full h-11 px-3 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 outline-none" />
                  </div>
                </div>

                <button 
                  onClick={handleCardPayment}
                  className="w-full btn-primary h-12 rounded-xl text-xs font-bold"
                >
                  Pay ₹{selectedPack.price} &amp; Credit Wallet
                </button>
              </div>
            )}

            {checkoutStep === 'processing' && (
              <div className="py-14 text-center space-y-4">
                <div className="h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Connecting Razorpay Gateway...</p>
                  <p className="text-xs text-slate-400 mt-1">Verifying signatures and checking transaction idempotency.</p>
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="py-10 text-center space-y-4 animate-fade-in">
                <div className="h-14 w-14 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-9 w-9" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Wallet Credited Successfully</h3>
                  <p className="text-xs text-slate-500 mt-1">Added +{selectedPack.count} Coupons to Margaret's Wallet.</p>
                  <p className="text-[9px] text-slate-400 mt-1">Order Ref: {paymentOrderId}</p>
                </div>
                <button 
                  onClick={() => setCheckoutStep('pack')}
                  className="px-5 h-10 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Buy More Packs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. Transaction History Ledger */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between max-h-[380px]">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-orange-500" /> Transaction Ledger
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">Real operational billing tracks of coupon ledger.</p>
            
            <div className="mt-5 space-y-2.5 overflow-y-auto max-h-[235px] screen-scroll pr-1">
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10">No transactions recorded.</p>
              ) : (
                transactions.map(tx => (
                  <div key={tx.id} className="p-3.5 border dark:border-slate-800 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 transition-all bg-slate-50/30">
                    <div>
                      <p className="font-extrabold text-slate-800 dark:text-slate-100">{tx.notes}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {tx.invoice_number ? `Invoice: ${tx.invoice_number}` : `Order: ${tx.reference_id || 'Ref ID'}`}
                      </p>
                    </div>
                    <span className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} CP
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 6. Active Bookings */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm">
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-orange-500" /> Elder Booking Schedule
        </h2>
        
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10">No bookings scheduled.</p>
          ) : (
            bookings.map(bk => (
              <div key={bk.id} className="p-4 border dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
                <div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{bk.service_label}</h4>
                  <div className="flex gap-4 mt-2 text-xs text-slate-400 font-semibold">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {bk.scheduled_date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {bk.scheduled_time_slot}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${bk.status === 'service_completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>
                    {bk.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300">{bk.cost} coupons</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
