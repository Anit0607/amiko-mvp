import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Fallback Mock Client for Local Development & Testing without Env Variables
class MockSupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
  }

  getData() {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(`db_${this.tableName}`);
    return data ? JSON.parse(data) : [];
  }

  saveData(data) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`db_${this.tableName}`, JSON.stringify(data));
  }

  async select(columns = '*') {
    const data = this.getData();
    return { data, error: null };
  }

  async insert(values) {
    const data = this.getData();
    const newRecords = Array.isArray(values) ? values : [values];
    const recordsWithId = newRecords.map(r => ({
      id: r.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...r
    }));
    data.push(...recordsWithId);
    this.saveData(data);
    return { data: recordsWithId, error: null };
  }

  async update(values) {
    // Basic filter logic placeholder or simple update
    return { data: values, error: null };
  }

  async delete() {
    return { data: [], error: null };
  }
}

class MockSupabaseClient {
  constructor() {
    this.auth = {
      user: null,
      async signInWithOtp({ phone, email }) {
        console.log(`[Mock Auth] Sending OTP to: ${phone || email}`);
        return { data: { user: { id: 'mock-user-id', phone, email } }, error: null };
      },
      async verifyOtp({ token, phone, type }) {
        const user = { id: crypto.randomUUID(), phone, role: 'elder' };
        this.user = user;
        return { data: { session: { user } }, error: null };
      },
      async signOut() {
        this.user = null;
        return { error: null };
      },
      async getSession() {
        return { data: { session: this.user ? { user: this.user } : null }, error: null };
      }
    };
  }

  from(tableName) {
    return new MockSupabaseQueryBuilder(tableName);
  }
}

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : new MockSupabaseClient();

console.log(
  isSupabaseConfigured
    ? '[Amiko] Connected to production Supabase backend.'
    : '[Amiko] Using local storage mock database (no env keys found).'
);
