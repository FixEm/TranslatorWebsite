import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";
import {
  Send,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  X,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  chatAPI,
  type Message,
  type Conversation,
} from "../lib/firebase-client";

interface ChatProps {
  conversationId: string;
  currentUserId: string;
  conversation?: Conversation;
  onClose?: () => void;
}

// Throttle function to limit frequent updates
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export default function Chat({
  conversationId,
  currentUserId,
  conversation,
  onClose,
}: ChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isIdle, setIsIdle] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for optimization
  const MESSAGE_LIMIT = 50;
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const TYPING_DEBOUNCE = 2000; // 2 seconds

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Clear new messages indicator when scrolling to bottom
    setHasNewMessages(false);
  }, []);

  // Update last activity and reset idle state
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isIdle) {
      setIsIdle(false);
      // Reconnect listener when user becomes active
      setupMessageListener();
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

  // Setup message listener with optimization
  const setupMessageListener = useCallback(() => {
    if (!conversationId || isIdle) return;

    console.log(
      "🔗 Setting up message listener for conversation:",
      conversationId
    );

    // Clean up existing listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Create real-time listener for messages
    unsubscribeRef.current = chatAPI.listenToMessages(
      conversationId,
      (newMessages) => {
        // Only update if there are actually new messages
        if (newMessages.length > messages.length) {
          console.log(
            "📨 New messages received:",
            newMessages.length - messages.length
          );
          setMessages(newMessages);
          setHasNewMessages(true);

          // Auto-scroll if user is at bottom
          const scrollArea = scrollAreaRef.current;
          if (scrollArea) {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
            if (isAtBottom) {
              setTimeout(scrollToBottom, 100);
            }
          }
        }
      }
    );
  }, [conversationId, messages.length, isIdle, scrollToBottom]);

  // Load messages with pagination
  const loadMessages = useCallback(
    async (isInitial = true) => {
      try {
        if (isInitial) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const fetchedMessages = await chatAPI.getMessages(
          conversationId,
          MESSAGE_LIMIT,
          isInitial ? undefined : messages[0]?.id
        );

        if (isInitial) {
          setMessages(fetchedMessages);
          setHasMoreMessages(fetchedMessages.length === MESSAGE_LIMIT);
        } else {
          // Prepend older messages
          setMessages((prev) => [...fetchedMessages, ...prev]);
          setHasMoreMessages(fetchedMessages.length === MESSAGE_LIMIT);
        }

        // Mark messages as read (throttled to reduce writes)
        if (isInitial) {
          await chatAPI.markMessagesAsRead(conversationId, currentUserId);
        }

        // Only auto-scroll on initial load
        if (isInitial) {
          setTimeout(scrollToBottom, 100);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
        if (isInitial) {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          });
        }
      } finally {
        if (isInitial) {
          setIsLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    },
    [conversationId, currentUserId, messages, toast, scrollToBottom]
  );

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(() => {
    if (!isLoadingMore && hasMoreMessages) {
      loadMessages(false);
    }
  }, [isLoadingMore, hasMoreMessages, loadMessages]);

  // Throttled mark as read function
  const throttledMarkAsRead = useCallback(
    throttle(async () => {
      try {
        await chatAPI.markMessagesAsRead(conversationId, currentUserId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }, 5000), // Only mark as read every 5 seconds
    [conversationId, currentUserId]
  );

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
      updateActivity(); // Track activity when sending message

      const message = await chatAPI.sendMessage(
        conversationId,
        currentUserId,
        newMessage.trim()
      );
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string) => {
    try {
      updateActivity(); // Track activity when deleting message
      await chatAPI.deleteMessage(messageId, currentUserId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast({
        title: "Message deleted",
        description: "Message has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  // Edit message
  const startEditing = (message: Message) => {
    updateActivity(); // Track activity when editing
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
      updateActivity(); // Track activity when saving edit
      await chatAPI.editMessage(
        editingMessageId,
        currentUserId,
        editContent.trim()
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId
            ? {
                ...msg,
                content: editContent.trim(),
                edited: true,
                editedAt: new Date(),
              }
            : msg
        )
      );
      setEditingMessageId(null);
      setEditContent("");
      toast({
        title: "Message updated",
        description: "Message has been updated successfully",
      });
    } catch (error) {
      console.error("Error editing message:", error);
      toast({
        title: "Error",
        description: "Failed to edit message",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  // Format timestamp
  const formatTime = (timestamp: any) => {
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

      if (diffDays === 0) {
        return date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
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

  // Get other participant details
  const getOtherParticipant = () => {
    if (!conversation?.participantDetails) return null;

    return conversation.participantDetails.find((p) => p.id !== currentUserId);
  };

  const otherParticipant = getOtherParticipant();

  // Initialize chat
  useEffect(() => {
    loadMessages(true);
    setupMessageListener();
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
  }, [conversationId]);

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

  // Handle scroll events to clear new messages indicator and load more messages
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      updateActivity(); // Track scroll activity

      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (isAtBottom && hasNewMessages) {
        setHasNewMessages(false);
        throttledMarkAsRead(); // Mark as read when scrolling to bottom
      }

      // Load more messages when scrolling to top
      if (scrollTop < 100 && hasMoreMessages && !isLoadingMore) {
        loadMoreMessages();
      }
    };

    scrollArea.addEventListener("scroll", handleScroll);
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, [
    hasNewMessages,
    hasMoreMessages,
    isLoadingMore,
    updateActivity,
    throttledMarkAsRead,
    loadMoreMessages,
  ]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center h-full">
          <div className="text-center">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={otherParticipant?.profileImage || undefined} />
              <AvatarFallback>
                {otherParticipant?.name?.charAt(0)?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherParticipant?.name || "Unknown User"}
              </CardTitle>
              <p className="text-sm text-gray-500">{otherParticipant?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {hasNewMessages && (
                  <Badge variant="destructive" className="text-xs">
                    New messages
                  </Badge>
                )}
                {isIdle && (
                  <Badge
                    variant="outline"
                    className="text-xs text-gray-500 cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      updateActivity();
                      setupMessageListener();
                    }}
                  >
                    Idle (click to reconnect)
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {/* Load more messages button */}
          {hasMoreMessages && (
            <div className="text-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMoreMessages}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load more messages"
                )}
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                const isEditing = editingMessageId === message.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyPress={handleEditKeyPress}
                            className="text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                              className="h-6 px-2 text-xs"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <p className="text-sm break-words flex-1">
                              {message.content}
                            </p>
                            {isOwnMessage && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 ml-2"
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => startEditing(message)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => deleteMessage(message.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs opacity-75">
                              {formatTime(message.createdAt)}
                              {message.edited && (
                                <span className="ml-1">(edited)</span>
                              )}
                            </span>
                            {isOwnMessage && (
                              <div className="ml-2">
                                {message.readBy?.length > 1 ? (
                                  <CheckCheck className="h-3 w-3 opacity-75" />
                                ) : (
                                  <Check className="h-3 w-3 opacity-75" />
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div ref={messagesEndRef} />
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
