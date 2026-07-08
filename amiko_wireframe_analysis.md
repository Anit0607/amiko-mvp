# Amiko: Android Wireframe Analysis

Amiko is a companion mobile application designed for elder care and daily support assistance. It operates on a coupon-based payment model managed by a Guardian (e.g., a family member) while providing a simplified, highly accessible interface for the Care Receiver (Elder) to request care services, track schedules, and call for emergency help.

---

## User Journey & App Flow

The following flowchart illustrates the onboarding, daily use, and emergency flows in the Amiko app ecosystem:

```mermaid
graph TD
    %% Onboarding Flow
    subgraph Onboarding & Verification
        On["1. Welcome / Onboarding"] --> Auth["2. Sign In (Elder)"]
        Auth --> Reg["3. Care Receiver Profile"]
        Reg --> Admin["4. Admin Review (Web Portal)"]
        Admin --> Email["5. Guardian Email Invite"]
        Email --> GL["6. Guardian Login"]
        GL --> GD["7. Guardian Dashboard"]
        GD --> Buy["Buy Coupons"]
    end

    %% Daily Use Flow
    subgraph Daily App Usage (Elder)
        Home["8. Home Screen"] --> Mood["Mood Check (Daily Log)"]
        Home --> Speak["Speak Request (Voice Assistant)"]
        Home --> Cat["Choose Category & Service"]
        Speak --> Conf["Confirm Request (12h+ lead time)"]
        Cat --> Conf
        Conf --> Buddy["Care Buddy Live (Ravi Assigned)"]
        Buddy --> Sched["My Schedule & Appointments"]
    end

    %% SOS Flow
    subgraph Emergency Flow
        SOS["Emergency SOS Screen"] --> Hold["Hold Button for 3s"]
        Hold --> Alerts["Alerts Sent (Guardian, Family, Ambulance)"]
    end
    
    Home -.-> SOS
```

---

## Detailed Feature Breakdown

### 1. Onboarding & Registration (Elder)
* **Welcome Screen (`onboarding`):** A 3-slide carousel introducing the app's services (daily care, errands & accompaniment, home & emergency support).
* **Sign In (`auth`):** Automatically detects if a registered number is present (mock: `+91 98765 43210`) with direct Google login options, or manual input.
* **Care Receiver Profile (`register`):** Collects elder's details (Name, Age, Phone, Address, Medical Conditions, GPS/Coordinates). If the user is $\ge 60$ years old, a Guardian name, relationship, and email address are required.

### 2. Admin & Guardian Setup
* **Admin Review (`adminReview`):** Informs the user that the profile has been sent to the admin team. Reviewing, background checks, and approvals happen externally on the web portal ([eldercaresaathi.com](https://eldercaresaathi.com)).
* **Guardian Email Invite (`guardianInvite`):** The designated Guardian receives an email containing a link and a one-time code (`ELDER-M7X4-9K2P`) to create their credentials.
* **Guardian Dashboard (`guardianDashboard`):** Displays linking status, payments, coupon store access, and real-time tracking of active Care Buddy trips.

### 3. Coupon Economy & Service Booking
* **Buy Coupons (`couponStore`):** Guardians buy coupon packs. Each coupon is worth **₹50**. Packs include:
  * **5 Coupons** (Starter) = ₹250
  * **10 Coupons** (Standard - Popular) = ₹500
  * **20 Coupons** (Value - Save 5%) = ₹950
  * **50 Coupons** (Family - Save 10%) = ₹2,250
* **Home Screen (`home`):** Simple entry point prompting a daily mood check (😊 Great, 🙂 Good, 😐 Okay, 😔 Low, 😣 Unwell), voice requests, and bottom tabs.
* **Speak Request (`aiRequest`):** Allows elders to dictate services (e.g. *"grocery run tomorrow"*). An AI parses the category, service, and timing.
* **Service Confirmation (`serviceConfirm`):** Shows details before booking. Requires at least **12 hours in advance** booking lead time (except for emergency SOS requests) to arrange a Care Buddy.
* **Care Buddy Live (`careBuddy`):** Once assigned, displays buddy details (e.g. *Ravi Kumar, 4.9★*), expected arrival time (e.g. *in 25 min*), and live tracking map.

---

## Service Catalog & Coupon Pricing

Elders spend coupons depending on the service category. SOS and emergency requests are free.

| Category | Service Name | Cost (in Coupons) | Cash Value Equivalent |
| :--- | :--- | :---: | :---: |
| **Health Support** | BP Check | 2 | ₹100 |
| | Blood Sugar Check | 2 | ₹100 |
| | Lab Test Assistance | 4 | ₹200 |
| | Physiotherapy | 5 | ₹250 |
| | Medication Reminder | 1 | ₹50 |
| **Travel & Accompaniment** | Pharmacy Visit | 3 | ₹150 |
| | Temple Visit | 4 | ₹200 |
| | Hospital Visit | 6 | ₹300 |
| | Bank Visit | 6 | ₹300 |
| | Government Office Visit | 6 | ₹300 |
| **Shopping & Essentials** | Utility Bill Assistance | 2 | ₹100 |
| | Grocery Shopping | 3 | ₹150 |
| | Medicine Pickup | 3 | ₹150 |
| | Document Submission | 3 | ₹150 |
| **Home Support** | Electrician / Plumber / Carpenter | 5 | ₹250 |
| | Appliance Repair | 6 | ₹300 |
| | Emergency Home Maintenance | 8 | ₹400 |
| **Emergency** | SOS Alert / Ambulance / Notify Family | **Free** | **Free** |
| | Emergency Home Visit | 4 | ₹200 |

---

## Accessibility Settings (`settings`)

To make the app usable for elderly individuals with sensory or motor impairments, the app features an extensive Accessibility menu:
* **Visual Aid:** Larger Text & Extra Large Text modes, High Contrast theme, and Dark Mode.
* **Audio Assistance:** Voice Guidance (screen reader) and Read Aloud.
* **Motor & Tactile:** One-Handed mode, Haptic Feedback, and Offline capability.
