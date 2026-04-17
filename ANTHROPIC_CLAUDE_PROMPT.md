# Anthropic Claude Prompt - AI Pose Recommendation Android App

## USE THIS PROMPT WITH CLAUDE API OR CLAUDE DESKTOP

---

## SYSTEM PROMPT (For Code Generation)

You are an expert Android developer with deep expertise in:
- Kotlin, Jetpack Compose, and modern Android architecture
- Security best practices (OWASP, PCI-DSS, encryption)
- Machine Learning integration (TensorFlow Lite, Google ML Kit)
- Backend API design (Node.js, Express, JWT authentication)
- Enterprise-grade mobile applications

You will generate production-ready code following:
- Clean Architecture (Presentation → Domain → Data layers)
- SOLID principles
- Material Design 3 guidelines
- Industry security standards

---

## USER PROMPT (Copy & Paste This)

```
You are building a production-grade Android app called "AI Pose Aid" - 
an AI-powered photography guide that provides real-time pose recommendations.

REQUIREMENTS:

### 1. ARCHITECTURE & SETUP
- Target: Android 8.0+ (API 26)
- Language: Kotlin
- UI: Jetpack Compose
- Build System: Gradle (Kotlin DSL)
- Pattern: Clean Architecture (MVVM + Repository)
- DI: Hilt

### 2. CORE FEATURES
1. User Authentication
   - Email/password login & registration
   - JWT tokens (access + refresh)
   - MFA support (TOTP)
   - Password hashing: bcrypt
   - Rate limiting on login

2. Camera & Pose Detection
   - Real-time camera preview (CameraX)
   - Google ML Kit Pose Detection
   - Live skeleton overlay
   - Pose recommendation suggestions
   - Confidence scoring

3. Image Analysis
   - Capture and analyze poses
   - Skeleton keypoint detection
   - Pose scoring (0-100)
   - Improvement suggestions
   - History tracking

4. User Profile
   - Profile management
   - Statistics dashboard
   - Settings & preferences
   - Security settings
   - Logout

### 3. SECURITY (EXPERT LEVEL)
- **Frontend Security:**
  * No API keys hardcoded
  * JWT tokens in EncryptedSharedPreferences (HttpOnly equivalent)
  * Input validation & sanitization
  * Certificate pinning
  * Secure interceptors (auth, token refresh, error handling)
  * ProGuard obfuscation
  * Code integrity checks

- **Backend Security:**
  * All endpoints require authentication
  * Authorization on backend (not frontend)
  * Parameterized queries (Prisma ORM)
  * Rate limiting (express-rate-limit)
  * CORS with explicit whitelist (no wildcard)
  * Helmet.js security headers
  * CSRF protection
  * Generic error messages only
  * File upload validation (size, MIME type)
  * Dependency scanning

- **Authentication:**
  * Use NextAuth.js or Supabase Auth (proven, audited)
  * Access Token: 15-minute expiry
  * Refresh Token: 30-day expiry, stored in HttpOnly cookie
  * Password hashing: bcrypt (cost 12)
  * MFA: TOTP (Google Authenticator)
  * RBAC: Role-based access control

- **Secrets Management:**
  * All secrets in .env (never hardcoded)
  * .env in .gitignore
  * git-secrets pre-commit hook
  * Environment-specific secrets (.env.dev, .env.prod)
  * Secrets rotated every 90 days

### 4. DATA STRUCTURES

#### User Entity
- id (UUID)
- email (unique, indexed)
- passwordHash (bcrypt)
- firstName, lastName
- avatar (S3 URL)
- mfaEnabled (boolean)
- mfaSecret (encrypted TOTP secret)
- role (USER, PREMIUM_USER, ADMIN)
- createdAt, updatedAt
- lastLoginAt
- isActive

#### Pose Entity
- id (UUID)
- userId (foreign key)
- imageUrl (S3 signed URL)
- score (0-100 integer)
- confidence (0-1 decimal)
- poseType (enum: standing, sitting, lying, etc)
- keypoints (JSON: [{"name": "nose", "x": 0.5, "y": 0.3, "confidence": 0.95}])
- recommendations (JSON: [{"area": "shoulders", "suggestion": "...", "priority": "high"}])
- metadata (JSON: {deviceModel, cameraFacing, timestamp})
- createdAt

#### Session Entity
- id (UUID)
- userId (foreign key)
- startTime
- endTime
- posesCaptured (count)
- averageScore (decimal)
- createdAt

### 5. API ENDPOINTS (Backend)

Authentication:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/auth/mfa/setup
- POST /api/auth/mfa/verify

Poses:
- POST /api/poses/analyze (with image upload)
- GET /api/poses/history (paginated)
- GET /api/poses/{id}
- DELETE /api/poses/{id}

Users:
- GET /api/users/me
- PUT /api/users/me
- POST /api/users/me/avatar
- GET /api/users/me/stats
- POST /api/users/me/change-password

### 6. UI/UX SCREENS

1. Splash Screen (2-3 sec) → check token validity
2. Login Screen → email, password, register/forgot password links
3. Register Screen → email, password (validated), name fields
4. Home/Dashboard → recent sessions, quick stats, "Start Camera" button
5. Camera Screen → live preview, skeleton overlay, recommendations, capture button
6. Analysis Screen → results, skeleton, score, suggestions, retake/save/share buttons
7. Results Screen → detailed analysis, improvements, history
8. Profile Screen → avatar, stats, settings, logout
9. Settings Screen → notifications, security, about
10. History Screen → paginated list of past poses

### 7. SECURITY TESTS REQUIRED
- Unit tests: Auth, validation, encryption
- Integration tests: API calls, token refresh, rate limiting
- Security tests: SQL injection prevention, XSS prevention, CSRF, authorization

### 8. BUILD CONFIGURATION
- buildFeatures.compose = true
- compileOptions.targetCompatibility = JavaVersion.VERSION_11
- kotlinOptions.jvmTarget = "11"
- ProGuard enabled with security rules
- Manifest: Camera + Storage permissions with rationale

### 9. KEY LIBRARIES
dependencies {
    // Core Android
    implementation("androidx.core:core:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.compose.ui:ui:1.6.0")
    implementation("androidx.compose.material3:material3:1.2.0")
    implementation("androidx.activity:activity-compose:1.8.1")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.7")
    
    // Jetpack Libraries
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    
    // Hilt (DI)
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-compiler:2.50")
    
    // Network
    implementation("com.squareup.retrofit2:retrofit:2.10.0")
    implementation("com.squareup.retrofit2:converter-gson:2.10.0")
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.11.0")
    
    // Security
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("at.fasterxml.jackson.module:jackson-module-kotlin:2.16.1")
    
    // ML Kit
    implementation("com.google.mlkit:pose-detection:18.0.0-beta3")
    
    // Camera
    implementation("androidx.camera:camera-core:1.3.1")
    implementation("androidx.camera:camera-camera2:1.3.1")
    implementation("androidx.camera:camera-lifecycle:1.3.1")
    implementation("androidx.camera:camera-view:1.3.1")
    
    // Logging
    implementation("com.jakewharton.timber:timber:5.0.1")
    
    // Error Monitoring
    implementation("io.sentry:sentry-android:7.8.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4:1.6.0")
}

### 10. DELIVERABLES

Generate complete production-ready code for:

1. Android Module Structure
   - Complete Kotlin files for all layers
   - Gradle configuration with all dependencies
   - ProGuard rules for obfuscation
   - AndroidManifest.xml with permissions

2. Authentication System
   - LoginViewModel + LoginScreen (Compose)
   - RegisterViewModel + RegisterScreen
   - Token management with refresh logic
   - Secure storage using EncryptedSharedPreferences
   - MFA setup flow

3. Camera & ML Integration
   - CameraScreen with CameraX
   - Real-time pose detection using ML Kit
   - Skeleton overlay (custom Compose drawable)
   - Confidence scoring logic

4. Backend (Node.js + Express)
   - User authentication endpoints
   - Pose analysis endpoint
   - Rate limiting middleware
   - Error handling
   - CORS configuration
   - Helmet.js security setup

5. Database Layer
   - Room entities and DAOs
   - Encrypted local storage
   - Sync logic for offline capability

6. API Integration
   - Retrofit service with interceptors
   - Token refresh interceptor
   - Certificate pinning
   - Error handling

7. Security Implementation
   - Input validation utilities
   - Encryption/decryption helpers
   - Code integrity checker
   - Root detection
   - Device security verification

8. Tests
   - Unit tests for auth, validation, encryption
   - Integration tests for API calls
   - Security tests for vulnerabilities

### 11. CODE STYLE & BEST PRACTICES
- Kotlin idioms (extension functions, sealed classes, coroutines)
- Immutability where possible
- No null references (use Result<T>, Option<T>)
- Comprehensive error handling
- Proper logging (not logging sensitive data)
- Documentation comments on public APIs
- No hardcoded strings (use strings.xml)

### 12. IMPORTANT SECURITY REMINDERS
- NEVER commit .env file
- NEVER store passwords in logs
- NEVER expose stack traces to clients
- NEVER hardcode API keys
- ALWAYS validate input on backend
- ALWAYS check authorization server-side
- ALWAYS use HTTPS in production
- ALWAYS encrypt sensitive data at rest
- ALWAYS hash passwords with bcrypt
- ALWAYS implement rate limiting

Generate the complete, production-ready implementation now. Start with the most critical components:

1. AndroidManifest.xml
2. Gradle files (build.gradle.kts)
3. Security classes (Encryption, TokenManager)
4. Authentication screens & ViewModels
5. Camera screen & ML integration
6. Backend API setup
7. Database entities & DAOs
8. Network interceptors
9. UI components & themes
10. Tests

For each file, include:
- Complete, compilable code
- Proper error handling
- Comprehensive comments
- Security annotations
- Type safety
- Null safety

DO NOT provide pseudocode, explanations, or partial implementations.
Provide ONLY production-grade, ready-to-use code.
```

---

## HOW TO USE THIS PROMPT

### Option 1: Claude.ai Web
1. Go to https://claude.ai
2. Copy the entire **USER PROMPT** section above
3. Paste into the chat
4. Wait for Claude to generate all code files
5. Create new files for each deliverable

### Option 2: Claude Desktop App
1. Install Claude Desktop from Anthropic
2. Open a new conversation
3. Paste the system prompt as context
4. Then paste the user prompt
5. Files will be generated in the Chat interface
6. Download/save all generated files

### Option 3: Claude API (Programmatic)
```bash
curl https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 16000,
    "system": "[SYSTEM PROMPT HERE]",
    "messages": [
      {
        "role": "user",
        "content": "[USER PROMPT HERE]"
      }
    ]
  }'
```

### Option 4: Python Client
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.messages.create(
    model="claude-opus-4-6",
    max_tokens=16000,
    system="[SYSTEM PROMPT]",
    messages=[
        {
            "role": "user",
            "content": "[USER PROMPT]"
        }
    ]
)

print(response.content[0].text)
```

---

## EXPECTED OUTPUT

Claude will generate:

### Kotlin Files (Android)
- `MainActivity.kt` - App entry point
- `di/AppModule.kt` - Dependency injection
- `data/local/AppDatabase.kt` - Room database
- `data/remote/ApiService.kt` - Retrofit interface
- `data/repository/AuthRepository.kt` - Auth logic
- `presentation/screens/LoginScreen.kt` - Login UI
- `presentation/screens/CameraScreen.kt` - Camera UI
- `ml/PoseDetectionModel.kt` - ML integration
- `security/*.kt` - All security classes
- `build.gradle.kts` - Complete dependencies
- `AndroidManifest.xml` - Permissions & manifest

### Node.js Backend Files
- `server.js` - Express setup
- `routes/auth.js` - Auth endpoints
- `routes/poses.js` - Pose endpoints
- `middleware/auth.js` - JWT middleware
- `middleware/rateLimit.js` - Rate limiting
- `controllers/authController.js` - Auth logic
- `models/User.js` - Prisma schema
- `.env.example` - Secrets template
- `docker-compose.yml` - Docker setup

### Test Files
- `AuthRepositoryTest.kt` - Auth tests
- `SecurityTest.kt` - Security tests
- `ValidationTest.kt` - Input validation tests

### Configuration Files
- `proguard-rules.pro` - ProGuard obfuscation
- `strings.xml` - App strings
- `colors.xml` - Design system colors
- `build.gradle.kts` - All dependencies

---

## TIPS FOR BEST RESULTS

1. **Break it into chunks** - If token limit hit, ask for "Part 2: Backend implementation"
2. **Request code review** - Ask Claude to "Review this code for security vulnerabilities"
3. **Ask for tests** - "Generate comprehensive test suite for authentication"
4. **Ask for deployment** - "Create Docker & GitHub Actions CI/CD pipeline"
5. **Ask for documentation** - "Generate API documentation and setup guide"

---

## FOLLOW-UP PROMPTS

After Claude generates code, ask:

```
1. "Add Sentry error monitoring to all screens"
2. "Implement offline-first synchronization"
3. "Add biometric authentication (fingerprint)"
4. "Create payment integration with Stripe"
5. "Generate comprehensive API documentation"
6. "Create deployment guide for Firebase/AWS"
7. "Add analytics tracking (Firebase/Mixpanel)"
8. "Implement image caching strategy"
9. "Add push notifications support"
10. "Create admin dashboard for user management"
```

---

## IMPORTANT NOTES

✅ **What This Gives You:**
- Production-ready code
- Security best practices implemented
- Complete architecture
- All layers (UI, Domain, Data)
- Proper error handling
- Comprehensive tests
- Deployment setup

❌ **What You Still Need:**
- API keys (Stripe, AWS, etc.) - get from respective services
- SSL certificates - generate from Let's Encrypt
- Database setup - provision PostgreSQL
- Secrets rotation - setup 90-day rotation
- Monitoring alerts - configure Sentry/CloudWatch
- Compliance review - with legal team

---

## SUPPORT

If Claude generates incomplete code:
1. Ask: "Complete the [ClassName] implementation"
2. Ask: "Add error handling to this function"
3. Ask: "Generate unit tests for this"
4. Provide context: "This is for Android, using Compose"

Good luck! 🚀
