# Kitchen Studio 🍳✨

**The Future of Cooking is Here.**

Kitchen Studio (Culinara) is a next-generation culinary assistant that blends **Augmented Reality (AR)**, **Artificial Intelligence (AI)**, and **Voice Interaction** to transform how you cook. Powered by **Google Gemini 3 Flash Preview** and **Supabase**, it provides real-time, hands-free guidance, intelligent recipe extraction, and smart pantry management.

![Banner](https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1200&q=80) 
*(Note: Replace with actual app screenshot)*

## 🚀 Key Features

### 🤖 AI Chef Assistant (Live Voice)
Experience a hands-free cooking companion that listens and talks back.
- **Real-time Voice Guidance:** Ask "What's next?", "How much salt?", or "Set a timer" without touching your screen.
- **Powered by Gemini 3 Flash:** Utilizes the latest multimodal model for ultra-fast, context-aware responses.
- **Continuous Context:** The AI knows exactly which step you are on and adapts its advice accordingly.

### 👓 AR Cooking Mode
Layer digital instructions onto your physical workspace.
- **Step-by-Step Overlay:**See quantities and timers floating next to your ingredients using the camera view.
- **Visual Timers:** Holographic-style countdowns for precise cooking.

### 📥 Intelligent Recipe Extraction
Turn any video into a structured cooking session.
- **Universal Import:** Paste a YouTube URL, and our AI extracts ingredients, steps, and timings.
- **Reasoning Engine:** Fills in gaps (e.g., "Season to taste") and converts vague amounts (e.g., "a pinch") into precise metrics.

### 📦 Smart Pantry & Inventory
Manage your kitchen with computer vision.
- **Scan to Add:** Point your camera at groceries to automatically identify and add them to your inventory.
- **Expiry Tracking:** Get alerts before food goes bad.
- **Recipe Matching:** Suggests recipes based on what you already have.

---

## 🛠️ Tech Stack

### Frontend (Mobile)
- **Framework:** [Expo SDK 54](https://expo.dev) & [React Native 0.81](https://reactnative.dev)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Navigation:** [Expo Router v4](https://docs.expo.dev/router/introduction/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand) & [TanStack Query](https://tanstack.com/query/latest)
- **UI/Styling:** StyleSheet, Lucide React Native, Reanimated
- **Hardware Access:** `expo-camera`, `expo-av`, `expo-haptics`, `expo-file-system`

### Backend & Cloud
- **Platform:** [Supabase](https://supabase.com)
- **Database:** PostgreSQL
- **Edge Functions:** Deno (TypeScript)
- **Auth:** Supabase Auth

### Artificial Intelligence
- **Models:** Google Gemini 3 Flash Preview, Gemini 1.5 Pro
- **SDK:** `@google/genai`
- **Capabilities:** Multimodal (Text, Audio, Vision)

---

## 🏗️ Architecture

```mermaid
graph TD
    User[📱 User / Mobile App]
    
    subgraph "Frontend Layer"
        UI[React Native UI]
        State[Zustand / React Query]
        AV[Audio/Camera Modules]
    end

    subgraph "Supabase Backend"
        Auth[Authentication]
        DB[(PostgreSQL Database)]
        Storage[Bucket Storage]
        
        subgraph "Edge Functions"
            EF_Chef[cooking-assistant (WebSocket)]
            EF_Extract[extract-recipe-from-video]
            EF_Scan[pantry-scan]
        end
    end

    subgraph "AI Services"
        Gemini[✨ Google Gemini API]
    end

    User <--> UI
    UI <--> AV
    UI <--> State
    State <--> Auth
    State <--> DB
    State <--> EF_Extract
    State <--> EF_Scan
    AV <--> EF_Chef
    
    EF_Chef <-->|Stream Audio/Text| Gemini
    EF_Extract <-->|Vision/Reasoning| Gemini
    EF_Scan <-->|Vision Analysis| Gemini
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Supabase CLI (optional, for local backend)
- Expo Go app on your physical device

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/kitchen-studio.git
    cd kitchen-studio
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the app:**
    ```bash
    npx expo start
    ```
    Scan the QR code with your phone (Camera app on iOS, Expo Go on Android).

---

## ☁️ Edge Functions

This project relies on several Supabase Edge Functions for AI processing.

| Function Name | Trigger | Description |
| :--- | :--- | :--- |
| `cooking-assistant` | WebSocket | Handles real-time audio streaming and conversation with Gemini 3 Flash. |
| `extract-recipe-from-video` | HTTP POST | Downloads video transcript/metadata and uses Gemini Reasoning to structure it. |
| `pantry-scan` | HTTP POST | Analyzes images of groceries to identify items and expiry dates. |
| `get-starter-recipes` | HTTP GET | Seeds the database with initial curated recipes. |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the Kitchen Studio Team.
