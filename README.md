# Docstec Tracker

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4A4A55?style=for-the-badge&logo=react&logoColor=white)

A premium, cross-platform mobile and web application built with **Expo (React Native)** and **Firebase** for managing clients, projects, quotations, and team payments. Designed with a stunning, dynamic, and fully responsive UI featuring both Dark and Light theme support.

---

## Table of Contents
1. [Overview](#overview)
2. [Core Features](#core-features)
3. [App Flow and Architecture](#app-flow-and-architecture)
4. [Tech Stack](#tech-stack)
5. [File Structure](#file-structure)
6. [Environment Setup](#environment-setup)
7. [License](#license)

---

## Overview
**Docstec Tracker** is designed to streamline agency and freelance operations. It allows you to track clients, manage project budgets, record client payments, distribute team payouts, and generate professional PDF quotations instantly. The application is entirely cloud-synced using Firebase Firestore.

---

## Core Features
- **Secure Authentication**: Firebase Email/Password login with persisted sessions.
- **Dashboard Analytics**: Real-time overview of total revenue, pending balances, and active projects.
- **Client Management**: Add and track clients. View individual client history, associated projects, and total due balances.
- **Project Tracking**: 
  - Track total budgets, advance payments, and due amounts.
  - Record team members and their individual payouts.
  - View real-time profit margins.
- **Quotation Generator**: Create dynamic quotations with custom items, discounts, and taxes. Export directly to **PDF** or print using `expo-print`.
- **Dynamic Theming**: Instant hot-swapping between beautifully crafted **Dark** and **Light** modes.
- **Global Settings**: Customize your profile picture, change base currency (BDT/USD), and manage account security.

---

## App Flow and Architecture

1. **Auth Flow**: 
   - Unauthenticated users are routed to `LoginScreen`.
   - Upon login, Firebase Auth token is validated, user profile is fetched from Firestore, and state is populated via **Zustand**.
2. **Main Navigation (Drawer + Stack)**:
   - Built with `@react-navigation/drawer` and `@react-navigation/native-stack`.
   - **Dashboard**: Entry point post-login. Displays high-level metrics.
   - **Clients & Projects**: Navigate into detail screens (`ClientDetailScreen` / `ProjectDetailScreen`) to manage specific entities and add sub-records (payments/team payouts).
   - **Quotations**: Create quotations step-by-step, preview them in `QuotationPreviewScreen`, and generate PDFs.
3. **State Management**:
   - `useStore.js` (Zustand) acts as the single source of truth for UI state, auth status, theme preferences, and base currency.
4. **Data Layer**:
   - Modular services (`clientService`, `projectService`, `quotationService`) handle all Firebase Firestore CRUD operations.

---

## Tech Stack
- **Framework**: React Native / Expo SDK
- **Navigation**: React Navigation (Stack, Drawer)
- **State Management**: Zustand
- **Database / Auth**: Firebase (Firestore, Authentication, Storage)
- **PDF Generation**: `expo-print`, `expo-sharing`
- **UI Icons**: `@expo/vector-icons` (Ionicons)
- **Async Storage**: `@react-native-async-storage/async-storage`

---

## File Structure

```text
Docstec Tracker/
├── App.js                     # App entry point, Navigation Container setup
├── app.json                   # Expo configuration file
├── .env                       # Environment variables (Firebase config)
└── src/
    ├── components/            # Reusable UI Components
    │   ├── BottomDrawer.js    # Animated bottom sheet for forms
    │   ├── Button.js          # Custom stylized button
    │   ├── CalendarPicker.js  # Date picker component
    │   ├── Card.js            # Container card component
    │   ├── ConfirmModal.js    # Global confirmation dialog
    │   ├── EmptyState.js      # Placeholder for empty lists
    │   ├── HamburgerButton.js # Drawer menu toggle button
    │   ├── InputField.js      # Floating-label text input field
    │   ├── LoadingSpinner.js  # Full-screen loader
    │   ├── StatusBadge.js     # Colored badge for project statuses
    │   └── Toast.js           # Custom toast notifications
    │
    ├── config/
    │   └── firebase.js        # Firebase initialization and exports
    │
    ├── navigation/
    │   └── AppNavigator.js    # Drawer and Stack Routing setup
    │
    ├── screens/               # Application Screens
    │   ├── LoginScreen.js          
    │   ├── DashboardScreen.js      
    │   ├── ClientsScreen.js        
    │   ├── AddClientScreen.js      
    │   ├── ClientDetailScreen.js   
    │   ├── ProjectsScreen.js       
    │   ├── AddProjectScreen.js     
    │   ├── ProjectDetailScreen.js  
    │   ├── AddPaymentScreen.js     
    │   ├── QuotationScreen.js      
    │   ├── CreateQuotationScreen.js
    │   ├── QuotationPreviewScreen.js
    │   └── SettingsScreen.js       
    │
    ├── services/              # Firestore CRUD Operations
    │   ├── clientService.js
    │   ├── paymentService.js
    │   ├── projectService.js
    │   └── quotationService.js
    │
    ├── store/
    │   └── useStore.js        # Global Zustand state (Auth, Theme, Config)
    │
    ├── templates/
    │   └── quotationTemplate.js # HTML template string for PDF generation
    │
    ├── theme/
    │   └── index.js           # Design system (Colors, Spacing, Typography)
    │
    └── utils/
        ├── constants.js       # App-wide static variables
        ├── formatters.js      # Currency and Date formatting helpers
        └── signatures.js      # Base64 encoded signature images
```

---

## Environment Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Setup Firebase Variables**:
   Ensure you have a `.env` file in the root directory with your Firebase configuration.
   *(Note: This file is ignored by Git for security purposes)*
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY="your_api_key"
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
   EXPO_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
   EXPO_PUBLIC_FIREBASE_APP_ID="your_app_id"
   EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"
   ```
3. **Run the Application**:
   ```bash
   # Run on Web
   npm run web

   # Run on iOS/Android (Expo Go)
   npm start
   ```

---

## License
**Copyright (c) 2026 Nurul Hudda / Docstec. ALL RIGHTS RESERVED.**

This software is proprietary and confidential. Unauthorized copying, alteration, distribution, transmission, performance, display, or other use of this material is strictly prohibited.
