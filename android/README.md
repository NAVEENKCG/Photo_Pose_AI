# PoseGuide AI (XMAGE Edition)

PoseGuide AI is an advanced, high-fidelity real-time photography pose coach inspired by the Huawei Pura 90 Pro XMAGE feature. It analyzes the scene and the user's body shape to recommend context-aware, non-repeating poses with a sleek UI.

## Core Features

1. **Three-Layer Scene Analysis Pipeline:**
   - **Layer 1: Clarifai API** (General Image Recognition) for robust semantic scene detection (e.g., Beach, Forest, Cafe).
   - **Layer 2: Open-Meteo API** for time-and-weather-aware lighting context (Golden Hour, Overcast, etc.).
   - **Layer 3: TFLite (Places365)** for offline fallback environment classification.
2. **ML-Based Pose Generation:**
   - Pre-ranked pose affinity matrix matching poses to scenes and lighting.
   - Body-adaptive silhouette scaling via MediaPipe Holistic body proportions.
3. **Strict No-Repeat Rotation Algorithm:**
   - Fingerprint-based session tracking to guarantee diverse pose recommendations.
   - Prevents consecutive repeats globally and tracks exhaustion per-scene.
4. **Huawei XMAGE UX:**
   - Strict 3-zone layout: Top Status, Camera Viewport, Bottom HUD.
   - Distinctive XMAGE Teal (`#1D9E75`), Amber, and Red confidence ring indicators.

## Setup Instructions

### 1. Clarifai API Setup
The app requires a Clarifai Personal Access Token (PAT) for cloud-based scene recognition.
1. Create a free account at [Clarifai](https://clarifai.com/).
2. Generate a PAT in your account settings.
3. Replace the placeholder in `data/scene/ClarifaiClient.kt`:
   ```kotlin
   private const val PAT = "YOUR_CLARIFAI_PAT"
   ```

### 2. Places365 Offline Model Setup
For the TFLite fallback to work:
1. Download the `places365_mobilenet_v2_1.0_224_quant.tflite` model.
2. Place it in the `app/src/main/assets/` directory.

### 3. Build & Run
Ensure your device has a camera, an internet connection (for Clarifai and Open-Meteo APIs), and location services enabled (for accurate weather/lighting inference).

## Architecture

- **UI Framework:** Jetpack Compose & ConstraintLayout Compose
- **Camera Pipeline:** CameraX
- **Machine Learning:** ML Kit (Pose & Face), MediaPipe Holistic concepts, TensorFlow Lite
- **Dependency Injection:** Dagger Hilt
- **Local Storage:** Room Database (Usage History & Personalization)
- **Networking:** OkHttp & Gson
