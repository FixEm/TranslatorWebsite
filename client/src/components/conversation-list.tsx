import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "../hooks/use-toast";
import { MessageSquare, Users, Plus, Search } from "lucide-react";
import { Input } from "./ui/input";
import { chatAPI, type Conversation } from "../lib/firebase-client";

interface ConversationListProps {
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onStartNewConversation?: () => void;
  autoSelectConversationId?: string | null;
}

export default function ConversationList({
  currentUserId,
  onSelectConversation,
  selectedConversationId,
  onStartNewConversation,
  autoSelectConversationId,
}: ConversationListProps) {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isIdle, setIsIdle] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for optimization
  const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes (longer for conversation list)

  // Update last activity and reset idle state
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
      // Reconnect listener when user becomes active
      setupConversationListener();
    }

    // Clear existing idle timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Set new idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      // Disconnect listener when idle
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }, IDLE_TIMEOUT);
  }, [isIdle]);

  // Setup conversation listener with optimization
  const setupConversationListener = useCallback(() => {
    if (!currentUserId || isIdle) return;

    console.log("🔗 Setting up conversation listener for user:", currentUserId);

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Create real-time listener for conversations
    unsubscribeRef.current = chatAPI.listenToConversations(
      currentUserId,
      (newConversations) => {
        console.log("📋 Conversations updated:", newConversations.length);
        setConversations(newConversations);
      }
    );
  }, [currentUserId, isIdle]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Loading conversations for user:", currentUserId);

      if (!currentUserId) {
        console.warn("⚠️ No currentUserId provided");
        setConversations([]);
        return;
      }

      const fetchedConversations = await chatAPI.getConversations(
        currentUserId
      );
      console.log("✅ Conversations loaded:", fetchedConversations.length);
      setConversations(fetchedConversations);
    } catch (error) {
      console.error("❌ Error loading conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, toast]);

  // Format timestamp for last message
  const formatLastMessageTime = (timestamp: any) => {
    try {
      let date: Date;

      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp);
      } else {
        return "";
      }

      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diff / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diff / (1000 * 60));

      if (diffMinutes < 1) {
        return "now";
      } else if (diffMinutes < 60) {
        return `${diffMinutes}m`;
      } else if (diffHours < 24) {
        return `${diffHours}h`;
      } else if (diffDays === 1) {
        return "yesterday";
      } else if (diffDays < 7) {
        return `${diffDays}d`;
      } else {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
    } catch (error) {
      return "";
    }
  };

  // Get other participant in conversation
  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation.participantDetails) return null;
    return conversation.participantDetails.find((p) => p.id !== currentUserId);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery.trim()) return true;

    const otherParticipant = getOtherParticipant(conversation);
    if (!otherParticipant) return false;

    const query = searchQuery.toLowerCase();
    return (
      otherParticipant.name.toLowerCase().includes(query) ||
      otherParticipant.email.toLowerCase().includes(query) ||
      conversation.lastMessage?.content.toLowerCase().includes(query)
    );
  });

  // Initialize conversation list
  useEffect(() => {
    loadConversations();
    setupConversationListener();
    updateActivity(); // Start activity tracking

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [currentUserId]);

  // Activity tracking effects
  useEffect(() => {
    const handleActivity = () => updateActivity();

    // Track user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateActivity]);

  // Auto-select conversation from URL parameter
  useEffect(() => {
    if (autoSelectConversationId && conversations.length > 0) {
      const targetConversation = conversations.find(
        (conv) => conv.id === autoSelectConversationId
      );
      if (targetConversation) {
        console.log(
          "🎯 Auto-selecting conversation from URL:",
          autoSelectConversationId
        );
        onSelectConversation(targetConversation);
      }
    }
  }, [autoSelectConversationId, conversations, onSelectConversation]);

  // Only show full loading screen on initial load, not during polling
  const isInitialLoading = isLoading && conversations.length === 0;

  if (isInitialLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages
            {isLoading && conversations.length > 0 && (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 ml-2" />
            )}
            {isIdle && (
              <Badge variant="outline" className="text-xs text-gray-500 ml-2">
                Idle
              </Badge>
            )}
          </CardTitle>
          {onStartNewConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                updateActivity();
                onStartNewConversation();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              updateActivity();
            }}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              {searchQuery ? (
                <div>
                  <p className="text-gray-500 mb-2">No conversations found</p>
                  <p className="text-sm text-gray-400">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">No conversations yet</p>
                  <p className="text-sm text-gray-400">
                    Start chatting with translators from your bookings
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => {
                const otherParticipant = getOtherParticipant(conversation);
                const unreadCount =
                  conversation.unreadCount?.[currentUserId] || 0;
                const isSelected = selectedConversationId === conversation.id;

                if (!otherParticipant) return null;

                return (
                  <div
                    key={conversation.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected ? "bg-red-50 border-r-2 border-red-600" : ""
                    }`}
                    onClick={() => {
                      updateActivity();
                      onSelectConversation(conversation);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={otherParticipant.profileImage || undefined}
                        />
                        <AvatarFallback>
                          {otherParticipant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {otherParticipant.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            {unreadCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatLastMessageTime(
                                conversation.lastMessageAt
                              )}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage ? (
                            <span>
                              {conversation.lastMessage.senderId ===
                                currentUserId && (
                                <span className="text-gray-400">You: </span>
                              )}
                              {conversation.lastMessage.content}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">
                              No messages yet
                            </span>
                          )}
                        </p>

                        {conversation.bookingId && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Booking Chat
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
