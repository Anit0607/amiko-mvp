import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Supabase Initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })
  : null;

// 2. Local JSON DB Fallback (for local testing/building if env keys are not provided)
const DB_FILE = path.join(process.cwd(), 'tmp', 'db.json');

function ensureDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      elders: [],
      guardians: [],
      bookings: [],
      transactions: [],
      wallets: {},
      sos_events: [],
      earnings: [],
      payment_orders: []
    }, null, 2));
  }
}

function readLocalDb() {
  ensureDbFile();
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeLocalDb(data) {
  ensureDbFile();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// 3. Consolidated Router Handler
export async function GET(request, { params }) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean); // e.g., ["api", "services"] or ["api", "wallet"]
  const endpoint = pathParts.slice(1).join('/'); // e.g., "services" or "wallet"

  try {
    // GET /api/services
    if (endpoint === 'services') {
      if (supabase) {
        const { data, error } = await supabase.from('services').select('*');
        if (!error && data && data.length > 0) {
          return NextResponse.json({ services: data });
        }
      }
      // Static catalog fallback
      return NextResponse.json({
        services: [
          { label: 'BP Check', category_id: 'health', coupon_cost: 2 },
          { label: 'Blood Sugar Check', category_id: 'health', coupon_cost: 2 },
          { label: 'Lab Test Assistance', category_id: 'health', coupon_cost: 4 },
          { label: 'Physiotherapy', category_id: 'health', coupon_cost: 5 },
          { label: 'Medication Reminder', category_id: 'health', coupon_cost: 1 },
          { label: 'Pharmacy Visit', category_id: 'travel', coupon_cost: 3 },
          { label: 'Temple Visit', category_id: 'travel', coupon_cost: 4 },
          { label: 'Hospital Visit', category_id: 'travel', coupon_cost: 6 },
          { label: 'Bank Visit', category_id: 'travel', coupon_cost: 6 },
          { label: 'Government Office Visit', category_id: 'travel', coupon_cost: 6 },
          { label: 'Utility Bill Assistance', category_id: 'shopping', coupon_cost: 2 },
          { label: 'Grocery Shopping', category_id: 'shopping', coupon_cost: 3 },
          { label: 'Medicine Pickup', category_id: 'shopping', coupon_cost: 3 },
          { label: 'Document Submission', category_id: 'shopping', coupon_cost: 3 },
          { label: 'Electrician / Plumber / Carpenter', category_id: 'homeSupport', coupon_cost: 5 },
          { label: 'Appliance Repair', category_id: 'homeSupport', coupon_cost: 6 },
          { label: 'Emergency Home Maintenance', category_id: 'homeSupport', coupon_cost: 8 },
          { label: 'Emergency Home Visit', category_id: 'emergency', coupon_cost: 4 }
        ]
      });
    }

    // GET /api/wallet?phone=...
    if (endpoint === 'wallet') {
      const phone = url.searchParams.get('phone');
      if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

      if (supabase) {
        // Query real database
        const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (user) {
          const { data: wallet } = await supabase.from('coupon_wallets').select('balance').eq('id', user.id).single();
          const { data: txs } = await supabase.from('coupon_transactions').select('*').eq('wallet_id', user.id).order('created_at', { ascending: false });
          return NextResponse.json({
            balance: wallet ? wallet.balance : 0,
            transactions: txs || []
          });
        }
      }

      // Fallback
      const db = readLocalDb();
      const balance = db.wallets[phone] || 0;
      const txs = db.transactions.filter(t => t.phone === phone);
      return NextResponse.json({ balance, transactions: txs });
    }

    // GET /api/bookings?phone=...
    if (endpoint === 'bookings') {
      const phone = url.searchParams.get('phone');
      
      if (supabase) {
        let query = supabase.from('bookings').select(`
          id, scheduled_date, scheduled_time_slot, address, status, completion_otp, cost,
          services ( label, category_id ),
          care_buddies ( full_name, rating )
        `);
        
        if (phone) {
          const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
          if (user) {
            query = query.eq('elder_id', user.id);
          }
        }
        
        const { data: bks, error } = await query.order('created_at', { ascending: false });
        if (!error && bks) {
          // Format output to match standard JSON structures
          const formatted = bks.map(b => ({
            id: b.id,
            service_label: b.services?.label || 'BP Check',
            category_id: b.services?.category_id || 'health',
            scheduled_date: b.scheduled_date,
            scheduled_time_slot: b.scheduled_time_slot,
            address: b.address,
            status: b.status,
            otp: b.completion_otp,
            cost: b.cost,
            buddy: b.care_buddies ? { name: b.care_buddies.full_name, rating: b.care_buddies.rating } : null
          }));
          return NextResponse.json({ bookings: formatted });
        }
      }

      // Fallback
      const db = readLocalDb();
      const bks = phone ? db.bookings.filter(b => b.phone === phone) : db.bookings;
      return NextResponse.json({ bookings: bks });
    }

    // GET /api/sos
    if (endpoint === 'sos') {
      if (supabase) {
        const { data: sos, error } = await supabase.from('sos_events').select('*').eq('status', 'active');
        if (!error && sos) {
          return NextResponse.json({ sos_events: sos });
        }
      }

      // Fallback
      const db = readLocalDb();
      return NextResponse.json({ sos_events: db.sos_events });
    }

    return NextResponse.json({ error: `Not Found: GET /api/${endpoint}` }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const endpoint = pathParts.slice(1).join('/'); // e.g., "auth/otp/send"
  
  try {
    const body = await request.json().catch(() => ({}));

    // POST /api/auth/otp/send
    if (endpoint === 'auth/otp/send') {
      const { phone, role } = body;
      if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

      if (supabase) {
        const { data: user, error } = await supabase.from('users').upsert({ phone, role }, { onConflict: 'phone' }).select().single();
        if (!error && user) {
          return NextResponse.json({ success: true, user_id: user.id });
        }
      }

      // Fallback
      const db = readLocalDb();
      if (!db.users.some(u => u.phone === phone)) {
        db.users.push({ id: crypto.randomUUID(), phone, role });
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // POST /api/auth/otp/verify
    if (endpoint === 'auth/otp/verify') {
      const { phone, otp } = body;
      if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

      if (supabase) {
        const { data: user } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (user) {
          return NextResponse.json({ session: { user } });
        }
      }

      // Fallback
      const db = readLocalDb();
      const user = db.users.find(u => u.phone === phone) || { id: 'mock-user-id', phone, role: 'elder' };
      return NextResponse.json({ session: { user } });
    }

    // POST /api/elders/register
    if (endpoint === 'elders/register') {
      const { phone, name, age, address, city_locality, medical_conditions, guardian_phone } = body;
      
      if (supabase) {
        const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (user) {
          await supabase.from('elders').upsert({
            id: user.id,
            full_name: name,
            age: parseInt(age),
            address,
            city_locality,
            medical_conditions,
            is_approved: false
          });
          return NextResponse.json({ success: true });
        }
      }

      // Fallback
      const db = readLocalDb();
      const existing = db.elders.find(e => e.phone === phone);
      if (existing) {
        Object.assign(existing, { name, age, address, city_locality, medical_conditions, status: 'pending' });
      } else {
        db.elders.push({ phone, name, age, address, city_locality, medical_conditions, status: 'pending' });
      }
      writeLocalDb(db);
      return NextResponse.json({ success: true });
    }

    // POST /api/guardians/link
    if (endpoint === 'guardians/link') {
      const { phone, guardian_name, elder_phone } = body;

      if (supabase) {
        const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (user) {
          await supabase.from('guardians').upsert({
            id: user.id,
            full_name: guardian_name,
            email: `${phone}@amiko.com`,
            phone
          });
          // Match with elder if exists
          const { data: elderUser } = await supabase.from('users').select('id').eq('phone', elder_phone).single();
          if (elderUser) {
            await supabase.from('elder_guardian_links').upsert({
              elder_id: elderUser.id,
              guardian_id: user.id,
              relationship: 'Family Member',
              is_confirmed: true
            });
            // Initialize wallet
            await supabase.from('coupon_wallets').upsert({ id: user.id, balance: 18 });
          }
          return NextResponse.json({ success: true });
        }
      }

      // Fallback
      const db = readLocalDb();
      db.guardians.push({ phone, guardian_name, elder_phone });
      db.wallets[phone] = 18; // default start coupons
      db.transactions.push({
        id: crypto.randomUUID(),
        phone,
        amount: 18,
        notes: 'Initial Coupon Package Refill',
        created_at: new Date().toISOString()
      });
      writeLocalDb(db);
      return NextResponse.json({ success: true });
    }

    // POST /api/admin/approve-elder
    if (endpoint === 'admin/approve-elder') {
      const { elder_phone } = body;

      if (supabase) {
        const { data: elderUser } = await supabase.from('users').select('id').eq('phone', elder_phone).single();
        if (elderUser) {
          await supabase.from('elders').update({ is_approved: true }).eq('id', elderUser.id);
          return NextResponse.json({ success: true });
        }
      }

      // Fallback
      const db = readLocalDb();
      const elder = db.elders.find(e => e.phone === elder_phone);
      if (elder) elder.status = 'active';
      writeLocalDb(db);
      return NextResponse.json({ success: true });
    }

    // POST /api/payments/create-order
    if (endpoint === 'payments/create-order') {
      const { amount, phone } = body;
      const orderId = `pay_ord_${Math.floor(100000 + Math.random() * 900000)}`;
      return NextResponse.json({ order_id: orderId, amount });
    }

    // POST /api/payments/webhook
    if (endpoint === 'payments/webhook') {
      const { order_id, coupons, phone } = body;

      if (supabase) {
        // Enforce Idempotency check:
        const { data: exists } = await supabase.from('coupon_transactions').select('id').eq('reference_id', order_id).single();
        if (exists) {
          return NextResponse.json({ error: 'Order already credited (Idempotent trigger)' }, { status: 409 });
        }
        
        // Find user
        const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (user) {
          // Increment wallet
          const { data: wallet } = await supabase.from('coupon_wallets').select('balance').eq('id', user.id).single();
          const newBal = (wallet ? wallet.balance : 0) + parseInt(coupons);
          await supabase.from('coupon_wallets').upsert({ id: user.id, balance: newBal });

          // Log transaction
          await supabase.from('coupon_transactions').insert({
            wallet_id: user.id,
            amount: parseInt(coupons),
            transaction_type: 'purchase',
            invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            reference_id: order_id,
            notes: `Bought pack: ${coupons} Coupons`
          });
          return NextResponse.json({ success: true });
        }
      }

      // Fallback
      const db = readLocalDb();
      if (db.payment_orders.includes(order_id)) {
        return NextResponse.json({ error: 'Duplicate webhook trigger (Idempotence Guard)' }, { status: 409 });
      }
      db.payment_orders.push(order_id);
      db.wallets[phone] = (db.wallets[phone] || 0) + parseInt(coupons);
      db.transactions.push({
        id: crypto.randomUUID(),
        phone,
        amount: parseInt(coupons),
        invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        reference_id: order_id,
        notes: `Bought pack: ${coupons} Coupons`,
        created_at: new Date().toISOString()
      });
      writeLocalDb(db);
      return NextResponse.json({ success: true });
    }

    // POST /api/bookings
    if (endpoint === 'bookings') {
      const { service_label, date, slot, cost, phone } = body;

      if (supabase) {
        const { data: user } = await supabase.from('users').select('id').eq('phone', phone).single();
        if (user) {
          // Check balance
          const { data: wallet } = await supabase.from('coupon_wallets').select('balance').eq('id', user.id).single();
          const balance = wallet ? wallet.balance : 0;
          if (balance < cost) {
            return NextResponse.json({ error: 'Insufficient wallet coupons' }, { status: 400 });
          }

          // Deduct coupons
          await supabase.from('coupon_wallets').upsert({ id: user.id, balance: balance - cost });

          // Find service ID
          const { data: service } = await supabase.from('services').select('id').eq('label', service_label).single();
          if (service) {
            const { data: booking } = await supabase.from('bookings').insert({
              elder_id: user.id,
              service_id: service.id,
              scheduled_date: new Date().toISOString().split('T')[0], // yyyy-mm-dd format
              scheduled_time_slot: slot,
              address: '42 Rose Garden, MG Road',
              status: 'requested',
              completion_otp: Math.floor(1000 + Math.random() * 9000).toString()
            }).select().single();

            // Log Transaction
            await supabase.from('coupon_transactions').insert({
              wallet_id: user.id,
              booking_id: booking.id,
              amount: -cost,
              transaction_type: 'booking_debit',
              notes: `Care Visit: ${service_label}`
            });
            return NextResponse.json({ success: true, booking });
          }
        }
      }

      // Fallback
      const db = readLocalDb();
      const bal = db.wallets[phone] || 0;
      if (bal < cost) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });

      db.wallets[phone] = bal - cost;
      const newBk = {
        id: crypto.randomUUID(),
        service_label,
        scheduled_date: date,
        scheduled_time_slot: slot,
        status: 'requested',
        cost,
        otp: Math.floor(1000 + Math.random() * 9000).toString(),
        phone,
        created_at: new Date().toISOString()
      };
      db.bookings.push(newBk);
      db.transactions.push({
        id: crypto.randomUUID(),
        phone,
        booking_id: newBk.id,
        amount: -cost,
        transaction_type: 'booking_debit',
        notes: `Care Visit: ${service_label}`,
        created_at: new Date().toISOString()
      });
      writeLocalDb(db);
      return NextResponse.json({ success: true, booking: newBk });
    }

    // POST /api/bookings/:id/assign
    if (endpoint.startsWith('bookings/') && endpoint.endsWith('/assign')) {
      const bookingId = endpoint.split('/')[1];
      const { buddy_name } = body;

      // Fallback & DB update
      const db = readLocalDb();
      const bk = db.bookings.find(b => b.id === bookingId);
      if (bk) {
        bk.status = 'buddy_assigned';
        bk.buddy = { name: buddy_name, rating: '4.9' };
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // POST /api/buddy/jobs/:id/start
    if (endpoint.startsWith('buddy/jobs/') && endpoint.endsWith('/start')) {
      const jobId = endpoint.split('/')[2];

      const db = readLocalDb();
      const bk = db.bookings.find(b => b.id === jobId);
      if (bk) {
        bk.status = 'buddy_en_route';
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // POST /api/buddy/jobs/:id/complete
    if (endpoint.startsWith('buddy/jobs/') && endpoint.endsWith('/complete')) {
      const jobId = endpoint.split('/')[2];
      const { otp } = body;

      const db = readLocalDb();
      const bk = db.bookings.find(b => b.id === jobId);
      if (bk) {
        if (bk.otp !== otp) {
          return NextResponse.json({ error: 'Incorrect OTP' }, { status: 400 });
        }
        bk.status = 'service_completed';
        
        // Payout settlement calculations
        const payout = bk.cost * 40;
        db.earnings.push({
          id: crypto.randomUUID(),
          booking_id: jobId,
          amount: payout,
          is_settled: false,
          created_at: new Date().toISOString()
        });
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // POST /api/sos/trigger
    if (endpoint === 'sos/trigger') {
      const { phone } = body;
      const newSos = {
        id: crypto.randomUUID(),
        phone,
        status: 'active',
        created_at: new Date().toISOString()
      };
      
      const db = readLocalDb();
      db.sos_events.push(newSos);
      writeLocalDb(db);
      return NextResponse.json({ success: true, sos: newSos });
    }

    // POST /api/sos/:id/acknowledge
    if (endpoint.startsWith('sos/') && endpoint.endsWith('/acknowledge')) {
      const sosId = endpoint.split('/')[1];

      const db = readLocalDb();
      const sos = db.sos_events.find(s => s.id === sosId);
      if (sos) {
        sos.status = 'acknowledged';
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    // POST /api/sos/:id/resolve
    if (endpoint.startsWith('sos/') && endpoint.endsWith('/resolve')) {
      const sosId = endpoint.split('/')[1];

      const db = readLocalDb();
      const index = db.sos_events.findIndex(s => s.id === sosId);
      if (index !== -1) {
        db.sos_events.splice(index, 1);
        writeLocalDb(db);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Not Found: POST /api/${endpoint}` }, { status: 404 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
