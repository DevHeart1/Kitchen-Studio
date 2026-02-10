# Kitchen Studio - Technical Documentation

## 1. Executive Summary
**Kitchen Studio** is a sophisticated "Food Operating System" built with **React Native (Expo)** and **Supabase**. It goes beyond simple recipe management by integrating **AR Cooking Assistance**, **Voice Control**, and a **Dual-Unit Inventory System** (tracking both user-friendly units like "cups" and precise system units like "grams").

### Key Technologies
- **Frontend**: React Native, Expo, TypeScript, Reanimated, Skia/GL.
- **Backend / Database**: Supabase (PostgreSQL), Edge Functions (Deno).
- **API Layer**: Hono (Server-First Web Framework) handling requests via Expo Router API routes.
- **AI / Intelligence**: Google Gemini 3.0 Flash (via Edge Functions) for voice/text assistance.
- **AR / 3D**: `expo-gl`, `three.js` for immersive cooking guides.
- **Voice**: `@jamsch/expo-speech-recognition` for hands-free control.

---

## 2. Architecture Overview

### 2.1 Monorepo Handling (Virtual)
The project structure is a standard Expo Router app, but conceptually modularized:
- **`app/`**: File-based routing (screens) and API routes.
- **`components/`**: Reusable UI blocks and "Smart Components".
- **`contexts/`**: Global state management (React Context).
- **`services/`**: Business logic (Unit conversion, heuristics).
- **`supabase/`**: Backend infrastructure (Schema, Functions).

### 2.2 Data Flow
1.  **Authentication**: Supabase Auth (managed via `AuthContext`).
2.  **State**:
    - **Inventory**: `InventoryContext` caches items and syncs with `inventory_items` table.
    - **Recipes**: `SavedRecipesContext` manages bookmarks.
    - **Session**: `CookingHistoryContext` tracks active cooking sessions.
3.  **Offline/Online**:
    - Uses `AsyncStorage` for persistence when Supabase is not configured (Demo Mode).
    - Syncs to Supabase when authenticated.

---

## 3. Core Modules

### 3.1 App Directory (`/app`)
Follows **Expo Router** conventions:
- **`_layout.tsx`**: Root Orchestrator. Handles Authentication guards, Splash screens (`WelcomeBackSplash`), and global providers.
- **`(tabs)`**: Main navigation (Dashboard, Inventory, Recipes, Profile).
- **`(auth)`**: Sign-in/Sign-up flows.
- **`ar-cooking.tsx`**: The core AR experience. Uses `CameraView` overlays with `GLView` (Three.js) for placing 3D ingredient markers.
- **`scanner.tsx`**: Barcode/Food recognition module.
- **`api/`**: Server-side API routes (e.g., tRPC endpoints) handled by Expo Router's API capabilities.

### 3.2 Contexts (`/contexts`)
The nervous system of the app:
- **`InventoryContext.tsx`**: Manages pantry items. Handles CRUD operations.
    - *Note*: Historically supported complex dual-unit auto-deduction (`consumeIngredients`), but currently streamlined to focus on CRUD and state availability.
- **`UnitConversionService.ts`** (Service): The "Brain" of the inventory.
    - Contains `toSystemUnit`: Converts "2 cups rice" -> "380g rice".
    - `checkAvailability`: Compares Recipe requirements vs Pantry stock using normalized base units.
- **`CookingHistoryContext.tsx`**: Tracks ongoing sessions (`activeCookingSession`) for the "Resume Cooking" feature.

### 3.3 Services (`/services`)
- **`UnitConversionService.ts`**:
    - **`UNIT_DEFINITIONS`**: Database of mass/volume factors.
    - **`INITIAL_DENSITY_MAP`**: Specific density data (e.g., "Rice = 190g/cup") for converting volume to mass.
    - **`predictRunOutDate`**: Heuristic algorithm using usage history to estimate stock depletion.

### 3.4 Backend (`/supabase`)
- **Database Schema** (`supabase-schema.sql`):
    - **`inventory_items`**: Stores item data plus `base_quantity` (System) and `original_quantity`.
    - **`ingredient_profiles`**: Crowdsourced/System density data for unit conversion.
    - **`recipes`, `user_profiles`**: Standard entities.
- **Edge Functions** (`/functions`):
    - **`cooking-assistant`**:
        - Proxies WebSockets to **Google Gemini Live API**.
        - Handles real-time audio streaming (Client -> Server -> Gemini -> Server -> Client).
        - Currently configured for `gemini-3-flash-preview`.

---

## 4. Key Features

### 4.1 Dual-Unit Inventory System
Solves the "Cup vs Gram" problem.
- **User View**: User adds "1 cup Rice".
- **System View**: App calculates "190g Rice" (Base Unit) using density maps.
- **Constraint**: When a recipe asks for "50g Rice", the system knows "1 cup > 50g" even if units mismatch.

### 4.2 AR Cooking Companion (`ar-cooking.tsx`)
- **Visuals**: Displays cooking steps over camera feed.
- **3D Elements**: Uses `three.js` to render floating markers (e.g., ingredient spheres).
- **Voice Control**:
    - Uses `useVoiceControl` hook.
    - Commands: "Next step", "Repeat", "Set timer".
    - Feedback: Toggles `isListening` / `isSpeaking` states visually.
    - Integration: Uses `ExpoSpeechRecognitionModule` for robust, continuous listening.

### 4.3 AI Cooking Assistant
- **Architecture**: WebSocket connection to Supabase Edge Function.
- **Capabilities**:
    - Real-time Q&A ("Is my pan hot enough?").
    - Step guidance.
    - Powered by Gemini's multimodal capabilities (Text/Audio).

---

## 5. Database Schema (Snapshot)

### `inventory_items`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | PK |
| `name` | TEXT | Display name ("Basmati Rice") |
| `quantity` | REAL | User-facing amount (e.g. 2) |
| `unit` | TEXT | User-facing unit (e.g. "cups") |
| `base_quantity` | REAL | System amount (e.g. 380) |
| `base_unit` | TEXT | System unit (e.g. "g") |
| `original_quantity`| REAL | Initial base amount (for progress bars) |

### `user_profiles`
Stores gamification stats (`level`, `xp`, `unlocked_badge_ids`) and preferences.

---

## 6. Setup & Installation

### Prerequisites
- Node.js & npm/bun.
- Supabase project (for backend).
- Gemini API Key (for AI features).

### Installation
```bash
npm install
# Note: Manually ensure @jamsch/expo-speech-recognition is ^3.0.1
```

### Running
```bash
npx expo start
```
