## What It Does

Kitchen Studio is an AI-powered cooking co-pilot.

It:
- Converts public cooking videos into interactive cooking sessions  
- Guides users in real time using camera-based food detection  
- Offers voice and visual cues instead of static instructions  

This is not a recipe app.  
It’s a new cooking medium.

---

## Key Features

### Real-Time AI Cooking Guidance
- Camera detects food, pans, and cooking stages  
- AI provides timing, heat, and texture feedback  
- Hands-free voice guidance while cooking  

### Video → Interactive Cooking
- Import videos from TikTok, Instagram, YouTube, or X  
- Automatically extract:
  - Ingredients  
  - Steps  
  - Cooking logic  
- Turn passive videos into guided cook-alongs  

### Cooking Intelligence
- Learns from user behavior and inventory  
- Tracks detailed usage history (what you used vs. what you have)  
- Predicts when ingredients will run out based on consumption patterns  

### 🧠 Smart Recipe Discovery
- **Hyper-Personalized Suggestions**: Uses Gemini 2.0 Flash to generate recipes based on:
  - Dietary preferences (e.g., Keto, Vegan)
  - Cooking skill level
  - Health goals (e.g., High Protein)
- **"Cook From Pantry" Mode**: Instantly finds recipes matching your exact available ingredients.
- **Natural Language Search**: "I want something spicy with chicken" works instantly.

Kitchen Studio introduces **Zero-UI cooking**, where the phone watches, listens, and assists instead of demanding attention.

---

# How We Built It: Kitchen Studio Technical Deep-Dive

## 🏗️ The Kitchen OS Architecture
Kitchen Studio runs on a four-layer architecture designed for spatial awareness, real-time intelligence, and deterministic interaction.

### 1️⃣ Perception Layer (Spatial AI)
Using **ViroReact** and **Expo AR**, we anchor:

- 3D interactive elements (timers, checkpoints)
- Ingredient status cards
- Interactive step nodes

Directly onto real-world kitchen surfaces.
The interface doesn’t sit on a screen.
It lives on your countertop.

---

### 2️⃣ Intelligence Layer (Multimodal AI)
We integrated **Google Gemini 2.0 Flash Experimental** (Client-Side) and **Gemini 3.0 Flash Preview** (Edge Functions).

This powers:

- Real-time voice guidance
- Context-aware Q&A
- Automated Video → Recipe extraction (Ingredients, Steps, Pro tips)
- Ingredient density normalization

Gemini 2.0 Flash handles the ultra-low latency multimodal streaming for the live assistant.
Gemini 3.0 Flash handles the complex reasoning required to parse unstructured video content into structured recipe JSON.

Together, they act as a live cooking co-pilot.

---

### 3️⃣ Logic Layer (State Management)
Cooking is not linear.
It is reactive.

We used **XState** to power our `ARStateMachine`, managing transitions between:

- Surface scanning
- Step progression
- Audio playback queues
- Voice interaction states

Finite State Machines ensured predictable behavior in a highly interactive AR environment.
This is what makes the experience feel stable and intentional, not experimental.

---

### 4️⃣ Data Layer (Backend Infrastructure)
Built on **Supabase** (PostgreSQL), our backend manages:

- User inventory with density-aware tracking
- Cookbook and Recipe provenance
- Parsed recipe structures
- Gamification mechanics (XP, streaks, levels)

**Supabase Edge Functions** power the heavy lifting:
- `extract-recipe-from-video`: Orchestrates the Gemini 3.0 analysis of social media URLs.
- `cooking-assistant`: A WebSocket relay infrastructure for scalable AI interaction.

---

## 🎬 From Video → Interactive Cooking Engine
Scrolling is passive.
Cooking is active.

We built a pipeline that converts short-form cooking videos into structured, executable guides.

### Step 1: Multimodal Parsing
Users paste URLs from TikTok, Instagram, YouTube, or X.
The app sends this to our `extract-recipe-from-video` Edge Function.

### Step 2: AI Extraction
Using **Gemini 3.0 Flash**, we extract:

- Ingredients (normalized to standard units)
- Measurements
- Sequential steps
- Timing cues
- Implied techniques

The result is structured JSON ready for execution.

### Step 3: TimelineEngine Execution
The parsed data feeds into our custom **TimelineEngine** (TypeScript), which orchestrates:

- Step-based spatial cards
- Voice-guided prompts via **Expo Speech** (TTS)
- Automated state transitions
- Auto-deduction of ingredients from inventory upon step start

This transforms content into action.

---

## 🔍 The Discovery Engine: Context-Aware Suggestions
Static recipe feeds are boring.
We built a dynamic discovery engine powered by **Gemini 2.0 Flash**.

It considers:
- **User Profile**: Dietary restrictions, skill level, and health goals.
- **Pantry Inventory**: What ingredients are actually available.
- **Current Context**: Time of day ("Breakfast ideas"), trending topics.

Instead of searching a database, we ask Gemini to *generate* structured recipe suggestions that match these constraints perfectly.
The result is a hyper-personalized feed that adapts to what you have and who you are.

---

## 🎧 Real-Time Voice Cooking Assistant
Standard REST APIs were too slow for a "live assistant" experience.

We implemented a **direct WebSocket connection** to the **Gemini Multimodal Live API**.
Using the `google/genai` SDK directly in React Native, we:
- Stream audio logic
- Receive instantaneous text and audio responses
- Manage response queues for natural conversation flow

This created a diverse, low-latency conversational cooking assistant that feels immediate and natural.

---

## 🧂 Solving the "Salt Math" Problem
Cooking math is messy.
How do you deduct "2 teaspoons" of salt from inventory stored in grams?
Volume-to-weight conversion depends on ingredient density.

### Our Solution: UnitConversionService

We built:
- A local **Density Mapping** database with cloud sync (`ingredient_profiles`)
- A normalization pipeline (normalizing "cups" -> "ml" -> "g" based on specific ingredient density)
- Canonical unit conversion logic

For example, our system knows that:
- 1 cup of **Rice** ≈ 190g
- 1 cup of **Flour** ≈ 120g
- 1 cup of **Salt** ≈ 280g

Every deduction is mathematically accurate.
No guessing.
No rounding chaos.
No broken inventory logic.

---

## 🧰 The Tech Stack

### Frontend
- React Native (Expo)
- TypeScript
- ViroReact (AR)

### Backend
- Supabase (PostgreSQL)
- Supabase Edge Functions (Deno)

### AI Models
- Google Gemini 2.0 Flash Experimental (Live Multimodal Assistant)
- Google Gemini 3.0 Flash Preview (Video Extraction & Parsing)

### State Management
- XState (Finite State Machines)
- Zustand (Global Store)

### Media
- expo-av (Audio buffering & playback)
- expo-camera (Scanning & perception input)
- expo-speech (Text-to-Speech)

---

## ✨ The Result
Kitchen Studio is not just an app.
It is a spatial, AI-powered cooking operating system that:

- Sees  
- Understands  
- Guides  
- Calculates  
- And cooks with the user  

We built a bridge between digital inspiration and physical execution, powered by AR, multimodal AI, and real-time intelligence.
