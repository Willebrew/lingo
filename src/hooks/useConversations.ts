import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import {
  subscribeToConversations,
  findOrCreateConversation,
  searchUsersByEmail,
  deleteConversation as dbDeleteConversation,
} from '@/lib/db';
import toast from 'react-hot-toast';

export function useConversations() {
  const { currentUser, conversations, setConversations, setSelectedConversationId } = useStore();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToConversations(
      currentUser.id,
      (convs) => {
        setConversations(convs);
      }
    );

    return () => unsubscribe();
    // Intentionally omit currentUser to prevent recreation on unrelated updates
    // Only recreate when user ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, setConversations]);

  const startConversation = async (recipientEmail: string) => {
    if (!currentUser) return null;

    try {
      const users = await searchUsersByEmail(recipientEmail);
      const recipient = users.find((u) => u.id !== currentUser.id);

      if (!recipient) {
        throw new Error('User not found');
      }

      const conversationId = await findOrCreateConversation(
        currentUser.id,
        recipient.id
      );

      return conversationId;
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      toast.error(error.message || 'Failed to start conversation');
      throw error;
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await dbDeleteConversation(conversationId);
      // Clear selected conversation if it was the deleted one
      setSelectedConversationId(null);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to delete conversation:', error);
      toast.error(error.message || 'Failed to delete conversation');
      return { success: false, error: error.message };
    }
  };

  return {
    conversations,
    startConversation,
    deleteConversation,
  };
}
