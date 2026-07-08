-- Amiko Production PostgreSQL Schema (Supabase compatible)
-- Enable Row Level Security (RLS) on all exposed tables

-- 1. Core Users and Roles
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('elder', 'guardian', 'admin', 'care_buddy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.elders (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    age INTEGER NOT NULL,
    address TEXT NOT NULL,
    city_locality TEXT NOT NULL,
    medical_conditions TEXT,
    mobility_concerns TEXT,
    preferred_language TEXT DEFAULT 'English' NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    location_permission BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.care_buddies (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    photo_url TEXT,
    bgv_status TEXT DEFAULT 'pending' NOT NULL CHECK (bgv_status IN ('pending', 'approved', 'rejected')),
    bgv_documents TEXT[], -- array of file URLs
    skills_supported TEXT[],
    service_locations TEXT[], -- array of localities
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00),
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Links & Contacts
CREATE TABLE IF NOT EXISTS public.elder_guardian_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    one_time_code TEXT,
    is_confirmed BOOLEAN DEFAULT FALSE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(elder_id, guardian_id)
);

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    relationship TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Service Catalog & Bookings
CREATE TABLE IF NOT EXISTS public.service_categories (
    id TEXT PRIMARY KEY, -- e.g. 'health', 'travel', 'shopping', 'home_support', 'emergency'
    title TEXT NOT NULL,
    icon TEXT NOT NULL,
    tone TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT NOT NULL REFERENCES public.service_categories(id),
    label TEXT NOT NULL UNIQUE,
    coupon_cost INTEGER NOT NULL,
    description TEXT,
    operating_hours_start TIME DEFAULT '08:00:00' NOT NULL,
    operating_hours_end TIME DEFAULT '20:00:00' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID NOT NULL REFERENCES public.elders(id),
    service_id UUID NOT NULL REFERENCES public.services(id),
    scheduled_date DATE NOT NULL,
    scheduled_time_slot TEXT NOT NULL, -- e.g., 'Morning (8-11)', 'Noon (11-2)'
    address TEXT NOT NULL,
    status TEXT DEFAULT 'requested' NOT NULL CHECK (status IN (
        'draft', 'requested', 'validated', 'pending_admin', 'pending_buddy', 
        'buddy_assigned', 'buddy_en_route', 'service_started', 'service_completed', 
        'cancelled', 'failed', 'refunded'
    )),
    guardian_approved BOOLEAN DEFAULT FALSE NOT NULL,
    care_buddy_id UUID REFERENCES public.care_buddies(id),
    completion_otp TEXT,
    completion_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.booking_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Coupon Wallet & Payment Ledger
CREATE TABLE IF NOT EXISTS public.coupon_wallets (
    id UUID PRIMARY KEY REFERENCES public.guardians(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 NOT NULL CHECK (balance >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.coupon_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.coupon_wallets(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- positive for credits, negative for debits
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'booking_debit', 'refund_credit', 'manual_adjustment')),
    invoice_number TEXT UNIQUE,
    reference_id TEXT, -- payment gateway order/refund ID
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL REFERENCES public.guardians(id),
    amount_in_cents INTEGER NOT NULL,
    coupons_count INTEGER NOT NULL,
    gateway_order_id TEXT UNIQUE NOT NULL, -- Razorpay order id
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'captured', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SOS Emergency Log
CREATE TABLE IF NOT EXISTS public.sos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_id UUID NOT NULL REFERENCES public.elders(id) ON DELETE CASCADE,
    gps_lat NUMERIC(9,6),
    gps_lng NUMERIC(9,6),
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'acknowledged', 'resolved')),
    acknowledged_by UUID REFERENCES public.admins(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.location_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id UUID REFERENCES public.sos_events(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Settlement & Operations
CREATE TABLE IF NOT EXISTS public.care_buddy_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_buddy_id UUID NOT NULL REFERENCES public.care_buddies(id),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) UNIQUE,
    amount_in_rupees NUMERIC(10,2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.users(id),
    channel TEXT NOT NULL CHECK (channel IN ('push', 'whatsapp', 'sms', 'email')),
    message_type TEXT NOT NULL,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('pending', 'sent', 'failed')),
    retry_attempts INTEGER DEFAULT 0 NOT NULL,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES public.admins(id),
    action TEXT NOT NULL,
    target_table TEXT NOT NULL,
    target_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_buddies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elder_guardian_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_buddy_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
