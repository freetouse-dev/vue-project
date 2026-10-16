# Email Verification & Password Reset (FastAPI Steps 30–33)

## 1. Overview
This document explains the frontend architecture, security considerations, and state workflows for the OTP-based email verification and password recovery systems introduced in FastAPI Steps 30–33.

---

## 2. Workflows

### 2.1 Registration & Email Verification Workflow
1. **User Registration (`POST /api/v1/auth/register`)**:
   - The user enters full name, email, and password.
   - FastAPI registers the user in an **unverified** state (`is_verified = False`).
   - The backend generates a cryptographically secure 6-digit numeric OTP, hashes it into the database (`user_otps`), and dispatches it via the SMTP email service.
   - The frontend intercepts the registration response and immediately redirects the user to:
     ```text
     /verify-email?email=<encoded_email>
     ```
2. **Submitting the Verification Code (`POST /api/v1/auth/verify-email`)**:
   - The user inputs the 6-digit code.
   - Payload:
     ```json
     {
       "email": "user@example.com",
       "otp": "123456"
     }
     ```
   - On success, `user.is_verified` becomes `True`, and the user is redirected to `/login` with a success toast.
3. **Resending Verification OTP (`POST /api/v1/auth/resend-verification-otp`)**:
   - Includes a 60-second client-side cooldown to prevent spam.
   - Inactivates the previous OTP and issues a fresh code.

### 2.2 Login Enforcement for Unverified Accounts
- In `POST /api/v1/auth/login`, if the user has `is_verified == False`, FastAPI returns:
  ```json
  {
    "error": true,
    "status_code": 403,
    "detail": "Email address not verified. Please verify your email before logging in."
  }
  ```
- The frontend `LoginView.vue` detects this `403` status and renders an actionable link:
  ```html
  <router-link :to="`/verify-email?email=${encodeURIComponent(email)}`">
    Verify your email address now &rarr;
  </router-link>
  ```

### 2.3 Password Reset Workflow (`/forgot-password`)
A 3-step wizard with anti-enumeration protection:
1. **Step 1: Request Code (`POST /api/v1/auth/forgot-password`)**:
   - Payload: `{ "email": "user@example.com" }`.
   - Returns a generic message (`"If your email address is registered, a password reset code has been sent."`) regardless of whether the email exists.
2. **Step 2: Verify Reset OTP (`POST /api/v1/auth/verify-reset-otp`)**:
   - Payload: `{ "email": "user@example.com", "otp": "654321" }`.
   - On validation, the backend returns a short-lived, single-use JWT authorization token:
     ```json
     {
       "reset_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "token_type": "bearer"
     }
     ```
3. **Step 3: New Password Submission (`POST /api/v1/auth/reset-password`)**:
   - Payload:
     ```json
     {
       "reset_token": "...",
       "new_password": "NewSecurePassword123"
     }
     ```
   - On success, invalidates all pending reset OTPs and updates password hash. Redirects to `/login`.

---

## 3. Security Considerations
- **No Plaintext OTPs in Frontend Storage**: OTPs are entered directly and transmitted over TLS.
- **Single-Use Tokens**: The `reset_token` is valid for 15 minutes and invalidated immediately upon password change.
- **Input Sanitization**: OTPs are validated via regex `^\d{6}$` before sending to the backend.
