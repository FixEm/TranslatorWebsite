import express from 'express';
import { storage } from './firebase-storage';

const router = express.Router();

// Create a new conversation or get existing one
router.post('/conversations', async (req, res) => {
  try {
    const { participants, bookingId } = req.body;
    
    if (!participants || !Array.isArray(participants) || participants.length < 2) {
      return res.status(400).json({ 
        error: 'Participants array with at least 2 users is required' 
      });
    }
    
    const conversation = await storage.createConversation(participants, bookingId);
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const conversations = await storage.getConversations(userId);
    
    // Enhance conversations with participant details
    const enhancedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const participantDetails = await Promise.all(
          conversation.participants.map(async (participantId: string) => {
            console.log(`🔍 Looking up participant: ${participantId}`);
            
            // Try to get user first (for clients), then applications (for student translators), then service providers
            const user = await storage.getUser(participantId);
            console.log(`👤 User lookup result:`, user ? `Found user: ${user.username}` : 'No user found');
            
            const application = await storage.getApplication(participantId);
            console.log(`📝 Application lookup result:`, application ? `Found application: ${application.name}` : 'No application found');
            
            const serviceProvider = await storage.getServiceProvider(participantId);
            console.log(`🏢 ServiceProvider lookup result:`, serviceProvider ? `Found service provider: ${serviceProvider.name}` : 'No service provider found');
            
            let participant = user || application || serviceProvider;
            
            // If no participant found, try to find by email in any collection
            if (!participant && participantId.includes('@')) {
              try {
                console.log('Email-based lookup not implemented yet for:', participantId);
              } catch (error) {
                console.warn('Could not lookup participant by email:', participantId);
              }
            }
            
            // If still no participant found, try to find by Firebase UID in applications
            if (!participant && !participantId.includes('@')) {
              try {
                console.log(`🔍 Trying to find application with firebaseUid: ${participantId}`);
                const applicationByFirebaseUid = await storage.getApplicationByFirebaseUid(participantId);
                if (applicationByFirebaseUid) {
                  participant = applicationByFirebaseUid;
                  console.log(`✅ Found application by firebaseUid: ${applicationByFirebaseUid.name}`);
                } else {
                  console.log(`❌ No application found with firebaseUid: ${participantId}`);
                }
              } catch (error) {
                console.warn('Could not lookup participant by firebaseUid:', participantId, error);
              }
            }
            
            return {
              id: participantId,
              name: (participant as any)?.name || (participant as any)?.translatorName || (participant as any)?.username || 'Unknown User',
              email: (participant as any)?.email || participantId, // Use participantId as fallback if it's an email
              profileImage: (participant as any)?.profileImage || null
            };
          })
        );
        
        return {
          ...conversation,
          participantDetails
        };
      })
    );
    
    res.json(enhancedConversations);
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit, lastMessageId } = req.query;
    
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    
    const messages = await storage.getMessages(
      conversationId, 
      limit ? parseInt(limit as string) : 50,
      lastMessageId as string
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { senderId, content, type = 'text' } = req.body;
    
    if (!conversationId || !senderId || !content) {
      return res.status(400).json({ 
        error: 'Conversation ID, sender ID, and content are required' 
      });
    }
    
    const message = await storage.sendMessage(conversationId, senderId, content, type);
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.post('/conversations/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;
    
    if (!conversationId || !userId) {
      return res.status(400).json({ 
        error: 'Conversation ID and user ID are required' 
      });
    }
    
    await storage.markMessagesAsRead(conversationId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete a message
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;
    
    if (!messageId || !userId) {
      return res.status(400).json({ 
        error: 'Message ID and user ID are required' 
      });
    }
    
    await storage.deleteMessage(messageId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Edit a message
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, content } = req.body;
    
    if (!messageId || !userId || !content) {
      return res.status(400).json({ 
        error: 'Message ID, user ID, and content are required' 
      });
    }
    
    await storage.editMessage(messageId, userId, content);
    res.json({ success: true });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Create conversation from booking
router.post('/conversations/from-booking', async (req, res) => {
  try {
    const { bookingId, clientId, providerId } = req.body;
    
    if (!bookingId || !clientId || !providerId) {
      return res.status(400).json({ 
        error: 'Booking ID, client ID, and provider ID are required' 
      });
    }
    
    const conversation = await storage.createConversation(
      [clientId, providerId], 
      bookingId
    );
    
    res.json(conversation);
  } catch (error) {
    console.error('Error creating conversation from booking:', error);
    res.status(500).json({ error: 'Failed to create conversation from booking' });
  }
});

// Server-Sent Events for real-time updates (cost-effective)

// Stream messages for a conversation
router.get('/conversations/:conversationId/messages/stream', async (req, res) => {
  const { conversationId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  let lastMessageCount = 0;
  let lastMessageHash = '';
  let isConnected = true;
  
  // Function to send updates
  const sendUpdate = async () => {
    if (!isConnected) return;
    
    try {
      const messages = await storage.getMessages(conversationId);
      
      // Create a simple hash of the messages to detect changes
      const messageHash = JSON.stringify(messages.map(m => ({ id: m.id, content: m.content, createdAt: m.createdAt })));
      
      // Only send if there are actual changes (new messages or content changes)
      if (messages.length !== lastMessageCount || messageHash !== lastMessageHash) {
        console.log(`📨 SSE: Sending ${messages.length} messages for conversation ${conversationId}`);
        res.write(`data: ${JSON.stringify(messages)}\n\n`);
        lastMessageCount = messages.length;
        lastMessageHash = messageHash;
      } else {
        console.log(`💤 SSE: No changes for conversation ${conversationId}, skipping update`);
      }
    } catch (error) {
      console.error('Error in SSE message stream:', error);
      // Don't close connection on error, just log it
    }
  };

  // Send initial data
  await sendUpdate();

  // Set up interval for updates (much less frequent than polling)
  const interval = setInterval(sendUpdate, 15000); // Every 15 seconds (increased from 10)

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE: Client disconnected from conversation ${conversationId}`);
    isConnected = false;
    clearInterval(interval);
  });

  // Handle connection errors
  req.on('error', (error) => {
    console.error(`❌ SSE: Error in conversation ${conversationId} stream:`, error);
    isConnected = false;
    clearInterval(interval);
  });
});

// Stream conversations for a user
router.get('/conversations/:userId/stream', async (req, res) => {
  const { userId } = req.params;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  let lastConversationCount = 0;
  let lastConversationHash = '';
  let isConnected = true;
  
  // Function to send updates
  const sendUpdate = async () => {
    if (!isConnected) return;
    
    try {
      const conversations = await storage.getConversations(userId);
      
      // Create a simple hash of the conversations to detect changes
      const conversationHash = JSON.stringify(conversations.map(c => ({ 
        id: c.id, 
        lastMessageAt: c.lastMessageAt,
        unreadCount: c.unreadCount 
      })));
      
      // Only send if there are actual changes
      if (conversations.length !== lastConversationCount || conversationHash !== lastConversationHash) {
        console.log(`📋 SSE: Sending ${conversations.length} conversations for user ${userId}`);
        res.write(`data: ${JSON.stringify(conversations)}\n\n`);
        lastConversationCount = conversations.length;
        lastConversationHash = conversationHash;
      } else {
        console.log(`💤 SSE: No changes for user ${userId} conversations, skipping update`);
      }
    } catch (error) {
      console.error('Error in SSE conversation stream:', error);
      // Don't close connection on error, just log it
    }
  };

  // Send initial data
  await sendUpdate();

  // Set up interval for updates (much less frequent than polling)
  const interval = setInterval(sendUpdate, 45000); // Every 45 seconds (increased from 30)

  // Clean up on client disconnect
  req.on('close', () => {
    console.log(`🔌 SSE: Client disconnected from user ${userId} conversations`);
    isConnected = false;
    clearInterval(interval);
  });

  // Handle connection errors
  req.on('error', (error) => {
    console.error(`❌ SSE: Error in user ${userId} conversations stream:`, error);
    isConnected = false;
    clearInterval(interval);
  });
});

export default router;
