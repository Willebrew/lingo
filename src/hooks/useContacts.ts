import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/store/useStore';
import type { User } from '@/types';

export function useContacts() {
  const { currentUser } = useStore();
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !currentUser.contacts || currentUser.contacts.length === 0) {
      setContacts([]);
      setLoading(false);
      return;
    }

    // Use a single query with 'in' operator instead of individual listeners
    // Firestore 'in' operator supports up to 30 values (more than enough for contacts)
    const contactIds = currentUser.contacts.slice(0, 30); // Limit to 30 for Firestore 'in' operator
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('__name__', 'in', contactIds));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contactsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setContacts(contactsList);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load contacts:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // Intentionally omit currentUser to prevent recreation on unrelated updates
    // Only recreate when contacts list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.contacts?.sort().join(',')]);
  const addContact = async (email: string): Promise<{ success: boolean; error?: string; user?: User }> => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      // Find user by email
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return { success: false, error: 'User not found' };
      }

      const targetUser = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as User;

      if (targetUser.id === currentUser.id) {
        return { success: false, error: 'Cannot add yourself as a contact' };
      }

      if (currentUser.contacts?.includes(targetUser.id)) {
        return { success: false, error: 'User is already in your contacts' };
      }

      // Add to current user's contacts
      await updateDoc(doc(db, 'users', currentUser.id), {
        contacts: arrayUnion(targetUser.id),
      });

      // Also add current user to target user's contacts (mutual)
      await updateDoc(doc(db, 'users', targetUser.id), {
        contacts: arrayUnion(currentUser.id),
      });

      return { success: true, user: targetUser };
    } catch (error: any) {
      console.error('Error adding contact:', error);
      return { success: false, error: error.message || 'Failed to add contact' };
    }
  };

  const removeContact = async (contactId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not authenticated' };

    try {
      // Remove from current user's contacts
      await updateDoc(doc(db, 'users', currentUser.id), {
        contacts: arrayRemove(contactId),
      });

      // Also remove current user from target user's contacts
      await updateDoc(doc(db, 'users', contactId), {
        contacts: arrayRemove(currentUser.id),
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error removing contact:', error);
      return { success: false, error: error.message || 'Failed to remove contact' };
    }
  };

  return {
    contacts,
    loading,
    addContact,
    removeContact,
  };
}
