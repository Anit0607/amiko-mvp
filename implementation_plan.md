# Approved Implementation Plan: Amiko Real MVP

## MVP Objective

Build Amiko as a real, production-ready elder-care MVP with live users, real authentication, real guardian linking, real coupon wallet, real bookings, real payments, real SOS alerts, real admin operations, and real Care Buddy assignment.

This product prioritizes reliability, accessibility, trust, safety, and operational usability over visual effects.

---

## 1. Product Direction Change

### Removed from Scope
* Three.js floating 3D phone frame
* WebGL-rendered app UI
* Simulated backend
* Hardcoded elder/guardian profiles
* Fake coupon wallet updates
* Fake Care Buddy movement
* Canvas-only map simulation
* Presentation-style glassmorphism-heavy UI
* Mock data
* Any dummy payment or booking confirmation flow

### Included in Scope
* Real mobile-first PWA
* Real backend database
* Real user accounts
* Real role-based access
* Real guardian approval and linking
* Real coupon wallet ledger
* Real booking engine
* Real admin dashboard
* Real Care Buddy assignment workflow
* Real location tracking where permitted
* Real SMS/WhatsApp/email/push notifications
* Real emergency event logging

---

## 2. Final MVP Tech Stack

* **Frontend:** Mobile-first PWA using **Next.js** (tailored for Elder, Guardian, Admin, and Care Buddy platforms).
* **Backend:** **Supabase + Edge Functions** (for fast, serverless database-adjacent operations).
* **Database:** **Supabase PostgreSQL**.
  * **Row Level Security (RLS) is strictly enabled** on all exposed tables. Publishing API keys will not allow reads/writes without explicit policies.
* **Authentication:** OTP-based mobile login.
* **Payments:** **Razorpay** (primary payment gateway).
* **Notifications:** WhatsApp Business API + SMS provider + Email.
* **Maps & Geolocation:** Google Maps API.
* **File Storage:** Supabase Storage (for Care Buddy documents & service proofs).
* **Monitoring:** Sentry + PostHog.

### Core Roles
The MVP supports four role types:
1. **Elder / Care Receiver**
2. **Guardian / Family Member**
3. **Admin / Operations Team**
4. **Care Buddy / Service Partner**

---

## 3. Authentication & User Management

### Elder Registration & Onboarding Consent
Capture:
* Full name, Age, Mobile number, Address, City/locality, Emergency contacts.
* Medical conditions, Mobility concerns, Preferred language.
* Guardian name, Guardian relationship, Guardian email/mobile.
* Consent checkboxes:
  * Elder Consent
  * Guardian Consent
  * Location-sharing Consent
  * Emergency-contact Consent
  * Medical-information Storage Consent
* **Onboarding Disclaimer:** *Amiko is clearly stated to be a care assistance and coordination platform, not a medical emergency replacement, hospital, ambulance operator, or emergency medical provider.*
* *If elder age is 60 or above, guardian details are mandatory.*

### Guardian Onboarding
* Receives invite link via Email/SMS/WhatsApp.
* Performs login with one-time secure link or OTP.
* Conducts elder profile review and consent acceptance.
* Manages payments and accesses coupon wallet.

### Admin Approval
Before the account becomes active:
* Admin reviews elder profile and verifies guardian information.
* Admin confirms serviceable location and approves/rejects account.
* System dispatches approval notification to Elder and Guardian.

---

## 4. Role-Based Permissions Matrix

### Elder
* Register profile & provide onboarding consents
* Add guardian details
* View services & coupon cost descriptions
* Request booking
* View schedule
* Trigger SOS
* Change accessibility settings
* Call support

### Guardian
* Review linked elder profile
* Buy coupons & view billing history
* View wallet and transaction ledger
* Receive booking alerts
* View elder schedule
* Track Care Buddy location during active visits
* Receive SOS alerts
* Update emergency contacts

### Admin
* Approve/reject elder profiles
* Manage guardians
* Manage service catalog and slot capacities
* Manage coupon packs & process manual corrections
* View payments & access reconciliation ledger
* Assign Care Buddies & monitor delays
* Track active bookings
* Monitor SOS events (acknowledge within 2 minutes)
* Process cancellations/refund approvals
* View audit logs

### Care Buddy
* View assigned jobs
* Accept/reject booking
* Start trip & mark arrival
* Start service & complete service
* Input completion verification OTP & upload completion proof
* Report incident

---

## 5. API & Backend Service Modules
The backend must expose clean APIs and write audit logs for critical actions across these services:
* **Auth Service:** Mobile OTP-based sign-in and session verification.
* **User/Profile Service:** Manage registration, profiles, and health parameters.
* **Guardian Linking Service:** Establish secure linking codes and relationship mapping.
* **Coupon Wallet Service:** Manage ledger entries for coupon credit, debit, and balances.
* **Payment Service:** Handle gateway orders, webhook callbacks, receipts, and invoices.
* **Booking Service:** Handle availability validation, slots, 12h rule, booking status workflows.
* **Care Buddy Assignment Service:** Match Care Buddies to requests by location/skills/availability.
* **SOS Service:** Immediate trigger alerts, location snapshot capturing, and live socket alerts.
* **Notification Service:** Priority-based delivery via SMS, WhatsApp, push, and emails.
* **Location Service:** Capture real-time geolocation of en route Care Buddies.
* **Admin Service:** Approval systems, catalog management, and reporting APIs.
* **Audit Log Service:** Logging critical events (debits, login attempts, BGV checks).
* **File Upload Service:** Secure document uploads (identities, proofs of service completion).

---

## 6. Database Schema Modules
Create production database tables for:
* **User & Role Management:** `users`, `elders`, `guardians`, `elder_guardian_links`, `admins`, `care_buddies`, `emergency_contacts`.
* **Service System:** `service_categories`, `services`, `service_pricing`, `service_availability_by_location`, `bookings`, `booking_status_history`, `booking_notes`, `booking_reschedule_requests`, `booking_cancellations`.
* **Coupon & Payment System:** `coupon_wallets`, `coupon_transactions`, `coupon_packs`, `payment_orders`, `payment_confirmations`, `invoices`, `refunds`.
* **SOS & Safety:** `sos_events`, `sos_alert_recipients`, `sos_status_history`, `emergency_call_logs`, `location_snapshots`.
* **Care Buddy Operations:** `care_buddy_profiles`, `care_buddy_documents`, `care_buddy_verification_status`, `care_buddy_assignments`, `care_buddy_live_location`, `care_buddy_ratings`, `service_completion_proofs`, `care_buddy_earnings`, `care_buddy_settlements`.
* **Notifications:** `notification_templates`, `notification_logs`.
* **Audit & Security:** `login_logs`, `admin_action_logs`, `payment_audit_logs`, `consent_logs`, `data_access_logs`.

---

## 7. Coupon Wallet & Payment Rules

### Coupon Rules
* 1 coupon = ₹50.
* Guardian purchases coupon packs (Starter: 5 for ₹250, Standard: 10 for ₹500, Value: 20 for ₹950, Family: 50 for ₹2250).
* **Payment Webhook Validation & Idempotency:**
  * Verify payment webhook signature using Razorpay secret keys.
  * Webhook handlers must perform idempotency checks against `payment_orders` to ensure duplicate webhooks do not double-credit coupons.
  * Coupons are credited *only* after successful payment confirmation callback. Every transaction triggers an invoice number generation.
  * Insufficient balance blocks bookings; SOS remains free.
* **Manual Corrections:** Admin payment reconciliation screen is provided. Any manual wallet adjustment requires a reason and is strictly audit-logged.

### Cancellation, Refund & Reschedule Rules
* Guardian/Elder can cancel before Care Buddy assignment without penalty.
* After Care Buddy assignment, cancellation requires Admin approval.
* If service fails due to Amiko/Care Buddy issues, coupons are refunded back to the ledger.
* If the elder is unavailable after Care Buddy arrival, Admin decides on refund vs. partial deduction.
* Rescheduling keeps the same booking ID, creating status history updates.
* Every refund requires an Admin approval workflow and generates a coupon ledger reversal.

---

## 8. Service Booking Engine & SLAs

### Service Area & Availability Rules
* **Service Area:** City/locality serviceability check must match the elder's profile.
* **Operating Hours:** Slot validation checking against service-wise operating hours.
* **Capacity Limits:** Care Buddy slot limits checking to prevent overbooking.
* **Advance Notice:** Normal services require $\ge$ 12-hour advance booking lead time. Emergency services are available separately and bypass this restriction.
* **Admin-Assisted Booking:**
  * Admin can create a booking on behalf of the Elder.
  * Admin can deduct coupons after obtaining verbal/written Guardian confirmation.
  * Admin can reschedule/cancel from the dashboard.
  * All Admin-assisted actions are recorded in the audit logs.

### Operational SLA Targets
* **Profile Approval:** Completed within 24 hours.
* **Booking Assignment:** Match within defined operational hours.
* **SOS Dispatch:** Alerts delivered under 30 seconds.
* **Admin SOS Acknowledgement:** Target under 2 minutes.
* **Care Buddy Delay:** If buddy is delayed past ETA, trigger SMS updates to Guardian.
* **Escalations:** If no Care Buddy accepts booking, flag for manual Admin intervention.

---

## 9. Care Buddy Assignment & Settlement

### BGV & Onboarding
* Care Buddy Profile: Contact info, Background Verification (BGV) status, skills, location, availability calendar, rating, BGV documents.
* Admin controls: View bookings -> Filter Buddies by location/service/availability -> Assign -> Track status.

### Physical-World Completion Verification
To verify completion:
* Care Buddy requests an **OTP** from the Elder or Guardian at the visit location to close the service.
* Care Buddy uploads a photo or document proof of service completion.
* Admin override to close a booking without OTP is allowed only with written reason and is logged.
* Guardian receives a service completion summary and rating/feedback option.

### Settlement & Earnings
* Logic and placeholders for: Care Buddy earnings per completed job, service-wise payout metrics, completion-based payouts, penalties/adjustments, and Admin payout reports.

---

## 10. SOS Emergency Flow & Escalation Logic

### SOS Priority Escalation
1. **Instant Socket Alert:** Real-time push notification to linked Guardian and active Admin monitors.
2. **Instant WhatsApp + SMS:** Fallback dispatch to Guardian and Admin.
3. **Emergency Call Instruction:** Immediate popup on Elder's UI to dial primary emergency services (108 / Guardian).
4. **Secondary Escalation:** If the primary Guardian does not acknowledge the alert within 2 minutes, the system auto-escalates to secondary emergency contacts.

### Fallback Mechanics
* If internet connectivity fails, present offline emergency phone numbers directly.
* If location permission is denied, fallback to manual location input.
* Always record: Notification channel, recipient, delivery status, retry attempts, timestamp, and failure reason.

---

## 11. Accessibility & Elder UX
* Large/Extra-large text modes, High Contrast theme, Dark theme.
* Read Aloud and Voice Guidance system.
* One-handed mode, Haptic feedback, Low cognitive load screens.
* Large touch targets ($\ge$ 56px).
* Multilingual support (English + Hindi first, Bengali optional).

---

## 12. Voice Request Flow (Phase 2 Enhancement)
* **MVP Core:** Simple, button-based category/service booking.
* **Phase 2:** Voice booking using browser native Web Speech API (transcribes command -> extracts category/service -> presents confirmation screen with manual editing).

---

## 13. Suggested MVP Build Priority

### Phase 1: Must-Have for MVP
* OTP Authentication & Registration.
* Elder profile creation with consent forms, medical disclaimers, & Guardian linking.
* Admin approvals console.
* Coupon wallet ledger & Razorpay payment webhook validations (idempotency, signature validation, invoice generation).
* Service catalog, service area/slot SLAs, & 12-hour booking engine.
* Admin-assisted booking flow.
* Care Buddy assignment & physical-world OTP verification flow.
* SOS safety flow with 2-minute escalation targets.
* Multi-channel notification dispatchers (Push/WhatsApp/SMS) and logs.
* Basic Accessibility configurations.
* Critical audit logging.

### Phase 2: Should-Have After MVP
* Voice request parsing.
* Live geolocation map tracking for Care Buddies.
* Ratings & feedback systems.
* Invoice downloads.
* Multilingual system setup.
* Auto-assignment helper tools.
* Advanced admin reports.

### Phase 3: Post-MVP / Later
* Native Android applications.
* Predictive buddy allocation algorithms.
* Subscription/recurring plans.
* Family group dashboards.
* IoT/Health device integration triggers.

---

## 14. MVP Acceptance Criteria
The MVP is complete only when the following flows work end-to-end with real data:
1. Elder registers via mobile OTP and inputs guardian details.
2. Guardian receives invite, logs in, and completes linking confirmation.
3. Admin approves the elder profile.
4. Guardian purchases a coupon pack via the real Razorpay payment gateway; wallet updates only upon valid webhook callback (idempotent validation).
5. Elder books a service (e.g. "BP Check") matching slot rules and advance booking SLAs.
6. Admin assigns a verified Care Buddy.
7. Care Buddy accepts, initiates trip, completes service, and closes it using the Elder/Guardian OTP.
8. Wallet is debited, ledger updates, and Guardian sees transaction logs.
9. SOS button triggers real socket/SMS/WhatsApp alerts.
10. Admin can monitor active SOS event.
11. Accessibility features work on physical mobile browsers.
12. Admin can audit all critical operations.
