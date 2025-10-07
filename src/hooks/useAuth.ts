import { useEffect, useRef } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import { generateKeyPair, storePrivateKey, removePrivateKey } from '@/utils/encryption';
import type { User } from '@/types';

export function useAuth() {
  const { currentUser, setCurrentUser, setUserPassword, userPassword, isSigningUp, setIsSigningUp } = useStore();

  // Use refs to prevent auth listener from recreating
  const isSigningUpRef = useRef(isSigningUp);
  useEffect(() => {
    isSigningUpRef.current = isSigningUp;
  }, [isSigningUp]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Don't auto-login during signup - let the recovery modal show first
        if (isSigningUpRef.current) {
          return;
        }

        // Clean up any keys with invalid format
        const storedKey = localStorage.getItem(`lingo_pk_${firebaseUser.uid}`);
        if (storedKey) {
          try {
            await import('tweetnacl-util').then(m => m.decodeBase64(storedKey));
          } catch (e) {
            // Invalid base64 format, remove it
            localStorage.removeItem(`lingo_pk_${firebaseUser.uid}`);
          }
        }

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);
        }
      } else {
        setCurrentUser(null);
        setUserPassword(null);
      }
    });

    return () => unsubscribeAuth();
  }, [setCurrentUser, setUserPassword]);

  // Real-time listener for current user updates (contacts, etc.)
  // Only subscribe once per user ID to prevent excessive reads
  useEffect(() => {
    const userId = currentUser?.id;
    if (!userId || isSigningUp) return;

    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUser(snapshot.data() as User);
      }
    });

    return () => unsubscribeUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, isSigningUp]);

  const signUp = async (email: string, password: string, displayName: string, preferredLanguage: string = 'en') => {
    try {
      // Set flag to prevent onAuthStateChanged from auto-logging in
      setIsSigningUp(true);

      const { publicKey, privateKey } = generateKeyPair();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userData: User = {
        id: user.uid,
        email: user.email!,
        displayName,
        publicKey,
        preferredLanguage,
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Store encrypted private key and get recovery code
      const recoveryCode = await storePrivateKey(user.uid, privateKey, password);

      // Store password in memory ONLY (not sessionStorage for security)
      setUserPassword(password);

      // DON'T set current user yet - let the recovery code modal show first
      // The AuthForm will set the user after the modal is dismissed

      return { success: true, recoveryCode, userData };
    } catch (error: any) {
      // Reset flag on error
      setIsSigningUp(false);
      return { success: false, error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

      if (userDoc.exists()) {
        // Store password in memory ONLY (not sessionStorage for security)
        setUserPassword(password);
        setCurrentUser(userDoc.data() as User);
        return { success: true };
      }

      // User exists in Auth but not in Firestore (orphaned from failed deletion)
      // Delete the auth user and tell them to create a new account
      const { deleteUser } = await import('firebase/auth');
      await deleteUser(userCredential.user);
      return { success: false, error: 'Account data was corrupted. Please create a new account.' };
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
      setUserPassword(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return { signUp, signIn, signOut };
}
