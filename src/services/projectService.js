// Firestore CRUD service for Projects
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

const COLLECTION = 'projects';

export const projectService = {
  /**
   * Get all projects
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
   * Get single project by ID
   */
  async getById(id) {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  },

  /**
   * Get projects for a specific client
   */
  async getByClientId(clientId) {
    const q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Sort in JS to avoid requiring a composite index in Firestore
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  /**
   * Get projects by status
   */
  async getByStatus(status) {
    const q = query(
      collection(db, COLLECTION),
      where('status', '==', status)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    // Sort in JS to avoid requiring a composite index in Firestore
    return docs.sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  },

  /**
   * Create a new project
   */
  async create(data) {
    const userEmail = auth.currentUser?.email || 'Unknown';
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      totalAdvance: 0,
      totalDue: data.totalBudget || 0,
      createdByEmail: userEmail,
      lastUpdatedByEmail: userEmail,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Update an existing project
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
   * Update financial totals after a payment
   */
  async updateFinancials(id, totalAdvance, totalBudget) {
    const userEmail = auth.currentUser?.email || 'Unknown';
    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      totalAdvance,
      totalDue: totalBudget - totalAdvance,
      lastUpdatedByEmail: userEmail,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a project
   */
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },
};
