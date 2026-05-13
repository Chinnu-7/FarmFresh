# FarmFresh Direct — Production-Ready System

A full-stack, D2C milk delivery system featuring a Mobile App (Expo), Admin Dashboard (React/Vite), and a Robust Backend (Node.js/Express/MongoDB).

---

## 🛠️ System Architecture

### 1. Mobile App (Expo Router)
*   **Authentication**: OTP-based login (Simulated).
*   **Subscription Engine**: Daily recurring orders for buffalo milk.
*   **Instant Ordering**: Real-time inventory tracking for same-day delivery.
*   **State Management**: Zustand for global state and hydration.
*   **Aesthetics**: Premium UI with Linear Gradients, smooth animations, and clean layouts.

### 2. Admin Dashboard (Vite + Recharts)
*   **Live Metrics**: Revenue tracking, order counts, and user stats.
*   **Inventory Control**: Daily procurement updates and manual allocation overrides.
*   **Demand Prediction**: ML-lite algorithm to predict next day's milk procurement needs.
*   **Order Management**: Pipeline status updates (Packed → Out for Delivery → Delivered).

### 3. Backend (Node.js/Express)
*   **Database**: MongoDB with atomic `$inc` operations for race-condition-free inventory.
*   **Security**: JWT-based authentication and role-based access (Admin/Customer).
*   **Automation**: Cron-ready logic for daily fulfillment generation.

---

## 🚦 How to Run the System

### Phase 1: Backend Setup
1.  Navigate to `backend/`.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file (see `.env.example` if available).
    *   `MONGO_URI=mongodb://localhost:27017/farmfresh`
    *   `JWT_SECRET=supersecretkey`
    *   `NODE_ENV=development`
4.  Seed initial products: `node seeder.js`.
5.  Start server: `npm start` (Runs on port 5000).

### Phase 2: Admin Dashboard Setup
1.  Navigate to `admin-dashboard/`.
2.  Install dependencies: `npm install`.
3.  Start dev server: `npm run dev`.
4.  Login at `http://localhost:3000` (Port may vary) using Admin credentials.

### Phase 3: Mobile App Setup
1.  Navigate to `mobile-app/`.
2.  Install dependencies: `npm install`.
3.  **Critical**: If testing on a physical phone via Expo Go, open `lib/api.ts` and change `localhost` to your **Local IP Address** (e.g., `192.168.x.x`).
4.  Start Expo: `npx expo start`.
5.  Press `a` for Android or `i` for iOS.

---

## 🧪 Testing Credentials
| Role | Phone | OTP |
| :--- | :--- | :--- |
| **Admin** | `9999999999` | `123456` |
| **Customer** | `8888888888` | `123456` |

---

## 🧹 Troubleshooting TypeScript Errors
If VS Code shows a high error count (e.g., 100+):
1.  Press `Ctrl + Shift + P`.
2.  Search for **"TypeScript: Restart TS Server"** and run it.
3.  Ensure `node_modules` is installed in the `mobile-app` directory.
4.  The system has been updated to use `.ts` for core libraries and `.tsx` for screens to ensure type safety.
