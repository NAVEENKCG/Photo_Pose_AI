# AI Pose Aid - Architecture Diagrams & Visual Flowcharts

## 1. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                         USERS (Android Device)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐          ┌────────┐          ┌─────────┐
   │ Camera  │          │ ML Kit │          │  Local  │
   │         │          │  Pose  │          │Database │
   │ CameraX │          │Detector│          │(Room)   │
   └────┬────┘          └────┬───┘          └────┬────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐        ┌──────────────┐
        │   Encrypted   │        │  OkHttp +    │
        │Shared Prefs   │        │ Interceptors │
        │ - JWT tokens  │        │ - Auth       │
        │ - User data   │        │ - Refresh    │
        └───────────────┘        │ - Pinning    │
                │                └──────┬───────┘
                │                       │
                └───────────────┬───────┘
                                │
                        ┌───────▼────────┐
                        │ HTTPS + TLS    │
                        │ Certificate    │
                        │ Pinning        │
                        └───────┬────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
    ┌────────────┐      ┌──────────────┐      ┌─────────────┐
    │ Cloudflare │      │ Load Balancer│      │ API Gateway │
    │ WAF + CDN  │      │ (Optional)   │      │   (AWS)     │
    └────────────┘      └──────────────┘      └──────┬──────┘
        │                                             │
        └─────────────────────┬──────────────────────┘
                              │
                        ┌─────▼──────┐
                        │   Express  │
                        │  API Server│
                        │ Node.js    │
                        └─────┬──────┘
                              │
        ┌─────────────────────┼──────────────────┐
        │                     │                  │
        ▼                     ▼                  ▼
    ┌──────────┐          ┌──────────┐      ┌─────────┐
    │ Postgres │          │ Redis    │      │AWS S3   │
    │ Database │          │ Cache    │      │ Storage │
    │          │          │          │      │         │
    └──────────┘          └──────────┘      └─────────┘
        │
        ├─ Encrypted at rest
        ├─ Daily backups
        ├─ Point-in-time recovery
        └─ Read replicas (optional)
```

---

## 2. ANDROID APP ARCHITECTURE (3-LAYER)

```
┌────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  (UI - Jetpack Compose)                                    │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Login Screen │  │Camera Screen │  │Profile Screen│   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │            │
│  ┌──────▼──────────────────▼─────────────────▼────┐      │
│  │         ViewModel + State Management           │      │
│  │  (Coroutines, StateFlow, Jetpack Lifecycle)   │      │
│  └──────┬─────────────────────────────────────────┘      │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                      DOMAIN LAYER                          │
│  (Business Logic)                                          │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Use Cases    │  │ Models       │  │ Interfaces   │   │
│  │              │  │              │  │              │   │
│  │- Login       │  │- User        │  │- IAuth       │   │
│  │- Analyze     │  │- Pose        │  │- IPose       │   │
│  │- GetHistory  │  │- Session     │  │- IUser       │   │
│  └──────┬───────┘  └──────────────┘  └──────────────┘   │
│         │                                                │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────┐
│                      DATA LAYER                            │
│  (Repository Pattern)                                      │
│                                                            │
│  ┌──────────────┐                                         │
│  │ Repository   │                                         │
│  └──────┬───────┘                                         │
│         │                                                │
│  ┌──────┴────────────────────────────────┐               │
│  │                                       │               │
│  ▼                                       ▼               │
│ ┌────────────────┐              ┌─────────────────┐    │
│ │ Local Source   │              │ Remote Source   │    │
│ │ (Room DB)      │              │ (Retrofit API)  │    │
│ │                │              │                 │    │
│ │- Room Entities │              │- ApiService     │    │
│ │- DAOs          │              │- Interceptors   │    │
│ │- Encryption    │              │- Error Handling │    │
│ └────────────────┘              └─────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. AUTHENTICATION FLOW

```
┌──────────┐
│   User   │
└────┬─────┘
     │ Opens App
     ▼
┌─────────────────────┐
│  Check Token Valid? │
└──────┬──────────────┘
       │
   ┌───┴────────────────────────┐
   │                            │
   ▼ (Valid)                    ▼ (Invalid/None)
┌──────────────┐         ┌──────────────────┐
│ Navigate to  │         │ Navigate to      │
│ Home Screen  │         │ Login Screen     │
└──────────────┘         └────────┬─────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ User enters:    │
                         │ - Email         │
                         │ - Password      │
                         └────────┬────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │ Client-side Validation:    │
                    │ - Email format             │
                    │ - Password length          │
                    │ - No malicious chars       │
                    └────────┬───────────────────┘
                             │
                             ▼
                    ┌──────────────────────┐
                    │ POST /api/auth/login │
                    │ (via HTTPS + pinning)│
                    └────────┬─────────────┘
                             │
                    ┌────────▼─────────────┐
                    │ Backend Processing:  │
                    │ - Rate limit check   │
                    │ - Param validation   │
                    │ - bcrypt password    │
                    │ - Generate JWT       │
                    └────────┬─────────────┘
                             │
       ┌─────────────────────┴──────────────────────┐
       │                                            │
       ▼ (Success)                                  ▼ (Failure)
┌─────────────────────┐                   ┌──────────────────┐
│ Return:             │                   │ Return:          │
│ - accessToken       │                   │ - Error code     │
│ - refreshToken      │                   │ - Generic msg    │
│ - expiresIn (900s)  │                   │ - Log real error │
└────────┬────────────┘                   └────────┬─────────┘
         │                                         │
         ▼                                         ▼
┌─────────────────────┐                   ┌──────────────────┐
│ Save tokens:        │                   │ Show error toast │
│ - Access: Memory    │                   │ Rate-limit user  │
│ - Refresh:          │                   │ Log attempt      │
│   EncryptedSharedPr │                   └──────────────────┘
│ (AES-256-GCM)       │
└────────┬────────────┘
         │
         ▼
    ┌─────────────┐
    │ Check MFA?  │
    └──┬────────┬─┘
       │        │
   Yes │        │ No
       ▼        ▼
  ┌────────┐  ┌────────────┐
  │MFA     │  │Navigate to │
  │Screen  │  │Home        │
  └────────┘  └────────────┘
       │
       ▼
  ┌─────────────┐
  │User enters  │
  │TOTP code    │
  │from app     │
  └──────┬──────┘
         │
         ▼
  ┌──────────────────┐
  │POST              │
  │/api/auth/mfa/    │
  │verify            │
  └──────┬───────────┘
         │
         ▼
  ┌──────────────────┐
  │Navigate to Home  │
  │session created   │
  └──────────────────┘
```

---

## 4. TOKEN REFRESH FLOW

```
┌─────────────────────┐
│ API Request         │
│ with Access Token   │
└──────────┬──────────┘
           │
    ┌──────▼──────────┐
    │ OkHttp          │
    │ AuthInterceptor │
    └──────┬──────────┘
           │
    ┌──────▼──────────────────┐
    │ Attach Access Token      │
    │ Authorization: Bearer    │
    └──────┬───────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Backend Response │
    └──────┬───────────┘
           │
       ┌───┴─────────────────────────┐
       │                             │
       ▼ (200 OK)                    ▼ (401 Unauthorized)
    ┌──────────────┐         ┌──────────────────┐
    │ Return data  │         │ Access Token     │
    │ to app       │         │ expired          │
    └──────────────┘         └────────┬─────────┘
                                      │
                          ┌───────────▼────────────┐
                          │ Auto-refresh triggered │
                          │ (TokenRefreshInt.)     │
                          └───────────┬────────────┘
                                      │
                          ┌───────────▼─────────────────────┐
                          │ POST /api/auth/refresh          │
                          │ with refreshToken               │
                          │ (from EncryptedSharedPrefs)     │
                          └───────────┬─────────────────────┘
                                      │
                          ┌───────────▼──────────────────┐
                          │ Server validates refresh      │
                          │ - Check signature             │
                          │ - Check expiry (30 days)      │
                          │ - Check blacklist             │
                          └───────────┬──────────────────┘
                                      │
                  ┌───────────────────┴──────────────────┐
                  │                                      │
                  ▼ (Valid)                              ▼ (Invalid)
          ┌──────────────────┐              ┌──────────────────┐
          │ Return new       │              │ Clear tokens     │
          │ access token     │              │ Send to Login    │
          │ (15-min expiry)  │              │ Re-authenticate  │
          └────────┬─────────┘              └──────────────────┘
                   │
          ┌────────▼─────────┐
          │ Save new token   │
          │ to Memory        │
          └────────┬─────────┘
                   │
          ┌────────▼──────────────────┐
          │ Retry original request     │
          │ with new access token      │
          └────────┬───────────────────┘
                   │
                   ▼
          ┌──────────────────┐
          │ Backend response │
          │ (should be 200)  │
          └──────────────────┘
```

---

## 5. POSE ANALYSIS WORKFLOW

```
┌──────────────────────┐
│ User opens Camera    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────┐
│ Initialize CameraX           │
│ Start frame processing loop  │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ For each frame (30 fps):     │
│ 1. Capture frame bitmap      │
│ 2. Send to ML Kit Detector   │
│ 3. Get pose landmarks        │
│ 4. Check confidence > 60%    │
└──────────┬───────────────────┘
           │
       ┌───┴───────────────┐
       │                   │
       ▼ (Confidence OK)    ▼ (Low confidence)
   ┌─────────────┐    ┌──────────────┐
   │ Draw        │    │ Show "Move   │
   │ skeleton    │    │ closer" hint  │
   │ overlay     │    │              │
   └─────┬───────┘    └──────────────┘
         │
         ▼
   ┌──────────────────────────┐
   │ Get current pose:        │
   │ - Calculate joint angles │
   │ - Compare to ideal pose  │
   │ - Generate issues list   │
   └─────────┬────────────────┘
             │
             ▼
   ┌──────────────────────┐
   │ Show live advice:    │
   │ - "Lift chin"        │
   │ - "Relax shoulders"  │
   │ - "Better lighting"  │
   └─────────┬────────────┘
             │
             ▼
   ┌──────────────────────────┐
   │ User taps CAPTURE button │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ Convert bitmap to base64 │
   │ Compress < 5MB           │
   │ Validate MIME type       │
   └──────────┬───────────────┘
              │
              ▼
   ┌──────────────────────────────┐
   │ POST /api/poses/analyze      │
   │ - image (base64)             │
   │ - metadata (device, camera)  │
   │ - Authorization header (JWT) │
   └──────────┬───────────────────┘
              │
   ┌──────────▼──────────────────┐
   │ Backend Processing:         │
   │ 1. Verify JWT signature     │
   │ 2. Rate limit check         │
   │ 3. File validation:         │
   │    - Size < 5MB             │
   │    - MIME type: image/jpeg  │
   │    - Content scan           │
   │ 4. Save to S3 (signed URL)  │
   │ 5. Run advanced ML analysis │
   │ 6. Generate recommendations │
   │ 7. Store in database        │
   └──────────┬──────────────────┘
              │
              ▼
   ┌──────────────────────────────┐
   │ Return analysis results:     │
   │ - score (0-100)              │
   │ - confidence                 │
   │ - keypoints with confidence  │
   │ - recommendations (list)     │
   │ - imageUrl (S3 signed)       │
   │ - createdAt                  │
   └──────────┬──────────────────┘
              │
              ▼
   ┌──────────────────────────┐
   │ Display Analysis Screen: │
   │ - Image with skeleton    │
   │ - Score visualization    │
   │ - Recommendations        │
   │ - Improvement tips       │
   │ - [Retake] [Save]        │
   └──────────┬───────────────┘
              │
          ┌───┴─────────────┐
          │                 │
          ▼ (Save)          ▼ (Retake)
   ┌─────────────┐    ┌──────────────┐
   │ Save to DB: │    │ Go back to   │
   │ - Pose      │    │ Camera       │
   │ - Analysis  │    │              │
   │ - Image URL │    └──────────────┘
   │ Sync to     │
   │ backend     │
   └────────────┘
```

---

## 6. DATA SYNCHRONIZATION FLOW

```
┌──────────────────────┐
│ Network State Check  │
└──────────┬───────────┘
           │
       ┌───┴─────────────────────┐
       │                         │
       ▼ (Online)                ▼ (Offline)
   ┌─────────────┐           ┌──────────────┐
   │ Sync now    │           │ Queue all    │
   │ (immediate) │           │ requests     │
   └─────┬───────┘           │ (local DB)   │
         │                   └──────┬───────┘
         ▼                          │
   ┌─────────────────────────┐     │
   │ For each queued request:│     │
   │ 1. Prepare data         │     │
   │ 2. Serialize to JSON    │     │
   │ 3. Add timestamp        │     │
   │ 4. Add idempotency key  │     │
   └──────────┬──────────────┘     │
              │                    │
              ▼                    │
   ┌──────────────────────────┐   │
   │ POST request to API      │   │
   │ with Authz header        │   │
   └──────────┬───────────────┘   │
              │                   │
         ┌────┴──────────────┐    │
         │                   │    │
         ▼ (Success)         ▼ (Failure)
   ┌─────────────┐      ┌─────────────┐
   │ Save result │      │ Retry with  │
   │ Update DB   │      │ exponential │
   │ Remove from │      │ backoff     │
   │ queue       │      │             │
   └─────┬───────┘      └─────┬───────┘
         │                    │
         ▼                    ▼
   ┌─────────────┐      ┌─────────────┐
   │ Continue    │      │ Check        │
   │ next request│      │ network &    │
   │             │      │ retry later  │
   └─────────────┘      └─────────────┘

Eventually:
┌──────────────────────┐
│ Network restored     │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────┐
│ Fetch queued requests    │
│ from local DB            │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Retry all requests       │
│ in sequence              │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│ Sync complete            │
│ Queue emptied            │
│ Data up to date          │
└──────────────────────────┘
```

---

## 7. SECURITY LAYER ARCHITECTURE

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND SECURITY                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │  Input Validator │      │  Sanitization    │          │
│  │ - Email format   │      │ - No scripts     │          │
│  │ - Password rules │      │ - XSS prevention │          │
│  │ - Length checks  │      │ - Safe HTML only │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Encryption Layer │      │Certificate Pinning
│  │ - EncryptedShared│      │ - Pin backend    │          │
│  │   Preferences    │      │ - Pin backup     │          │
│  │ - AES-256-GCM    │      │ - MITM prevention│          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Token Management │      │Code Integrity    │          │
│  │ - JWT refresh    │      │ - ProGuard obf.  │          │
│  │ - Token rotation │      │ - SafetyNet check│          │
│  │ - Auto-expiry    │      │ - Root detection │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
                             ▲
                             │
                        HTTPS + TLS 1.3
                    Certificate Pinning
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    BACKEND SECURITY                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Rate Limiting    │      │ CORS Control     │          │
│  │ - Login: 5/15min │      │ - Whitelist only │          │
│  │ - API: 100/10min │      │ - No wildcard    │          │
│  │ - Redis backed   │      │ - Explicit hosts │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Authorization    │      │ SQL Injection    │          │
│  │ - RBAC roles     │      │ - Parameterized  │          │
│  │ - JWT verify     │      │ - Prisma ORM     │          │
│  │ - Server-side    │      │ - Input validate │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Error Handling   │      │ Security Headers │          │
│  │ - Generic msgs   │      │ - X-Frame-Options│          │
│  │ - Sentry log     │      │ - HSTS           │          │
│  │ - Never stack    │      │ - CSP            │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Data Protection  │      │ Secrets Mgmt     │          │
│  │ - DB encryption  │      │ - .env only      │          │
│  │ - bcrypt hash    │      │ - git-secrets    │          │
│  │ - Field-level    │      │ - 90-day rotate  │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
                             ▲
                             │
                   WAF + DDoS Protection
                 (Cloudflare Free Tier)
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                 INFRASTRUCTURE SECURITY                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Network Security │      │ Database Security│          │
│  │ - VPC isolation  │      │ - Private subnet │          │
│  │ - Security groups│      │ - Encryption     │          │
│  │ - SSH key only   │      │ - Backups (daily)│          │
│  │ - No public IPs  │      │ - 30-day retain  │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
│  ┌──────────────────┐      ┌──────────────────┐          │
│  │ Monitoring       │      │ Compliance       │          │
│  │ - Sentry errors  │      │ - GDPR ready     │          │
│  │ - CloudWatch     │      │ - CCPA ready     │          │
│  │ - Real-time      │      │ - OWASP Top 10   │          │
│  │   alerts         │      │ - Audit logging  │          │
│  └──────────────────┘      └──────────────────┘          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 8. DATABASE SCHEMA DIAGRAM

```
┌──────────────────────────────────────────────────────────┐
│                      USERS Table                         │
├──────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                            │
│ email (String, UNIQUE, indexed)                          │
│ passwordHash (String, bcrypt)                            │
│ firstName (String)                                       │
│ lastName (String)                                        │
│ avatar (String, URL)                                     │
│ mfaEnabled (Boolean)                                     │
│ mfaSecret (String, encrypted TOTP)                       │
│ role (Enum: USER, PREMIUM, ADMIN)                        │
│ isActive (Boolean)                                       │
│ createdAt (DateTime)                                     │
│ updatedAt (DateTime)                                     │
│ lastLoginAt (DateTime)                                   │
│ deletedAt (DateTime, soft delete)                        │
└────────────────┬─────────────────────────────────────────┘
                 │ 1:Many
                 │ 
┌────────────────▼──────────────────────────────────────────┐
│                    POSES Table                           │
├──────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                            │
│ userId (UUID, FK → Users.id, indexed)                    │
│ imageUrl (String, S3 signed URL)                         │
│ score (Int, 0-100)                                       │
│ confidence (Float, 0-1)                                  │
│ poseType (Enum: standing, sitting, etc)                  │
│ keypoints (JSON, {name, x, y, confidence}[])             │
│ recommendations (JSON, {area, suggestion, priority}[])   │
│ metadata (JSON, {device, camera, timestamp})             │
│ createdAt (DateTime, indexed)                            │
│ updatedAt (DateTime)                                     │
│ deletedAt (DateTime, soft delete)                        │
└────────────────┬──────────────────────────────────────────┘
                 │ Many:1
                 │ 
┌────────────────▼──────────────────────────────────────────┐
│                   SESSIONS Table                         │
├──────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                            │
│ userId (UUID, FK → Users.id, indexed)                    │
│ startTime (DateTime)                                     │
│ endTime (DateTime, nullable)                             │
│ posesCaptured (Int)                                      │
│ averageScore (Float)                                     │
│ createdAt (DateTime, indexed)                            │
│ updatedAt (DateTime)                                     │
│ deletedAt (DateTime, soft delete)                        │
└────────────────────────────────────────────────────────────┘

INDEXES:
├─ users.email (unique)
├─ users.createdAt (for sorting)
├─ poses.userId + createdAt (composite)
├─ poses.poseType (filtering)
├─ sessions.userId + createdAt (composite)
└─ soft_delete fields (for soft deletes)

ENCRYPTION:
├─ Passwords: bcrypt (cost 12)
├─ TOTP secrets: AES-256-GCM
├─ Sensitive fields: Encrypted at DB level
└─ Database: Encryption at rest (RDS encryption)
```

---

## 9. CI/CD PIPELINE FLOW

```
┌─────────────────┐
│ Developer Push  │
│ Code to GitHub  │
└────────┬────────┘
         │
         ▼
┌────────────────────────────┐
│ GitHub Actions Triggered   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Stage 1: Security Scan     │
│ ┌──────────────────────┐   │
│ │ npm audit            │   │
│ │ Snyk scan            │   │
│ │ SAST scan            │   │
│ │ Dependency check     │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ├─ Any vulns? → Stop + Notify
         │
         ▼
┌────────────────────────────┐
│ Stage 2: Build             │
│ ┌──────────────────────┐   │
│ │ npm install          │   │
│ │ npm run build        │   │
│ │ Build Docker image   │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Stage 3: Unit Tests        │
│ ┌──────────────────────┐   │
│ │ npm test             │   │
│ │ Generate coverage    │   │
│ │ Upload to Codecov    │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ├─ <70% coverage? → Notify
         │
         ▼
┌────────────────────────────┐
│ Stage 4: Integration Tests │
│ ┌──────────────────────┐   │
│ │ Start postgres       │   │
│ │ npm run test:e2e     │   │
│ │ API endpoints test   │   │
│ │ Auth flow test       │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Stage 5: Deploy to Staging │
│ ┌──────────────────────┐   │
│ │ Push Docker image    │   │
│ │ Deploy to AWS        │   │
│ │ Run smoke tests      │   │
│ │ Manual QA approval   │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ├─ Approved?
         │
         ▼ Yes
┌────────────────────────────┐
│ Stage 6: Deploy to Prod    │
│ ┌──────────────────────┐   │
│ │ Gradual rollout:     │   │
│ │ - 10% of traffic     │   │
│ │ - Monitor metrics    │   │
│ │ - 50% of traffic     │   │
│ │ - 100% of traffic    │   │
│ │ Blue-green deploy    │   │
│ └──────────────────────┘   │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────────┐
│ Monitor & Alert            │
│ ┌──────────────────────┐   │
│ │ Sentry monitoring    │   │
│ │ CloudWatch metrics   │   │
│ │ Error rate tracking  │   │
│ │ Performance checks   │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

---

## 10. DEPLOYMENT ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│                     INTERNET / DNS                           │
└──────────────────────────┬─────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
    │ Cloudflare  │   │ DNS Records │   │ SSL/TLS Cert │
    │ CDN + WAF   │   │             │   │ (CloudFlare) │
    │ - DDoS      │   │ api.example │   │              │
    │ - Bot       │   │ .com        │   │              │
    └──────┬──────┘   └─────────────┘   └──────────────┘
           │
           ▼
    ┌─────────────────────────────────┐
    │ Load Balancer / API Gateway     │
    │ (Optional - for auto-scaling)   │
    └──────────┬──────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
   ┌──────────┐    ┌──────────┐
   │Container │    │Container │
   │ Instance │    │ Instance │
   │  (Node)  │    │  (Node)  │
   └────┬─────┘    └────┬─────┘
        │               │
        └───────┬───────┘
                │
                ▼
    ┌──────────────────────┐
    │ Service Mesh         │
    │ (Optional)           │
    └──────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌─────────────────┐   ┌──────────────────┐
│ PostgreSQL RDS  │   │ Redis Cache      │
│ (Encrypted at   │   │ (Session data,   │
│  rest + backups)│   │  rate limit)     │
└─────────────────┘   └──────────────────┘
    │                       │
    └───────────┬───────────┘
                │
    ┌───────────▼──────────────┐
    │ AWS S3 (Image Storage)   │
    │ - Encrypted at rest      │
    │ - CloudFront CDN         │
    │ - Signed URLs (time limit│
    └──────────────────────────┘

MONITORING STACK:
┌─────────────────┐
│ Sentry (Errors) │
└─────────────────┘
        │
┌───────┼────────┐
│       │        │
▼       ▼        ▼
CloudWatch   DataDog   Prometheus
(Metrics)    (APM)     (Optional)
```

---

## Summary

All 10 diagrams show:
- ✅ Complete system architecture
- ✅ 3-layer Android app structure
- ✅ Authentication & token flow
- ✅ Pose analysis workflow
- ✅ Data synchronization
- ✅ Security layers
- ✅ Database schema
- ✅ CI/CD pipeline
- ✅ Production deployment
- ✅ Integration points

**Use these as reference when reviewing generated code and architecture!**
