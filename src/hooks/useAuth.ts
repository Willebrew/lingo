import { useEffect } from 'react';
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
  const { setCurrentUser, setUserPassword, isSigningUp, setIsSigningUp } = useStore();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Don't auto-login during signup - let the recovery modal show first
        if (isSigningUp) {
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as User);

          // Restore password from sessionStorage if available
          const storedPassword = sessionStorage.getItem(`lingo_session_${firebaseUser.uid}`);
          if (storedPassword) {
            setUserPassword(storedPassword);
          }
        }
      } else {
        setCurrentUser(null);
        setUserPassword(null);
      }
    });

    return () => unsubscribeAuth();
  }, [setCurrentUser, setUserPassword, isSigningUp]);

  // Real-time listener for current user updates (contacts, etc.)
  useEffect(() => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || isSigningUp) return;

    const unsubscribeUser = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentUser(snapshot.data() as User);
      }
    });

    return () => unsubscribeUser();
  }, [auth.currentUser?.uid, isSigningUp, setCurrentUser]);

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

      // Store password in memory and sessionStorage for this session
      setUserPassword(password);
      sessionStorage.setItem(`lingo_session_${user.uid}`, password);
      console.log('[useAuth] Password stored in sessionStorage for user:', user.uid);
      console.log('[useAuth] Recovery code generated:', recoveryCode);
      console.log('[useAuth] User data prepared:', userData);

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
        // Store password in memory and sessionStorage for this session
        setUserPassword(password);
        sessionStorage.setItem(`lingo_session_${userCredential.user.uid}`, password);
        console.log('[useAuth] Sign-in successful, password stored for user:', userCredential.user.uid);
        setCurrentUser(userDoc.data() as User);
        return { success: true };
      }

      // User exists in Auth but not in Firestore (orphaned from failed deletion)
      // Delete the auth user and tell them to create a new account
      console.log('[useAuth] Orphaned auth user detected, cleaning up...');
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
        // Clear session password
        sessionStorage.removeItem(`lingo_session_${auth.currentUser.uid}`);
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
