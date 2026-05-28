// Firestore CRUD service for Payments
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

const COLLECTION = 'payments';

export const paymentService = {
  /**
   * Get all payments
   */
  async getAll() {
    const q = query(collection(db, COLLECTION), orderBy('paymentDate', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  /**
   * Get all payments for a project
   */
  async getByProjectId(projectId) {
    const q = query(
      collection(db, COLLECTION),
      where('projectId', '==', projectId)
    );
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return docs.sort((a, b) => {
      const timeA = a.paymentDate?.toMillis ? a.paymentDate.toMillis() : 0;
      const timeB = b.paymentDate?.toMillis ? b.paymentDate.toMillis() : 0;
      return timeB - timeA;
    });
  },

  /**
   * Get all payments for a client
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
    return docs.sort((a, b) => {
      const timeA = a.paymentDate?.toMillis ? a.paymentDate.toMillis() : 0;
      const timeB = b.paymentDate?.toMillis ? b.paymentDate.toMillis() : 0;
      return timeB - timeA;
    });
  },

  /**
   * Get single payment
   */
  async getById(id) {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  },

  /**
   * Create a new payment
   */
  async create(data) {
    const userEmail = auth.currentUser?.email || 'Unknown';
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdByEmail: userEmail,
      lastUpdatedByEmail: userEmail,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Delete a payment
   */
  async delete(id) {
    const docRef = doc(db, COLLECTION, id);
    await deleteDoc(docRef);
  },

  /**
   * Get total payments for a project
   */
  async getTotalByProjectId(projectId) {
    const payments = await this.getByProjectId(projectId);
    return payments.reduce((total, p) => total + (p.amount || 0), 0);
  },
};
