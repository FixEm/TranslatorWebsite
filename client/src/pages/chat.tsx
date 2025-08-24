import React, { useState } from "react";
import { useAuth } from "../contexts/auth-context";
import ConversationList from "../components/conversation-list";
import Chat from "../components/chat";
import { Card, CardContent } from "../components/ui/card";
import { MessageSquare } from "lucide-react";
import { type Conversation } from "../lib/firebase-client";

export default function ChatPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Please Log In
            </h2>
            <p className="text-gray-500">
              You need to be logged in to access the chat system.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[80vh]">
        {/* Conversation List */}
        <div className="lg:col-span-1">
          <ConversationList
            currentUserId={user.id}
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <Chat
              conversationId={selectedConversation.id}
              currentUserId={user.id}
              conversation={selectedConversation}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <Card className="h-full">
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
