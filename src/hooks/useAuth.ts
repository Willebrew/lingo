import { useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { generateKeyPair, storePrivateKey, removePrivateKey } from '@/utils/encryption';
import type { User } from '@/types';

export function useAuth() {
  const { setCurrentUser } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [setCurrentUser]);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { publicKey, privateKey } = generateKeyPair();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName,
        publicKey,
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      storePrivateKey(user.uid, privateKey);
      setCurrentUser(userData);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        setCurrentUser(userDoc.data() as User);
        return { success: true };
      }

      return { success: false, error: 'User data not found' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      if (auth.currentUser) {
        removePrivateKey(auth.currentUser.uid);
      }
      await firebaseSignOut(auth);
      setCurrentUser(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { signUp, signIn, signOut };
}
