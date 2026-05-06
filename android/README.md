# PoseGuide AI — Android Real-Time Photography Pose Coach

> Matches the behavior of the Huawei XMAGE 姿势推荐 (Pose Recommendation) system on Pura 90 series.

---

## Architecture Overview

```
CameraX Frame
    │
    ├─ Every 3rd frame ──► ML Kit Pose Detection (33 landmarks)
    │                            │
    │                       PoseLandmarks ──► PoseViewModel ──► PoseMatcher
    │
    └─ Every 30th frame ─► ML Kit Image Labeling + Face Detection
                                 │
                            SceneAnalyzer ──► SceneContext (fingerprint)
                                 │
                        PoseRotationManager.getNextPose()
                                 │
                           PoseTemplate ──► OverlayRenderer ──► Canvas
```

### MVVM Components

| Class | Role |
|---|---|
| `CameraViewModel` | CameraX frame routing, ML Kit orchestration |
| `PoseViewModel` | Manages active pose, confidence, auto-advance |
| `SceneViewModel` | Exposes scene context + session analytics |
| `PoseRotationManagerImpl` | No-repeat pose selection engine |
| `SceneAnalyzer` | Environment, lighting, complexity detection |
| `PoseMatcher` | Joint angle confidence scoring |
| `OverlayRenderer` | Canvas-based skeleton + ring drawing |

---

## Setup

### Prerequisites

- Android Studio Hedgehog or newer
- Android SDK 35 (API 35 compile target)
- Minimum SDK: API 26 (Android 8.0)
- A physical device recommended for CameraX + ML Kit performance

### Steps

```bash
# 1. Open the android/ folder in Android Studio
File → Open → select android/

# 2. Sync Gradle
# Android Studio will prompt — click "Sync Now"

# 3. Run on device
Run → Run 'app' (select physical device)
```

> **Note**: ML Kit Pose detection accurate model (~10 MB) downloads automatically on first launch via Play Services.

---

## Dependency Versions

| Library | Version |
|---|---|
| Kotlin | 2.0.0 |
| AGP | 8.5.0 |
| Jetpack Compose BOM | 2024.06.00 |
| CameraX | 1.3.3 |
| ML Kit Pose Detection (Accurate) | 18.0.0-beta4 |
| ML Kit Object Detection | 17.0.1 |
| ML Kit Face Detection | 16.1.6 |
| ML Kit Image Labeling | 17.0.8 |
| Room | 2.6.1 |
| Hilt | 2.51.1 |
| KSP | 2.0.0-1.0.21 |
| Coroutines | 1.8.1 |

---

## No-Repeat Pose System

`PoseRotationManagerImpl` enforces 4 rules:

| Rule | Implementation |
|---|---|
| Never repeat within scene session | `shownPerScene: Map<SceneType, List<poseId>>` |
| Never show same pose consecutively | `lastShownPoseId` global guard |
| Exhausted library → shuffle restart | Clear `shownPerScene[scene]`, re-shuffle, skip last |
| Scene change → fresh per-scene history | Clear on fingerprint mismatch |

The **scene fingerprint** is `${environment}|${subjectCount}|${framing}` — changes trigger a new scene.

---

## Extending the Pose Library

Edit `app/src/main/assets/poses_templates.json`:

```json
{
  "id": "pose_031",
  "name": "My New Pose",
  "compatibleScenes": ["STREET", "URBAN"],
  "bodyParts": ["LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_HIP"],
  "overlayHints": [
    "Turn 45° to camera",
    "Drop left shoulder",
    "Chin slightly up"
  ],
  "landmarkTargets": [
    {
      "landmarkType": "LEFT_SHOULDER",
      "targetAngleDeg": 140,
      "toleranceDeg": 20,
      "description": "Shoulder angle"
    }
  ],
  "visualCategory": "STANDING_DYNAMIC"
}
```

**Valid `compatibleScenes`**: `BEACH`, `STREET`, `CAFE`, `INDOOR`, `PARK`, `URBAN`, `GENERIC`

**Valid `visualCategory`**: `STANDING_CASUAL`, `STANDING_DYNAMIC`, `SITTING`, `LEANING`, `WALKING_PAUSE`, `ARMS_EXPRESSIVE`, `PROFILE`

**Valid `landmarkType`**: Any value from `PoseLandmarkType` enum — e.g., `LEFT_SHOULDER`, `RIGHT_KNEE`, `NOSE`, etc.

---

## Running Tests

```bash
# Unit tests (no device required)
./gradlew :app:test

# Specific test class
./gradlew :app:test --tests "com.poseguide.ai.PoseRotationAlgorithmTest"
```

Tests cover:
- No consecutive pose repetition
- Full cycle before restart
- Scene change resets per-scene history
- Global consecutive guard across scenes
- Session reset clears all state
- `markPoseAccepted` persists to repository

---

## Privacy

- **No network calls** — all inference is entirely on-device
- Pose usage history saved to Room DB (`pose_guide.db`) on the device only
- History is used solely for local session analytics
- User can clear history via `SceneViewModel.clearHistory()`

---

## Overlay UI Controls

| Control | Behavior |
|---|---|
| 👁 Toggle button (top right) | Enable/disable pose coach overlay |
| 🔄 Flip button (top right) | Switch front/rear camera |
| **Next Pose** button | Manually advance to next pose |
| **Accept** button | Accept current pose + log to history |
| Confidence bar | Fills 0→100% as user matches pose |
| **✦ Ready to Shoot** badge | Appears when match ≥ 80% |
| Auto-advance | After 8 seconds at match ≥ 80%, auto-advances |

---

## Portrait/4× Mode Activation

The pose coach activates in **portrait mode** (indicated by the "Portrait 4×" pill at top left).
In the current implementation, portrait mode is the default. Toggle via `CameraViewModel.setPortraitMode(true/false)`.

To integrate with actual focal length:
1. Use `Camera2Interop` with `CaptureRequest.LENS_FOCAL_LENGTH`
2. When focal ≥ 4× equivalent, call `cameraViewModel.setPortraitMode(true)`

---

## Project Structure

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── assets/
│   │   │   │   └── poses_templates.json        ← 30 pose library
│   │   │   ├── java/com/poseguide/ai/
│   │   │   │   ├── MainActivity.kt
│   │   │   │   ├── PoseGuideApplication.kt
│   │   │   │   ├── data/
│   │   │   │   │   ├── db/                     ← Room DB + DAO
│   │   │   │   │   ├── pose/                   ← PoseRotationManagerImpl, PoseMatcher
│   │   │   │   │   └── scene/                  ← SceneAnalyzer
│   │   │   │   ├── di/                         ← Hilt modules
│   │   │   │   ├── domain/
│   │   │   │   │   ├── model/                  ← PoseTemplate, SceneContext, etc.
│   │   │   │   │   └── repository/             ← Interfaces
│   │   │   │   └── presentation/
│   │   │   │       ├── overlay/                ← OverlayRenderer, OverlayView
│   │   │   │       ├── ui/screen/              ← CameraScreen (Compose)
│   │   │   │       ├── ui/theme/               ← Theme, Colors, Typography
│   │   │   │       └── viewmodel/              ← Camera/Pose/SceneViewModel
│   │   └── test/                               ← Unit tests
│   ├── build.gradle.kts
│   └── proguard-rules.pro
├── gradle/
│   └── libs.versions.toml                      ← Version catalog
├── build.gradle.kts
└── settings.gradle.kts
```
