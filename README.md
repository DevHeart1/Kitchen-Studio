# Kitchen Studio

Kitchen Studio is a comprehensive companion app for modern home cooks, blending smart inventory management, recipe discovery, and augmented reality cooking assistance. Built with React Native and Expo, it offers a seamless experience across iOS, Android, and Web.

## Features

### 🍳 Smart Kitchen Management
- **Inventory Tracker**. Keep track of your pantry items, expiration dates, and quantity.
- **Scanner**. Quickly add items to your inventory using the built-in barcode and visual food scanner.
- **Substitution Guide**. Instantly find alternatives for missing ingredients during your cook.

### 🍱 Recipe Discovery & Cooking
- **Discover Recipes**. Browse a curated collection of recipes tailored to your available ingredients.
- **AR Cooking**. Experience immersive cooking instructions with Augmented Reality overlays.
- **Cook Session**. Step-by-step guided cooking with timers and voice prompts.
- **Recent Cooks**. innovative log of your culinary history.

### 👤 Personalization & Gamification
- **Profile & Stats**. Track your cooking streaks, favorite cuisines, and skill level.
- **Achievements**. Unlock badges and levels as you master new recipes and techniques.
- **Progression Map**. Visualise your culinary journey and skill growth.

## Getting Started

### Prerequisites

- Node.js & npm (or bun)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone <YOUR_GIT_URL>
   cd Kitchen-Studio
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Configure Environment:
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
   ```

### Running the App

Start the development server:

```bash
npm run start-web
```
Or for mobile:
```bash
npx expo start
```

- **Web**: Open [http://localhost:8081](http://localhost:8081) in your browser.
- **Mobile**: Scan the QR code with the Expo Go app (Android) or Camera app (iOS).

## built With

- **Framework**: [Expo](https://expo.dev) & React Native
- **Routing**: Expo Router
- **Styling**: NativeWind / Tailwind CSS
- **State Management**: React Query & Zustand
- **Backend**: tRPC & Hono

## Troubleshooting

- **Environment Errors**: Ensure your `.env` file is set up correctly as described above.
- **Dependency Issues**: Use `npm install --legacy-peer-deps` if you encounter ERESOLVE errors.
