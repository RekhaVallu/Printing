# PrintFlow Setup Guide

PrintFlow is a full-stack Smart Campus Printing application. This repository contains both the Node.js/Express backend and the React Native/Expo frontend.

Follow the instructions below to get the project running locally after cloning or forking.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **MongoDB** (or a MongoDB Atlas URI for the cloud database)
- **Expo CLI** (installed globally: `npm install -g expo-cli`)
- **Android Studio** (for Android Emulator) or **Xcode** (for iOS Simulator on macOS), or you can use the Expo Go app on your physical device.

## 1. Backend Setup

The backend handles API requests, database interactions, authentication verification via Clerk, and real-time sockets.

1. **Navigate to the backend directory:**
   ```bash
   cd printflow-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `printflow-backend` directory and add the following keys. Make sure to replace the placeholder values with your actual credentials:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Run the backend server (Development Mode):**
   ```bash
   npm run dev
   ```
   *The server should start running on `http://localhost:5000` (or the port specified).*

## 2. Frontend Setup

The frontend is a React Native app built with Expo.

1. **Navigate to the frontend directory:**
   Open a new terminal window/tab and run:
   ```bash
   cd printflow-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `printflow-frontend` directory and add the following keys:
   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

   # Backend REST base (backend mounts at /api/*)
   EXPO_PUBLIC_API_URL=http://localhost:5000/api

   # Backend socket.io base (socket.io attaches to the HTTP server root)
   EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
   ```
   *Mobile testing note:* replace `localhost` with your computer LAN IP (e.g., `http://192.168.1.10:5000`).

4. **Run the Expo development server:**
   ```bash
   npx expo start
   ```


5. **Viewing the App:**
   - Press **`a`** to open the Android Emulator.
   - Press **`i`** to open the iOS Simulator (macOS only).
   - Press **`w`** to open it on the Web.
   - Or, scan the QR code using the **Expo Go** app on your physical iOS or Android device.

## Role Management
- **Student View:** Default view displaying quick actions, active jobs, and personal orders.
- **Admin View:** Displays the Admin Console with system statistics, printer management, and operator management.
- Ensure your user role is properly set in the MongoDB database to view the distinct dashboards.

---
**Happy Printing!**
