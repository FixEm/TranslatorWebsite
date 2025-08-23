import React, { useState, useEffect, useRef } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Clear new messages indicator when scrolling to bottom
    setHasNewMessages(false);
  };

  // Load messages
  const loadMessages = async (isPolling = false) => {
    try {
      // Only show loading state on initial load, not during polling
      if (!isPolling) {
        setIsLoading(true);
      }

      const fetchedMessages = await chatAPI.getMessages(conversationId);

      // If polling, only update if there are new messages
      if (isPolling) {
        const hasNewMessagesCount = fetchedMessages.length > messages.length;
        if (!hasNewMessagesCount) {
          return; // No new messages, don't update state
        }
        // Set flag to show new messages indicator
        setHasNewMessages(true);
      }

      setMessages(fetchedMessages);

      // Mark messages as read
      await chatAPI.markMessagesAsRead(conversationId, currentUserId);

      // Only auto-scroll on initial load or if user is at bottom
      if (!isPolling) {
        setTimeout(scrollToBottom, 100);
      } else {
        // During polling, only scroll if user is already at bottom
        const scrollArea = scrollAreaRef.current;
        if (scrollArea) {
          const { scrollTop, scrollHeight, clientHeight } = scrollArea;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
          if (isAtBottom) {
            setTimeout(scrollToBottom, 100);
          }
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      if (!isPolling) {
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    } finally {
      if (!isPolling) {
        setIsLoading(false);
      }
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      setIsSending(true);
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
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const saveEdit = async () => {
    if (!editingMessageId || !editContent.trim()) return;

    try {
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

  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Handle scroll events to clear new messages indicator
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
      if (isAtBottom && hasNewMessages) {
        setHasNewMessages(false);
      }
    };

    scrollArea.addEventListener("scroll", handleScroll);
    return () => scrollArea.removeEventListener("scroll", handleScroll);
  }, [hasNewMessages]);

  // Set up real-time listener for new messages (cost-effective)
  useEffect(() => {
    if (!conversationId) return;

    // Create real-time listener for messages
    const unsubscribe = chatAPI.listenToMessages(
      conversationId,
      (newMessages) => {
        // Only update if there are actually new messages
        if (newMessages.length > messages.length) {
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

    return () => unsubscribe();
  }, [conversationId]);

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
              {hasNewMessages && (
                <Badge variant="destructive" className="text-xs mt-1">
                  New messages
                </Badge>
              )}
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
