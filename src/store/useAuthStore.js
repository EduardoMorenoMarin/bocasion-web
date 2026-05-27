import { create } from 'zustand';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,
  
  initialize: () => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userRef = ref(db, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          
          if (userData && userData.role === 'cocinero') {
            set({ user: { uid: firebaseUser.uid, email: firebaseUser.email, ...userData }, loading: false });
          } else {
            await signOut(auth);
            set({ user: null, loading: false });
          }
        } else {
          set({ user: null, loading: false });
        }
      } catch (error) {
        set({ user: null, loading: false });
      }
    });
  },

  login: async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    const userRef = ref(db, `users/${firebaseUser.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();
    
    if (!userData || userData.role !== 'cocinero') {
      await signOut(auth);
      throw new Error('Unauthorized access. Only cooks are allowed.');
    }
    
    set({ user: { uid: firebaseUser.uid, email: firebaseUser.email, ...userData } });
    return firebaseUser;
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null });
  }
}));
