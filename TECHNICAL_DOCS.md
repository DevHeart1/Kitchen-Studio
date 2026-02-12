# Kitchen Studio - Technical Documentation

## 1. Executive Summary
**Kitchen Studio** is a sophisticated "Food Operating System" built with **React Native (Expo)** and **Supabase**. It integrates **Spatial AI (AR)**, **Multimodal AI (Gemini Live)**, and a **Dual-Unit Inventory System** to create an intelligent cooking companion.

### Key Technologies
- **Frontend**: React Native, Expo, TypeScript, **ViroReact (AR)**.
- **Backend**: Supabase (PostgreSQL), Edge Functions (Deno).
- **AI / Intelligence**: Google Gemini 2.0 Flash / Pro (via Edge Functions).
- **Communication**: WebSockets (for real-time audio streaming).
- **State Management**: React Context + **XState** (for AR logic).

---

## 2. Architecture Overview: "The Kitchen OS"

The application consists of four core layers:
1.  **Perception Layer (AR)**: Uses **ViroReact** to render 3D instructions, ingredients, and interactive elements anchored to the real world.
2.  **Intelligence Layer (AI)**: Uses **Gemini Live** via Supabase Edge Functions for real-time voice guidance, recipe generation, and question answering.
3.  **Logic Layer (State)**: Uses **XState** (`ARStateMachine`) and React Contexts to manage complex application states (Cooking Steps, Inventory).
4.  **Data Layer (Backend)**: Uses **Supabase** for user data, recipes, and gamification state.

---

## 3. Directory Structure & Key Modules

### 3.1 `@[app]` (Screens & Navigation)
-   **`_layout.tsx`**: Root Orchestrator. Handles Authentication guards, Splash screens (`WelcomeBackSplash`), and global providers.
-   **`(tabs)`**: Main navigation (Kitchen, Inventory, Discover, Profile).
-   **`ar-cooking.tsx`**: The core AR experience. Bridges React Native UI (2D) with the Viro Scene (3D).
-   **`scanner.tsx`**: AI-powered pantry scanner using Camera + Gemini Flash (via `pantry-scan` edge function).
-   **`components/ar/KitchenScene.tsx`**: The actual 3D Viro scene containing the AR logic and nodes.

### 3.2 `@[contexts]` (Global State)
-   **`InventoryContext`**: Manages the user's pantry. Handles dual-unit conversion (e.g., "Tablespoons" to "Cups") and syncs with Supabase.
-   **`GamificationContext`**: Tracks XP, Streaks, and Badges. Syncs with `xp_ledger` and `user_badges` tables.
-   **`SavedRecipesContext`**: Stores user's cookbook. Caches recipes locally for offline access.
-   **`CookingHistoryContext`**: Logs completed sessions for stats and "Resume" functionality.

### 3.3 `@[services]` (Business Logic)
-   **`GeminiLiveService`**: WebSocket client for `gemini-live-relay` Edge Function.
    -   **Audio Streaming**: Mic (Base64) -> WebSocket -> Gemini.
    -   **Playback**: PCM audio -> Buffers -> `expo-av`.
    -   **Tool Calling**: Executes client-side tools (e.g., `nextStep`, `howMuchLeft`) triggered by Gemini.
-   **`ARStateMachine`**: XState machine for the cooking flow (`idle` -> `scanning_surface` -> `cooking` -> `paused`).
-   **`TimelineEngine`**: Manages recipe execution (Steps, Timers).
-   **`UnitConversionService`**: "The Brain" of the inventory. Normalizes units (e.g., "2 cups rice" -> "380g rice") for precise deduction.

### 3.4 `@[plugins]` (Native Configuration) **CRITICAL**
These local Expo Config Plugins resolve native incompatibility issues required for Viro and Gemini.
-   **`withViroFixed.js`**: Patches ViroReact to initialize **ONLY** with `ViroPlatform.AR`.
    -   *Why*: Official plugin initializes AR and VR (GVR) modes simultaneously, causing crashes on non-VR phones ("Double Initialization").
-   **`withViroPackaging.js`**: Resolves `libc++_shared.so` conflicts.
    -   *Why*: Both Viro and React Native (and others) include this C++ library. This plugin injects `pickFirst '**/libc++_shared.so'` into `build.gradle` to prevent build/runtime failures.
-   **`withSpeechRecognition.js`**: Injects `android.permission.RECORD_AUDIO` into `AndroidManifest.xml` (Required for Gemini Live).

### 3.5 `@[supabase]` (Backend)
-   **Database Schema**:
    -   **`inventory_items`**: Stores item data plus `base_quantity` (System unit).
    -   **`ingredient_profiles`**: Density data for unit conversion.
-   **Edge Functions**:
    -   **`pantry-scan`**: Computer Vision via Gemini Flash.
    -   **`generate-recipe`**: Recipe creation via Gemini Pro.
    -   **`gemini-live-relay`**: Secure WebSocket proxy for Gemini API.

---

## 4. Critical Workflows

### 4.1 The Build Process (Android)
**Standard Expo Go will NOT work** for AR features due to custom native code (Viro).
1.  **Prebuild**: `npx expo prebuild --clean` (Generates `android` folder using plugins).
2.  **Compile**:
    -   **Testing**: `npm run build:apk` (EAS Build "preview" -> `.apk`).
    -   **Store**: `npm run build:prod` (EAS Build "production" -> `.aab`).

### 4.2 The AR Cooking Loop
1.  **Launch**: User selects Recipe -> `ar-cooking.tsx` mounts.
2.  **Scan**: `ARStateMachine` enters `scanning_surface`. Viro detects plane -> User taps to anchor.
3.  **Cook**: State moves to `cooking`. `TimelineEngine` loads Step 1.
4.  **Assistance**: `GeminiLiveService` connects.
    -   Gemini speaks instructions.
    -   User says "Next" -> Gemini triggers `nextStep()` tool.
    -   `TimelineEngine` advances -> 3D Step Cards update.

---

## 5. Troubleshooting Guide

*   **Crash on Startup**:
    *   *Cause*: `libc++_shared.so` conflict or Viro Double Init.
    *   *Fix*: Ensure `withViroPackaging` and `withViroFixed` are in `app.json`. Run `npx expo prebuild --clean`.
*   **"Microphone Permission Denied"**:
    *   *Cause*: Missing manifest permission.
    *   *Fix*: Verify `withSpeechRecognition` plugin is active.
*   **AR Screen Black**:
    *   *Cause*: Camera permission denied or Viro key missing (not needed for Community version).
    *   *Fix*: Check App Permissions in Android Settings.

---

## 6. Monetization Configuration (Google Play Console)

To enable the Paywall, the following Product IDs must be configured in **Google Play Console** and linked in **RevenueCat**:

### 📅 Subscriptions
| Type | Product ID | Name |
| :--- | :--- | :--- |
| **Monthly** | `kitchen_studio_pro_monthly` | Kitchen Studio Pro (Monthly) |
| **Yearly** | `kitchen_studio_pro_yearly` | Kitchen Studio Pro (Yearly) |

*Note: Variable pricing tiers and trial durations are managed remotely via the RevenueCat dashboard, not hardcoded in the app.*
