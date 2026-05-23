# TRACKIFY Demo Voice-Over Script (Corrected & Complete)
## Team Project — Competition Submission
### Duration: 2:45–3:15 minutes

---

## [00:00–00:10] Intro (Title Slide)
**On-screen:** Show TRACKIFY title / open `qr-scan.html`

We are the TRACKIFY team. TRACKIFY is a secure Visitor Management and Staff Tracking system that streamlines campus entry, notifications, and reporting.

---

## [00:10–00:28] QR & Auto-Detection (Same QR for Both)
**On-screen:** `qr-scan.html` with phone input field visible

Both visitors and staff use the same QR code. When they scan and enter their phone number, TRACKIFY's backend automatically detects whether the user is a visitor or staff member and shows the appropriate flow.

---

## [00:28–01:05] NEW VISITOR Flow (Registration + OTP)
**On-screen:** Phone entry → click Continue → new visitor form appears

For a new visitor: enter name, email, and place. Click "Send OTP" — TRACKIFY backend sends a one-time password to the visitor's email for verification. Enter the OTP you received, then fill the purpose of your visit and select whom you will meet. Click "Submit Visit Request."

**IMPORTANT:** The website closes immediately after submission. This is intentional — two key reasons:
1. **Prevents spam:** A visitor cannot submit multiple requests repeatedly without physically scanning the QR code again.
2. **Prevents fraud during checkout:** If the website remained open, a visitor could fake a checkout from outside campus without being physically present. By closing the website, they MUST scan the QR code again when they actually arrive at the scanner to checkout, proving they are truly on campus.

The backend processes the request and stores it in the system.

---

## [01:05–01:18] RETURNING VISITOR Flow (Fast Check-in)
**On-screen:** Phone entry → click Continue → visit details form (skipped registration)

For a returning visitor, the system skips registration. Enter the phone number and the visit details form appears immediately. Fill purpose and whom to meet, then submit. Again, the website closes after submission for the same reasons: prevents spam and fraud.

---

## [01:18–01:32] VISITOR CHECKOUT (Only After Receptionist Acceptance)
**On-screen:** Visitor scans QR again → phone entry → checkout section appears

Important: checkout is only possible AFTER the receptionist accepts the visitor's request. When the receptionist accepts, the in-time is recorded.

Later, when the visitor leaves campus, they scan the QR code again, enter their phone number. The system recognizes they are already checked in and shows the "Check-out" option. Click "Check-out" to record exit. The website closes again to prevent fraud — if it stayed open, a visitor could click checkout from outside campus without physically being present.

**Key Point:** Visitors do NOT manually enter in-time or out-time. TRACKIFY automatically records:
- **In-time:** Recorded automatically when receptionist accepts the visit request.
- **Out-time:** Recorded automatically when the visitor clicks "Check-out" while physically scanning the QR code.

This ensures accurate, fraud-proof timing.

---

## [01:32–01:48] RECEPTIONIST LOGIN & APPROVAL
**On-screen:** `receptionist-login.html` → enter phone & password → login

Receptionist logs in with phone number and password. On the dashboard, you see a list of pending visitor requests. You do not receive an email notification — you simply log in to check the dashboard directly.

When you click "Accept," two things happen:
1. An **email is sent to the visitor** confirming approval.
2. An **email is sent to the host staff member** (the person the visitor requested to meet) — only to that specific staff, not to everyone.

When you click "Reject," an email is sent to the visitor notifying them of rejection.

---

## [01:48–02:05] RECEPTIONIST ACCEPTS = AUTO TIME RECORD
**On-screen:** Pending visits table → click ✓ Accept → show success message

When you accept a visit request, the **in-time is recorded automatically** at that exact moment. You see a success message; the email is sent to the visitor and the host staff in the background. The visitor's entry time is now locked in the system.

---

## [02:05–02:32] STAFF FLOW (Scan → Exit → Re-scan → Entry)
**On-screen:** Staff scans QR → enters phone number → system identifies as staff

Staff members use the same QR code. Scan the QR and enter your phone number. TRACKIFY detects you are staff and shows the exit/entry section.

**Going Out:**
- The system shows "Staff Going Out" form.
- Enter the purpose (e.g., "Lunch," "Bank work," "Meeting").
- Click "Record Exit."
- **The website closes immediately.** This is important — it prevents fraud. If the website stayed open, a staff member could click "Record Entry" from outside campus without actually returning. The website closing forces staff to physically re-scan the QR code when they come back. The exit time and purpose are saved to the database and security is notified.

**Coming Back In:**
- Later, the staff member physically scans the QR code again.
- Enters phone number again.
- The system detects they are currently outside and shows "Staff Coming In" option.
- Click "Record Entry."
- **The website closes.** The entry time is recorded automatically and security is updated.

This two-scan process ensures that staff actually visit the QR scanner and don't abuse the system by recording fake entries from outside.

---

## [02:32–02:50] SECURITY DASHBOARD (Live Monitoring & Verification)
**On-screen:** `security-login.html` → login with phone & password → security dashboard

Security logs in with phone number and password. The dashboard displays:
- **Total visitors today**
- **Currently inside campus** (active visitors)
- **Staff out** (who left campus)
- **Staff in** (who are inside)

Below, view the **Visitor Movements** table with color-coded status badges:
- 🟢 **Green** = Accepted (allowed to enter)
- 🟡 **Yellow** = Pending (waiting for receptionist approval)
- 🔴 **Red** = Rejected (denied entry)

This allows security to verify that visitor requests are properly registered in the system. Also view the **Staff Logs** table showing staff name, exit purpose, exit time, and re-entry time. This gives security a real-time, accurate picture of campus occupancy at any moment.

---

## [02:50–03:10] PRINCIPAL DASHBOARD (Reports & Export)
**On-screen:** `principal-login.html` → login with phone & password → dashboard

Principal logs in with phone number and password. The dashboard shows:
- **Today's visitors count**
- **Today's staff logs count**
- **Monthly visitors**
- **Active visitors**

To generate a report:
- Click **"Today's Report"** for today's data, or
- Select a **custom date range** (From Date / To Date) and click **"Generate Report"**.

The report displays:
- **Numbered Visitor Details** (Name, Phone, Place, Purpose, Whom to Meet, In-Time, Out-Time, Status)
- **Numbered Staff Log Details** (Staff ID, Name, Department, Exit Purpose, Exit Time, Entry Time, Log Type)

**Download options:**
- Click **"📊 Download as CSV"** to export for Excel/spreadsheet analysis.
- Click **"📄 Download as PDF"** for formal documentation.

These reports are crucial for campus audits and record-keeping.

---

## [03:10–03:15] Tech Stack & Security Summary
**On-screen:** Show tech/security slide (or overlay)

TRACKIFY is built with:
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Security:** OTP email verification for visitors, password-based role logins, JWT tokens, bcrypt password hashing, parameterized SQL queries, role-based access control, and automatic fraud-proof timestamping.

The website-closing mechanism after every action — submit, exit, entry, and checkout — prevents users from making repeated requests or faking actions from outside campus, ensuring data integrity and security.

---

## [03:15–03:20] Closing
**On-screen:** TRACKIFY title slide with team name (if available)

Thank you for watching TRACKIFY — built by our team to make campus entry safer, faster, and auditable. We welcome your feedback and questions.

---

---

# SHORT VERSION (90–120 seconds)

TRACKIFY is a team project using a single QR code for visitors and staff. **Visitors:** scan QR → enter phone → new visitors register via email OTP → submit visit request → **website closes** (prevents spam & fraud) → receptionist logs in to dashboard → accepts (email sent to visitor and host staff only) → **in-time recorded automatically** → later, visitor physically scans again → enters phone → clicks checkout → **website closes** (prevents checkout fraud from outside campus) → **out-time recorded automatically**.

**Staff:** scan QR → enter phone → system identifies staff → enter exit purpose → click exit → **website closes** (prevents re-entry fraud from outside) → later, physically scan again → click entry → **website closes** → both times recorded automatically.

**Security:** logs in → views color-coded visitor dashboard (green/yellow/red) to verify requests are registered → also monitors staff logs.

**Receptionist:** logs in to dashboard (no email notification) → reviews pending requests → accepts/rejects → emails sent automatically.

**Security:** logs in → views live color-coded dashboard (green/yellow/red) and staff logs.

**Principal:** generates reports (today or custom date range) and exports CSV/PDF.

Built with Node.js, Express, MySQL, OTP verification, JWT, password hashing, and parameterized queries.

---

# ONE-LINE CUE SHEET (Follow While Recording)

1. Open `qr-scan.html`; say "same QR for visitors and staff."
2. Enter new visitor phone → Continue → fill name/email/place.
3. Click "Send OTP" → enter OTP from email → fill purpose/host → "Submit Visit Request" → **website closes**.
4. Say: "Backend sends request to receptionist. Prevents tampering."
5. Returning visitor: phone → Continue → visit details (no registration) → submit → **website closes**.
6. Visitor checkout: scan again → phone → "Check-out" → **website closes**. Say: "In-time: auto at accept. Out-time: auto at checkout."
7. Open `receptionist-login.html`; login phone/password.
8. Pending visits table → click Accept → SMS to visitor, email to **host staff only**.
9. Say: "In-time recorded automatically at acceptance."
10. Staff: scan QR → phone → system identifies staff → enter exit purpose → "Record Exit" → **website closes**.
11. Staff re-scan → phone → "Record Entry" → **website closes**. Say: "Both times auto-recorded."
12. Open `security-login.html`; show color-coded visitor table (green/yellow/red).
13. Open `principal-login.html`; click "Today's Report" → show visitor/staff tables → click "Download CSV" → show file.
14. Closing slide: tech & team name.

---

# ON-SCREEN CAPTION TEXT (Display During Video)

- **Title Slide:** TRACKIFY — Visitor & Staff Management (Team Project)
- **QR Page Header:** Same QR for Visitors & Staff
- **New Visitor Section:** New Visitor Registration — Email OTP Required
- **After Submit:** Website Closes — Backend Processes Request (Prevents Tampering) — Email Sent to Receptionist
- **Returning Visitor:** Returning Visitor — Skip Registration
- **Checkout Section:** Visitor Check-out — Scan Again & Enter Phone
- **After Checkout:** Website Closes — Exit Time Recorded Automatically
- **Time Recording Note:** In-Time: Auto-recorded when Receptionist Accepts | Out-Time: Auto-recorded when Visitor Clicks Check-out
- **Receptionist Login:** Phone Number & Password
- **Receptionist Action:** Accept = Email to Visitor + Email to Host Staff Only | Reject = Email to Visitor
- **Staff Section:** Staff Entry/Exit (Same QR)
- **Staff Exit:** Enter Exit Purpose → Record Exit → Website Closes
- **Staff Entry:** Click Record Entry → Website Closes → Both Times Auto-Recorded
- **Security Banner:** Live Monitoring — Green = Allowed | Yellow = Pending | Red = Denied
- **Principal Report:** Today's Report | Custom Date Range | Download CSV/PDF
- **Tech Stack:** Node.js • Express.js • MySQL • OTP • JWT • Bcrypt • Parameterized Queries
- **Closing:** Built by TRACKIFY Team — Secure, Fast, Auditable Campus Entry

---

## NOTES FOR RECORDING

1. **Website Closing:** Emphasize this happens after submit, checkout, exit, and entry — it's a security feature to prevent fraud.
2. **Auto-Timing:** Highlight that TRACKIFY records times automatically; users don't enter them manually.
3. **Role-Based:** Show phone/password logins for receptionist, security, and principal — emphasize they are different from visitor OTP.
4. **Email Targeting:** Receptionist accepts → email goes **only** to the host staff member, not broadcast.
5. **Two-Scan Process:** Staff and visitors must physically re-scan to exit/enter, ensuring authenticity.
6. **Tone:** Professional, clear, confident — suitable for a competition video.

