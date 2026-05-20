# Security Hardening Update (May 20, 2026)

This document summarizes the authentication and security hardening applied to SkillBridge on May 20, 2026.

## New Security State

- JWT-based Spring Security remains the core auth model.
- API sessions remain stateless.
- Admin-only endpoints are still guarded by role checks.
- Login now includes temporary brute-force lockout.
- Invalid JWTs now fail safely as unauthenticated requests.
- API responses now include stricter security headers.
- CORS configuration now rejects wildcard origins when credentials are enabled.

## Code Changes

### 1) Login brute-force protection

- Added `LoginAttemptService` to track failed login attempts by `email + client IP`:
  - [LoginAttemptService.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\security\LoginAttemptService.java)
- Updated login flow to:
  - block temporarily after threshold
  - reset counters on successful login
  - return `429 Too Many Requests` when locked
  - [AuthService.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\user\service\AuthService.java)
  - [AuthController.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\user\controller\AuthController.java)

### 2) Explicit `429` exception handling

- Added custom exception:
  - [TooManyRequestsException.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\common\exception\TooManyRequestsException.java)
- Added API error mapping for HTTP `429`:
  - [GlobalExceptionHandler.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\common\exception\GlobalExceptionHandler.java)

### 3) Safer JWT parsing behavior

- `JwtService` now handles parsing/validation errors without surfacing token parsing exceptions.
- `JwtAuthenticationFilter` now safely handles missing users referenced by token subject.
- Files:
  - [JwtService.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\security\JwtService.java)
  - [JwtAuthenticationFilter.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\security\JwtAuthenticationFilter.java)

### 4) Hardened HTTP headers and CORS safeguards

- Added response header configuration:
  - `X-Content-Type-Options`
  - frame deny
  - no-referrer policy
  - HSTS
- Added CORS guardrails:
  - fail startup if no allowed origins are configured
  - fail startup if wildcard `*` is used with credentials enabled
- File:
  - [SecurityConfig.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\security\SecurityConfig.java)

### 5) Config model updates

- Added typed security config block:
  - `app.security.max-login-attempts`
  - `app.security.login-lock-minutes`
  - `app.security.login-attempt-window-minutes`
- File:
  - [AppProperties.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\config\AppProperties.java)

## New Environment Variables

Configured in:
- [application.properties](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\resources\application.properties)
- [.env.example](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\.env.example)

Variables:

- `SECURITY_MAX_LOGIN_ATTEMPTS` (default `5`)
- `SECURITY_LOGIN_LOCK_MINUTES` (default `15`)
- `SECURITY_LOGIN_ATTEMPT_WINDOW_MINUTES` (default `15`)

## Documentation Updates

- Updated setup guide with new env vars and CORS/login lock notes:
  - [SETUP_FOR_FRIEND.md](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\SETUP_FOR_FRIEND.md)
- Updated architecture summary:
  - [architecture.md](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\docs\architecture\architecture.md)
- Updated API overview auth notes:
  - [api-overview.md](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\docs\api\api-overview.md)

## Verification

Backend test suite executed successfully:

- Command: `mvn -f apps/backend/pom.xml test`
- Result: `BUILD SUCCESS`
- Tests include new brute-force logic tests:
  - [LoginAttemptServiceTests.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\test\java\com\skillbridge\security\LoginAttemptServiceTests.java)

## Remaining Recommended Hardening (Future)

- Migrate frontend token storage from `localStorage` to HttpOnly secure cookies.
- Add refresh token rotation and revocation.
- Add MFA for admin accounts.
- Add password reset flow with secure one-time tokens.

## OAuth Extension (Google, same date)

The project now supports Google and GitHub sign-in while keeping JWT as the internal session token.

- New endpoint: `POST /api/auth/google`
- New endpoint: `POST /api/auth/github`
- Request body:
  - `{"idToken":"<google id token>"}`
  - `{"code":"<github auth code>","redirectUri":"http://localhost:5173/login"}`
- Backend behavior:
  - verifies Google ID token signature and issuer
  - validates audience against configured allowed client IDs
  - requires verified Google email
  - exchanges GitHub auth code for access token
  - fetches GitHub profile and verified email
  - creates local user on first login (role `USER`)
  - returns the regular SkillBridge `AuthResponse` with app JWT

Main files:

- [GoogleTokenVerifierService.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\security\GoogleTokenVerifierService.java)
- [GoogleLoginRequest.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\user\dto\GoogleLoginRequest.java)
- [AuthController.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\user\controller\AuthController.java)
- [AuthService.java](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\backend\src\main\java\com\skillbridge\user\service\AuthService.java)
- [LoginPage.tsx](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\apps\frontend\src\pages\LoginPage.tsx)
- [google-oauth-setup.md](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\docs\auth\google-oauth-setup.md)
- [github-oauth-setup.md](C:\Users\ouzza\OneDrive\Desktop\BDIO\S2\JEE Devops\SkillBridge\docs\auth\github-oauth-setup.md)
