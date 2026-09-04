# Ink Saboteur ✒️🕵️

A minimalist, real-time multiplayer simultaneous-drawing social deduction browser game powered by **React (Vite)**, **Tailwind CSS**, and **Firebase Realtime Database**.

---

## 🎨 Game Concept

All players draw simultaneously on the **exact same shared whiteboard**.
- **Citizens:** Receive the authentic prompt (e.g., *"Eiffel Tower"*).
- **The Saboteur:** Receives a subtly paired fake prompt (e.g., *"Space Rocket"*).
- **Ink Battery:** Each player has a limited battery (e.g., 5 seconds of active holding/drawing time). Every stroke counts!
- **Accusation & Deduction:** When drawing ends, players inspect the collective drawing and vote on who the Saboteur is.
- **Scoring & The Saboteur's Last Stand:** 
  - Citizens who correctly identify the Saboteur earn **+100 points**.
  - If the Saboteur escapes (not majority voted), they earn **+200 points**.
  - If caught, the Saboteur gets a 10-second bonus window to guess the Citizens' real prompt for **+50 bonus points**!

---

## ✨ Features & Minimalist Redesign

1. **Pure White Whiteboard with Pattern Customization:**
   - Pristine white canvas (`#ffffff`).
   - Switch between **Dots** (subtle dotted paper), **Grid** (clean drafting grid), and **Clean** (pure white) with a single click.
   - High-contrast live cursors showing where opponents are drawing.

2. **Refined, Professional Color Palette:**
   - Dark neutral slate/zinc theme with zero rainbow gradients.
   - Solid, distinct ink pigments designed specifically for clarity on the white whiteboard (Ink Black, Deep Navy, Crimson, Forest Pine, Royal Violet, Burnt Amber, etc.).
   - Clean, minimal SaaS typography and components.

3. **100% Firebase Realtime Database:**
   - Real-time drawing strokes streamed via `onChildAdded` for instant low-latency drawing.
   - Cloud rooms, players, secret prompts, timers, and scoring managed in Firebase.
   - Automatic room deletion: when everyone leaves, the room is completely deleted from the database.

---

## 🚀 Running the Game

### Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🌐 Deploy to Vercel

1. Push your code to GitHub.
2. In [Vercel](https://vercel.com/new), import the repository: `https://github.com/sahilchavan751/ink-saboteur-game.git`
3. Vercel will automatically read `vercel.json` and build the project with zero manual configuration needed.
4. Click **Deploy**!

---

## ⚠️ Firebase Realtime Database Security Rules

To ensure players can create and join rooms:
1. Open [Firebase Console](https://console.firebase.google.com/) ➔ Select **ink-saboteur**.
2. Navigate to **Build ➔ Realtime Database ➔ Rules** tab.
3. Paste:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
4. Click **Publish**.
