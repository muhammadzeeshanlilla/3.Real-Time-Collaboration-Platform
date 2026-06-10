export interface ChatMessage {
  id: number;
  workspace: number;
  sender: number;
  sender_username: string;
  sender_email: string;
  content: string;
  created_at: string;
}

export interface MessageListResponse {
  messages: ChatMessage[];
}

export interface SendMessageData {
  content: string;
}

export interface SendMessageResponse {
  message: string;
  chat_message: ChatMessage;
}