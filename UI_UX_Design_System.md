# AI Pose Aid - Complete UI/UX Design System & Wireframes

## 1. DESIGN SYSTEM

### 1.1 Color Palette

```
PRIMARY COLORS:
├─ Primary Blue: #0066FF
│  └─ Used for: CTA buttons, links, highlights, brand elements
├─ Primary Teal: #00CC99
│  └─ Used for: Success states, approved poses, achievements
├─ Warning Orange: #FF9500
│  └─ Used for: Warnings, needs improvement
└─ Error Red: #FF3333
   └─ Used for: Errors, critical issues, rejected poses

NEUTRAL COLORS:
├─ Dark Background: #1A1A2E (surface)
├─ Light Background: #FFFFFF (cards, content)
├─ Dark Text: #0F0F23 (primary text)
├─ Medium Gray: #666666 (secondary text)
├─ Light Gray: #E8E8E8 (dividers, borders)
└─ Very Light Gray: #F5F5F5 (subtle backgrounds)

SEMANTIC COLORS:
├─ Success: #00CC99 (confidence > 85%)
├─ Warning: #FF9500 (confidence 60-85%)
├─ Danger: #FF3333 (confidence < 60%)
└─ Info: #0066FF (general information)
```

### 1.2 Typography

```
HEADING HIERARCHY:
├─ H1 (App Title)
│  ├─ Font: Roboto Bold
│  ├─ Size: 32sp
│  ├─ Line Height: 40sp
│  ├─ Weight: 700
│  └─ Color: #0F0F23
│
├─ H2 (Screen Title)
│  ├─ Font: Roboto Bold
│  ├─ Size: 24sp
│  ├─ Line Height: 32sp
│  ├─ Weight: 700
│  └─ Color: #0F0F23
│
├─ H3 (Section Header)
│  ├─ Font: Roboto SemiBold
│  ├─ Size: 18sp
│  ├─ Line Height: 24sp
│  ├─ Weight: 600
│  └─ Color: #0F0F23
│
├─ Body (Main Content)
│  ├─ Font: Roboto Regular
│  ├─ Size: 14sp
│  ├─ Line Height: 20sp
│  ├─ Weight: 400
│  └─ Color: #0F0F23
│
├─ Caption (Helper Text)
│  ├─ Font: Roboto Regular
│  ├─ Size: 12sp
│  ├─ Line Height: 16sp
│  ├─ Weight: 400
│  └─ Color: #666666
│
└─ Label (Form Labels)
   ├─ Font: Roboto Medium
   ├─ Size: 12sp
   ├─ Line Height: 16sp
   ├─ Weight: 500
   └─ Color: #0F0F23
```

### 1.3 Spacing System

```
8dp grid system:
├─ XSmall (xs): 4dp
├─ Small (sm): 8dp
├─ Medium (md): 16dp
├─ Large (lg): 24dp
├─ XLarge (xl): 32dp
└─ XXLarge (xxl): 48dp

Common Spacing Usage:
├─ Screen padding: 16dp
├─ Card padding: 16dp
├─ Button padding: 12dp (vertical) × 16dp (horizontal)
├─ Input field padding: 12dp (vertical) × 16dp (horizontal)
└─ Component gap: 8dp
```

### 1.4 Corner Radius

```
├─ Small: 4dp (subtle elements)
├─ Medium: 8dp (buttons, inputs)
├─ Large: 12dp (cards, containers)
└─ Round: 50% (avatars, badges)
```

### 1.5 Elevation & Shadows

```
Card Shadow:
├─ Elevation: 2dp
├─ Color: rgba(0, 0, 0, 0.1)
└─ Used for: Cards, containers

Button Shadow:
├─ Elevation: 4dp (default)
├─ Elevation: 8dp (pressed)
└─ Used for: CTA buttons

Modal Shadow:
├─ Elevation: 24dp
├─ Color: rgba(0, 0, 0, 0.3)
└─ Used for: Dialogs, modals
```

---

## 2. COMPONENT LIBRARY

### 2.1 Buttons

#### Primary Button
```
┌─────────────────────────┐
│  SIGN IN                │
└─────────────────────────┘

Styling:
├─ Background: #0066FF
├─ Text: White, 14sp, Bold
├─ Padding: 12dp (V) × 16dp (H)
├─ Corner: 8dp
├─ Min Width: 88dp
├─ Height: 48dp
├─ State:
│  ├─ Default: #0066FF
│  ├─ Pressed: #0052CC (darker)
│  ├─ Disabled: #CCCCCC
│  └─ Loading: Spinner animation
└─ Elevation: 4dp → 8dp (pressed)
```

#### Secondary Button
```
┌─────────────────────────┐
│ CREATE ACCOUNT          │
└─────────────────────────┘

Styling:
├─ Background: Transparent
├─ Border: 2dp solid #0066FF
├─ Text: #0066FF, 14sp, Bold
├─ Padding: 12dp (V) × 16dp (H)
├─ Corner: 8dp
└─ State:
   ├─ Default: Transparent
   └─ Pressed: #F0F7FF (light background)
```

#### Icon Button
```
┌────┐
│ ⋮  │
└────┘

Styling:
├─ Size: 48dp × 48dp
├─ Icon: 24dp, centered
├─ Background: Transparent
├─ Ripple: true
└─ State:
   ├─ Default: Transparent
   └─ Pressed: rgba(0, 0, 0, 0.08)
```

### 2.2 Input Fields

#### Email Input
```
╔════════════════════════╗
║ Email Address          ║
║ ╞──────────────────────╡
║ john@example.com       ║
╚════════════════════════╝

Styling:
├─ Background: #F5F5F5
├─ Border: 1dp solid #E8E8E8
├─ Focus Border: 2dp solid #0066FF
├─ Padding: 12dp (V) × 16dp (H)
├─ Height: 56dp
├─ Corner: 8dp
├─ Helper Text: 12sp, #666666 (below)
└─ Error Text: 12sp, #FF3333 (below)
```

#### Password Input
```
╔════════════════════════╗
║ Password               ║
║ ╞──────────────────────╡
║ ••••••••••••••         ║
║                      [👁] ║
╚════════════════════════╝

Styling:
├─ Same as Email Input
├─ End Icon: Eye toggle (show/hide)
├─ Icon Size: 24dp
└─ Icon Color: #666666
```

#### Text Area
```
╔════════════════════════╗
║ Additional Notes       ║
║ ╞──────────────────────╡
║ Enter your feedback... ║
║                        ║
║                        ║
╚════════════════════════╝

Styling:
├─ Min Height: 120dp
├─ Max Height: 250dp
├─ Same styling as input
├─ Scrollable
└─ Character count: Optional
```

### 2.3 Cards

#### Pose History Card
```
┌─────────────────────────────┐
│                             │
│  ┌──────────────────────┐  │
│  │   THUMBNAIL          │  │
│  │   (Image Preview)    │  │
│  └──────────────────────┘  │
│                             │
│  Score: 87/100            │
│  Standing Pose             │
│  Jan 1, 2024 • 2:30 PM   │
│                             │
│  ┌─────────┬──────────┐    │
│  │ DETAILS │ RETAKE   │    │
│  └─────────┴──────────┘    │
│                             │
└─────────────────────────────┘

Styling:
├─ Background: #FFFFFF
├─ Padding: 16dp
├─ Corner: 12dp
├─ Shadow: 2dp
├─ Border: 1dp solid #E8E8E8
└─ Spacing: 8dp between elements
```

#### Recommendation Card
```
┌─────────────────────────────┐
│ ⚠️  Needs Improvement       │
│                             │
│ Shoulders                   │
│ Relax your shoulders        │
│                             │
│ Priority: Medium            │
│ Impact: +5% improvement     │
│                             │
│      [LEARN MORE]           │
└─────────────────────────────┘

Styling:
├─ Background: #FFF8F0
├─ Border-left: 4dp solid #FF9500
├─ Padding: 16dp
├─ Corner: 8dp
└─ Icon: 24dp, #FF9500
```

### 2.4 Progress Indicators

#### Score Progress Bar
```
Score: 87/100
████████░░ 87%

Styling:
├─ Height: 8dp
├─ Corner: 4dp
├─ Background: #E8E8E8
├─ Foreground: Gradient
│  ├─ 0-60%: #FF3333 (red)
│  ├─ 60-85%: #FF9500 (orange)
│  └─ 85-100%: #00CC99 (green)
└─ Animation: Smooth on update (300ms)
```

#### Confidence Indicator
```
Confidence: 95%
●●●●●●●●●● (10 dots)

Or Radial:
        95%
     ╱─────╲
    │       │
    │ POSE  │
    │       │
     ╲─────╱
        HIGH
        CONFIDENCE

Styling:
├─ Dot Color: #0066FF (filled), #E8E8E8 (empty)
├─ Dot Size: 6dp
├─ Gap: 4dp
└─ Text: 12sp, #0066FF
```

### 2.5 Navigation Components

#### Bottom Navigation
```
┌──────────────────────────┐
│                          │
│                          │
│  [Camera] [Home] [More]  │
│   (active)               │
└──────────────────────────┘

Styling:
├─ Background: #FFFFFF
├─ Height: 64dp (with padding)
├─ Border-top: 1dp solid #E8E8E8
├─ Icon Size: 24dp
├─ Label Size: 12sp
├─ Selected: 
│  ├─ Icon Color: #0066FF
│  └─ Label Color: #0066FF
├─ Unselected:
│  ├─ Icon Color: #999999
│  └─ Label Color: #999999
└─ Ripple: rgba(0, 102, 255, 0.1)
```

#### Top App Bar
```
┌──────────────────────────┐
│ ← | Camera Settings | ⋮  │
└──────────────────────────┘

Styling:
├─ Height: 56dp
├─ Background: #FFFFFF
├─ Border-bottom: 1dp solid #E8E8E8
├─ Padding: 16dp
├─ Title: H2 (24sp, Bold)
├─ Leading Icon: 24dp, clickable
├─ Trailing Icon(s): 24dp, clickable
└─ Elevation: 2dp
```

---

## 3. COMPLETE SCREEN WIREFRAMES

### Screen 1: Splash Screen (2-3 seconds)

```
┌──────────────────────────┐
│                          │
│                          │
│                          │
│                          │
│      AI POSE AID         │
│    Photography Guide     │
│                          │
│                          │
│       [Loading...]       │
│      ━━ ∘ ∘ ∘ ━━       │
│                          │
│                          │
│                          │
│                          │
│                          │
└──────────────────────────┘

Flow:
- Check if token exists & is valid
- If valid → Navigate to Home
- If invalid/expired → Navigate to Login
- Refresh token if needed
- Load initial data in background
```

### Screen 2: Login Screen

```
┌──────────────────────────┐
│                          │
│                          │
│    AI POSE AID           │
│  Photography Guide       │
│                          │
│  ┌────────────────────┐  │
│  │ Email Address      │  │
│  │ john@example.com   │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │ Password           │  │
│  │ ••••••••••••••  [👁]│  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  SIGN IN           │  │
│  └────────────────────┘  │
│                          │
│  [ ] Remember me         │
│  Forgot password?        │
│                          │
│  Don't have account?     │
│  ┌────────────────────┐  │
│  │ CREATE ACCOUNT     │  │
│  └────────────────────┘  │
│                          │
└──────────────────────────┘

Interactions:
- Email field: Validate format in real-time
- Password field: Toggle show/hide
- Sign In: Validate both fields, show loading spinner
- Create Account: Navigate to Register
- Forgot Password: Navigate to reset flow
- Remember Me: Save email for next login
```

### Screen 3: Camera Screen (Live Pose Detection)

```
┌──────────────────────────┐
│ ← | Camera | ⋮           │
├──────────────────────────┤
│  ╔══════════════════════╗│
│  ║                      ║│
│  ║   LIVE CAMERA FEED   ║│
│  ║  (with skeleton      ║│
│  ║   overlay in real    ║│
│  ║   time)              ║│
│  ║                      ║│
│  ║      ○ (head)        ║│
│  ║     /│\  (arms)      ║│
│  ║    / │ \             ║│
│  ║      / \  (legs)     ║│
│  ║     /   \            ║│
│  ║                      ║│
│  ╚══════════════════════╝│
│                          │
│  ┌────────────────────┐  │
│  │ Current: Standing  │  │
│  │ Confidence: 92%    │  │
│  │                    │  │
│  │ RECOMMENDATIONS:   │  │
│  │ ✓ Head aligned     │  │
│  │ ~ Shoulders level  │  │
│  │ ✗ Lift chin up     │  │
│  └────────────────────┘  │
│                          │
│      [      CAPTURE      ]  │
│                          │
│ Lighting: Good           │
│ Background: OK           │
│                          │
│    [Flip] [Flash] [Opt.]│
│                          │
└──────────────────────────┘

Components:
- Camera preview: Full screen
- Skeleton overlay: Real-time pose keypoints
- Pose type badge: Current pose detected
- Confidence: Real-time score
- Live recommendations: 3 key suggestions
- Status indicators: Lighting, background quality
- Control buttons: Flip camera, flash, settings
- Capture button: Center, prominent
```

### Screen 4: Analysis Screen (Post-Capture)

```
┌──────────────────────────┐
│ ← | Analysis | ⋮         │
├──────────────────────────┤
│                          │
│  ┌────────────────────┐  │
│  │   CAPTURED IMAGE   │  │
│  │  (with skeleton)   │  │
│  │                    │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │  SCORE: 87/100    │  │
│  │  ████████░░       │  │
│  │                    │  │
│  │  Category:        │  │
│  │  Standing Pose    │  │
│  │                    │  │
│  │  Confidence:      │  │
│  │  ●●●●●●●●●  95%  │  │
│  └────────────────────┘  │
│                          │
│  JOINT ANALYSIS:        │
│  ┌────────────────────┐  │
│  │ Head: Excellent   │  │
│  │ Shoulders: Good   │  │
│  │ Posture: Great    │  │
│  │ Legs: Good        │  │
│  └────────────────────┘  │
│                          │
│  SUGGESTIONS:           │
│  ┌────────────────────┐  │
│  │ 1. Relax shoulders│  │
│  │    (Priority: HIGH)│  │
│  │                    │  │
│  │ 2. Tilt head left │  │
│  │    (Priority: MED) │  │
│  │                    │  │
│  │ 3. Better lighting│  │
│  │    (Priority: LOW) │  │
│  └────────────────────┘  │
│                          │
│  [RETAKE] [SAVE] [SHARE]│
│                          │
└──────────────────────────┘

Features:
- Image preview with skeleton overlay
- Large score display with progress bar
- Joint-by-joint analysis
- Actionable suggestions with priority
- Action buttons at bottom
- Smooth animations for transitions
```

### Screen 5: Home/Dashboard Screen

```
┌──────────────────────────┐
│ ← | AI Pose Aid | ⊙      │
├──────────────────────────┤
│                          │
│ ┌────────────────────┐   │
│ │ Welcome, John!     │   │
│ │ Ready to capture?  │   │
│ │                    │   │
│ │  [START CAMERA]    │   │
│ └────────────────────┘   │
│                          │
│ TODAY'S STATS:           │
│ ┌────────────────────┐   │
│ │ Poses: 5           │   │
│ │ Avg Score: 84%     │   │
│ │ Time: 15 min       │   │
│ └────────────────────┘   │
│                          │
│ THIS WEEK:               │
│ ┌────────────────────┐   │
│ │ ████░░░░░  +12%   │   │
│ │ Improvement        │   │
│ └────────────────────┘   │
│                          │
│ RECENT SESSIONS:        │
│ ┌────────────────────┐   │
│ │ Jan 1 • 2:30 PM   │   │
│ │ Score: 87 | 5 poses│   │
│ │ [Thumbnail] [>]    │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ Dec 31 • 1:15 PM  │   │
│ │ Score: 82 | 3 poses│   │
│ │ [Thumbnail] [>]    │   │
│ └────────────────────┘   │
│                          │
│ [Camera] [Home] [More]   │
└──────────────────────────┘
```

### Screen 6: History Screen

```
┌──────────────────────────┐
│ ← | Pose History | ⋮     │
├──────────────────────────┤
│                          │
│ Filter: [All] [Week] [Month]
│ Sort: [Recent] [Highest]│
│                          │
│ JAN 1, 2024              │
│ ┌────────────────────┐   │
│ │ 2:30 PM • Score 89│   │
│ │ Standing | [>]    │   │
│ │ [Thumbnail image] │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ 1:15 PM • Score 87│   │
│ │ Sitting | [>]     │   │
│ │ [Thumbnail image] │   │
│ └────────────────────┘   │
│                          │
│ ┌────────────────────┐   │
│ │ 12:45 PM • Score 92   │
│ │ Standing | [>]    │   │
│ │ [Thumbnail image] │   │
│ └────────────────────┘   │
│                          │
│ DEC 31, 2023             │
│ ┌────────────────────┐   │
│ │ 3:20 PM • Score 81│   │
│ │ Sitting | [>]     │   │
│ │ [Thumbnail image] │   │
│ └────────────────────┘   │
│                          │
│ [Camera] [Home] [More]   │
└──────────────────────────┘
```

### Screen 7: Profile Screen

```
┌──────────────────────────┐
│ ← | Profile | ⋮          │
├──────────────────────────┤
│                          │
│      ┌──────────────┐    │
│      │  [Avatar]    │    │
│      │              │    │
│      │   John Doe   │    │
│      │ john@eml.com│    │
│      │              │    │
│      │  [EDIT]      │    │
│      └──────────────┘    │
│                          │
│ STATISTICS:              │
│ ┌────────────────────┐   │
│ │ Sessions: 24       │   │
│ │ Total Poses: 156   │   │
│ │ Avg Score: 84.5%   │   │
│ │ This Week: ↑ 5.2%  │   │
│ └────────────────────┘   │
│                          │
│ ACCOUNT SETTINGS:        │
│ ┌──────────────────────┐ │
│ │ [▶] Edit Profile     │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] Notifications    │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] Security         │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] Privacy Policy   │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] About            │ │
│ └──────────────────────┘ │
│                          │
│        [LOGOUT]          │
│                          │
│ [Camera] [Home] [More]   │
└──────────────────────────┘
```

### Screen 8: Settings/Security Screen

```
┌──────────────────────────┐
│ ← | Security Settings │ ⋮│
├──────────────────────────┤
│                          │
│ AUTHENTICATION:          │
│ ┌──────────────────────┐ │
│ │ [▶] Change Password  │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [Toggle] 2FA         │ │
│ │ Multi-Factor Auth    │ │
│ │ STATUS: DISABLED     │ │
│ └──────────────────────┘ │
│                          │
│ PRIVACY:                 │
│ ┌──────────────────────┐ │
│ │ [Toggle] Share Stats │ │
│ │ Allow analytics      │ │
│ │ STATUS: ENABLED      │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [Toggle] Location    │ │
│ │ Use location data    │ │
│ │ STATUS: DISABLED     │ │
│ └──────────────────────┘ │
│                          │
│ DATA MANAGEMENT:         │
│ ┌──────────────────────┐ │
│ │ [▶] Export Data      │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] Delete Account   │ │
│ └──────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ [▶] View Logs        │ │
│ └──────────────────────┘ │
│                          │
└──────────────────────────┘
```

---

## 4. ANIMATIONS & TRANSITIONS

### 4.1 Screen Transitions
- Login → Home: Fade + Slide Up (300ms)
- Home → Camera: Slide In (200ms)
- Capture → Analysis: Scale + Fade (400ms)
- Results → Home: Slide Down (300ms)

### 4.2 Loading States
```
Spinner Animation:
  Loading...
  ━━ ∘ ∘ ∘ ━━
  ━ ∘ ∘ ∘ ━━  (rotating)
  ━ ∘ ∘ ∘ ━━

Duration: 1.5 seconds per rotation
Easing: LinearInterpolator
```

### 4.3 Score Reveal
```
87/100
████████░░

Animation:
1. Score counts up: 0 → 87 (1 second)
2. Progress bar fills: 0 → 87% (1 second)
3. Color transition based on score:
   - Red → Orange → Green
   - Over same duration
```

### 4.4 Skeleton Overlay
```
When pose detected:
1. Fade in skeleton: 200ms
2. Draw joints in sequence: 300ms
3. Draw connections: 200ms
4. Pulse animation (continuous): Scale 0.95 → 1.0 (1 second)

Color:
- Confidence > 85%: Green (#00CC99)
- Confidence 60-85%: Orange (#FF9500)
- Confidence < 60%: Red (#FF3333)
```

---

## 5. INTERACTION PATTERNS

### 5.1 Form Validation

```
Email Input:
1. Typing → No validation (just capture)
2. Focus Loss → Validate format
   ├─ Invalid: Show red border + error text
   ├─ Valid: Show green checkmark
3. Submit → All fields validated
   ├─ Any invalid: Scroll to first error
   ├─ All valid: Submit

Real-time helpers:
├─ Email: Shows if valid format
├─ Password: Shows strength meter
│  ├─ 0-6 chars: Weak (red)
│  ├─ 7-11 chars: Fair (orange)
│  ├─ 12+ with mixed: Strong (green)
└─ Both fields filled: Enable button
```

### 5.2 Camera Controls

```
Tap camera preview:
- Focus on touched point
- Show focus ring animation (300ms)
- Auto-refocus after 5 seconds

Pinch to zoom:
- Zoom from 1x to 4x
- Show zoom percentage (12sp)
- Fade out after 2 seconds

Double tap:
- Switch between front/back camera
- Rotate animation (200ms)
- Flash state reset
```

### 5.3 Gesture Navigation

```
Swipe left: Next screen
Swipe right: Previous screen
Swipe down: Refresh/Pull to refresh
Long press: Show options menu
Back button: Confirm unsaved changes
```

---

## 6. DARK MODE SUPPORT

### 6.1 Color Adaptation

```
Light Mode (Default):
├─ Background: #FFFFFF
├─ Surfaces: #F5F5F5
├─ Text: #0F0F23
├─ Secondary: #666666
└─ Dividers: #E8E8E8

Dark Mode:
├─ Background: #1A1A2E
├─ Surfaces: #2D2D44
├─ Text: #FFFFFF
├─ Secondary: #B0B0B0
└─ Dividers: #404050
```

### 6.2 Component Adjustments
- Shadow opacity decreased (less visible on dark)
- Primary color slightly lighter for contrast
- Images: Optional brightness adjustment
- Always-light elements: AppBars maintain light backgrounds (accessibility)

---

## 7. ACCESSIBILITY

### 7.1 Text Scaling
- Support text size from 85% to 200%
- Test with 120%, 150%, 180%
- Ensure no text overflow

### 7.2 Contrast Ratios
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- Checked for WCAG AA compliance

### 7.3 Touch Targets
- Minimum: 48dp × 48dp
- Buttons/Icons: 48dp × 48dp
- Spacing: 8dp between targets
- No buttons smaller than 48dp

### 7.4 Semantic Labels
- All buttons have descriptive text
- Icons have content descriptions
- Form fields labeled with ID
- Status messages announced

### 7.5 Navigation
- Logical tab order
- Keyboard navigation fully supported
- Screen readers supported
- Focus indicators visible

---

## 8. RESPONSIVE DESIGN

### 8.1 Device Sizes

```
Compact (< 600dp width):
├─ Phone portrait
├─ Single column layout
├─ Bottom navigation
└─ Full-width cards

Medium (600-840dp):
├─ Phone landscape / Tablet portrait
├─ Single to dual column
├─ Navigation drawer option
└─ Wider cards

Expanded (> 840dp):
├─ Tablet landscape
├─ Multi-column layout
├─ Rail navigation
└─ Resizable panels
```

### 8.2 Orientation Changes
- Preserve scroll position on rotate
- Recompose UI for landscape
- Camera preview: Full width/height
- Forms: Adjust column layout

---

## 9. IMPLEMENTATION GUIDE (Jetpack Compose)

### 9.1 Theme Structure
```kotlin
// Theme.kt
@Composable
fun AIPoseTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) {
        darkColorScheme(
            primary = PrimaryBlue,
            secondary = PrimaryTeal,
            // ...
        )
    } else {
        lightColorScheme(
            primary = PrimaryBlue,
            secondary = PrimaryTeal,
            // ...
        )
    }
    
    MaterialTheme(
        colorScheme = colors,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

### 9.2 Screen Template
```kotlin
@Composable
fun MyScreen(
    viewModel: MyViewModel = hiltViewModel(),
    onNavigate: (destination: String) -> Unit = {}
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = { MyAppBar(...) },
        bottomBar = { BottomNavigation(...) }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            when (state) {
                is State.Loading -> LoadingIndicator()
                is State.Success -> Content(state)
                is State.Error -> ErrorDialog(state.message)
            }
        }
    }
}
```

---

## 10. DESIGN TOKENS (CSS VARIABLES EQUIVALENT)

```kotlin
// Dimensions.kt
object Dimens {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
    val xxl = 48.dp
    
    val buttonHeight = 48.dp
    val iconSize = 24.dp
    val appBarHeight = 56.dp
}

// Spacing.kt
object Spacing {
    val paddingDefault = 16.dp
    val paddingSmall = 8.dp
    val paddingLarge = 24.dp
    val gapDefault = 8.dp
}
```

---

## SUMMARY

This design system ensures:
✅ Consistent visual identity
✅ Accessibility (WCAG AA)
✅ Responsive across devices
✅ Professional appearance
✅ Clear hierarchy
✅ Dark mode support
✅ Production-ready components
✅ Easy implementation in Compose

Use these wireframes + colors + components as reference when reviewing generated code from Claude!
