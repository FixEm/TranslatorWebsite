// Client-side Firebase configuration for real-time chat
// Since we're using server-side Firebase for most operations, 
// this is a minimal setup for real-time listeners if needed

// Enable offline persistence for better performance and reduced reads
if (typeof window !== 'undefined') {
  // This will be called when the client-side Firebase is initialized
  // For now, we'll add a comment about enabling offline persistence
  console.log('💾 Firebase offline persistence should be enabled for better performance');
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  createdAt: any;
  readBy: string[];
  edited: boolean;
  editedAt?: any;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails?: ParticipantDetail[];
  bookingId?: string;
  createdAt: any;
  updatedAt: any;
  lastMessageAt: any;
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    createdAt: any;
    type: string;
  } | null;
  unreadCount: { [userId: string]: number };
}

export interface ParticipantDetail {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
}

// Chat API functions using fetch to your existing server endpoints
export class ChatAPI {
  private baseUrl = '/api/chat';

  async findExistingConversation(participants: string[]): Promise<Conversation | null> {
    try {
      console.log('🔍 Looking for existing conversation between participants:', participants);
      
      // Get all conversations for the first participant
      const response = await fetch(`${this.baseUrl}/conversations/${participants[0]}`);
      
      if (!response.ok) {
        throw new Error('Failed to get conversations');
      }

      const conversations: Conversation[] = await response.json();
      console.log(`📋 Found ${conversations.length} conversations for participant ${participants[0]}`);
      
      // Find conversation with exactly the same participants
      const existingConversation = conversations.find(conv => {
        const hasSameParticipants = conv.participants.length === participants.length && 
          participants.every(p => conv.participants.includes(p));
        
        if (hasSameParticipants) {
          console.log('✅ Found existing conversation:', conv.id, 'with participants:', conv.participants);
        }
        
        return hasSameParticipants;
      });

      if (!existingConversation) {
        console.log('❌ No existing conversation found, will create new one');
      }

      return existingConversation || null;
    } catch (error) {
      console.error('❌ Error finding existing conversation:', error);
      return null;
    }
  }

  async createConversation(participants: string[], bookingId?: string): Promise<Conversation> {
    console.log('💬 Creating/finding conversation for participants:', participants);
    
    // First check if conversation already exists
    const existingConversation = await this.findExistingConversation(participants);
    
    if (existingConversation) {
      console.log('✅ Returning existing conversation:', existingConversation.id);
      return existingConversation;
    }

    console.log('🆕 Creating new conversation...');
    // Create new conversation if none exists
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participants, bookingId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const newConversation = await response.json();
    console.log('✅ New conversation created:', newConversation.id);
    return newConversation;
  }

  async getOrCreateConversation(participants: string[], bookingId?: string): Promise<{ conversation: Conversation; isNew: boolean }> {
    // First check if conversation already exists
    const existingConversation = await this.findExistingConversation(participants);
    
    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.id);
      return { conversation: existingConversation, isNew: false };
    }

    // Create new conversation if none exists
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participants, bookingId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation');
    }

    const newConversation = await response.json();
    return { conversation: newConversation, isNew: true };
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const response = await fetch(`${this.baseUrl}/conversations/${userId}`);

    if (!response.ok) {
      throw new Error('Failed to get conversations');
    }

    return response.json();
  }

  async getMessages(conversationId: string, limit = 50, lastMessageId?: string): Promise<Message[]> {
    const url = new URL(`${this.baseUrl}/conversations/${conversationId}/messages`, window.location.origin);
    if (limit) url.searchParams.set('limit', limit.toString());
    if (lastMessageId) url.searchParams.set('lastMessageId', lastMessageId);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    return response.json();
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ senderId, content, type }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return response.json();
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to mark messages as read');
    }
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete message');
    }
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, content }),
    });

    if (!response.ok) {
      throw new Error('Failed to edit message');
    }
  }

  async createConversationFromBooking(bookingId: string, clientId: string, providerId: string): Promise<Conversation> {
    const response = await fetch(`${this.baseUrl}/conversations/from-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ bookingId, clientId, providerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create conversation from booking');
    }

    return response.json();
  }

  // Real-time listeners using Server-Sent Events (cost-effective alternative to polling)
  listenToMessages(conversationId: string, callback: (messages: Message[]) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/conversations/${conversationId}/messages/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const messages = JSON.parse(event.data);
        callback(messages);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }

  listenToConversations(userId: string, callback: (conversations: Conversation[]) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/conversations/${userId}/stream`);
    
    eventSource.onmessage = (event) => {
      try {
        const conversations = JSON.parse(event.data);
        callback(conversations);
      } catch (error) {
        console.error('Error parsing SSE conversation:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }
}

export const chatAPI = new ChatAPI();
