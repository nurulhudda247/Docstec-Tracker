// Zustand store for app state management
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const useStore = create((set, get) => ({
  // Theme & Settings State
  themeMode: 'dark',
  baseCurrency: 'BDT',

  // Toast State
  toast: { message: '', type: 'success', visible: false },

  // Auth State
  user: null,
  isAuthLoading: true,
  authError: null,

  // Data State
  clients: [],
  projects: [],
  payments: [],
  quotations: [],
  isLoading: false,
  error: null,
  
  // Internal unsubscribers
  _unsubscribers: [],

  // Theme & Settings Actions
  toggleTheme: async () => {
    const nextMode = get().themeMode === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem('docstec_theme_mode', nextMode);
    set({ themeMode: nextMode });
  },
  setThemeMode: (themeMode) => set({ themeMode }),
  setBaseCurrency: async (currency) => {
    await AsyncStorage.setItem('docstec_base_currency', currency);
    set({ baseCurrency: currency });
  },

  // Toast Actions
  showToast: (message, type = 'success') => {
    set({ toast: { message, type, visible: true } });
  },
  hideToast: () => {
    set((state) => ({ toast: { ...state.toast, visible: false } }));
  },

  // Auth Actions
  setUser: (user) => set({ user, isAuthLoading: false }),
  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

  login: async (usernameOrEmail, password) => {
    try {
      set({ isAuthLoading: true, authError: null });
      
      // Real Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, usernameOrEmail, password);
      set({ user: userCredential.user, isAuthLoading: false });
      get().showToast('Successfully signed in.', 'success');
      return true;
    } catch (error) {
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Try again later.';
      }
      set({ authError: message, isAuthLoading: false });
      get().showToast(message, 'error');
      return false;
    }
  },

  logout: async () => {
    try {
      get().unsubscribeData();
      await signOut(auth);
      set({ user: null, clients: [], projects: [], payments: [], quotations: [] });
      get().showToast('Signed out successfully.', 'success');
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Real-time Data Sync
  syncData: () => {
    const state = get();
    // Prevent multiple subscriptions
    if (state._unsubscribers.length > 0) return;

    const unsubs = [];

    // Clients Listener
    unsubs.push(
      onSnapshot(query(collection(db, 'clients'), orderBy('createdAt', 'desc')), (snapshot) => {
        set({ clients: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
      })
    );

    // Projects Listener
    unsubs.push(
      onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snapshot) => {
        set({ projects: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
      })
    );

    // Payments Listener
    unsubs.push(
      onSnapshot(query(collection(db, 'payments'), orderBy('createdAt', 'desc')), (snapshot) => {
        set({ payments: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
      })
    );

    // Quotations Listener
    unsubs.push(
      onSnapshot(query(collection(db, 'quotations'), orderBy('createdAt', 'desc')), (snapshot) => {
        set({ quotations: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) });
      })
    );

    set({ _unsubscribers: unsubs });
  },

  unsubscribeData: () => {
    const { _unsubscribers } = get();
    _unsubscribers.forEach(unsub => unsub());
    set({ _unsubscribers: [] });
  },

  // Data Actions
  setClients: (clients) => set({ clients }),
  setProjects: (projects) => set({ projects }),
  setPayments: (payments) => set({ payments }),
  setQuotations: (quotations) => set({ quotations }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  clearError: () => set({ error: null, authError: null }),
}));

// Load persisted theme and auth states on launch
const initializeAppStore = async () => {
  try {
    // 1. Load theme preference (default to 'dark' initially!)
    const savedTheme = await AsyncStorage.getItem('docstec_theme_mode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      useStore.getState().setThemeMode(savedTheme);
    } else {
      // Default initial theme is dark as requested
      useStore.getState().setThemeMode('dark');
      await AsyncStorage.setItem('docstec_theme_mode', 'dark');
    }

    const savedCurrency = await AsyncStorage.getItem('docstec_base_currency');
    if (savedCurrency) {
      useStore.getState().setBaseCurrency(savedCurrency);
    } else {
      useStore.getState().setBaseCurrency('BDT');
      await AsyncStorage.setItem('docstec_base_currency', 'BDT');
    }
  } catch (e) {
    console.error('Error loading persited state:', e);
  }

  // 2. Load Auth State
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Start syncing real-time data when a user authenticates
      useStore.getState().syncData();

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
          // Safely shadow the read-only photoURL property without destroying Firebase Auth prototype methods!
          const userWithPhoto = Object.create(user);
          userWithPhoto.photoURL = userDoc.data().photoURL;
          useStore.getState().setUser(userWithPhoto);
          return;
        }
      } catch (e) {
        console.error('Error fetching user photoURL from Firestore', e);
      }
    } else {
      // Clear listeners if logged out
      useStore.getState().unsubscribeData();
    }
    useStore.getState().setUser(user);
  });
};

initializeAppStore();

export default useStore;
