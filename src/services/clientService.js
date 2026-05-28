// Firestore CRUD service for Clients
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from "../config/firebase";

const COLLECTION = 'clients';

export const clientService = {
  /**
   * Get all clients
   */
  async getAll() {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  /**
   * Get single client by ID
   */
  async getById(id) {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  },

  /**
   * Create a new client
   */
  async create(data) {
    const userEmail = auth.currentUser?.email || 'Unknown';
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdByEmail: userEmail,
      lastUpdatedByEmail: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Update an existing client
   */
  async update(id, data) {
    const userEmail = auth.currentUser?.email || 'Unknown';
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...data,
      lastUpdatedByEmail: userEmail,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a client
   */
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  /**
   * Search clients by name
   */
  async search(searchTerm) {
    const allClients = await this.getAll();
    return allClients.filter((client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  },
};
