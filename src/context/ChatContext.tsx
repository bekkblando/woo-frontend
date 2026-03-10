import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { getCSRFHeaders } from "../hooks/authentication_helper";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FunctionDefinition {
  name: string;
  arguments: any;
}

export interface Message {
  role: string;
  content: string;
  function_call?: FunctionDefinition;
}

export interface UploadedDocument {
  s3_key: string;
  filename: string;
  content_type: string;
  size?: number;
}

export interface ChatContextValue {
  // State
  accessToken: string | null;
  messages: Message[];
  animatedText: string;
  isComplete: boolean;
  loading: boolean;
  currentMessageKey: string;
  uploadedDocuments: UploadedDocument[];

  // Actions
  sendMessage: (message: string, files?: File[]) => Promise<void>;
  loadConversation: (accessToken: string) => Promise<void>;
  resetConversation: () => void;
  createConversation: () => Promise<string | null>;
  uploadDocuments: (files: File[]) => Promise<void>;
  removeDocument: (s3Key: string) => Promise<void>;

  /**
   * Register a callback that will be called for every function-call-style WS
   * event (questions_added, woo_question_answered, woo_question_progress, and
   * generic tool_calls). Chat.tsx uses this to bridge events into
   * RequestFormContext.
   */
  setFunctionCallHandler: (
    handler: ((def: FunctionDefinition) => void) | null
  ) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function generateSecureRandomKey(length = 16) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < array.length; i++) {
    result += characters.charAt(array[i] % characters.length);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type Props = { children: React.ReactNode };

export function ChatProvider({ children }: Props) {
  // ---- state ----
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [animatedText, setAnimatedText] = useState<string>("");
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentMessageKey, setCurrentMessageKey] = useState<string>(
    generateSecureRandomKey()
  );
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(
    []
  );

  // ---- refs ----
  const wsRef = useRef<ReconnectingWebSocket | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const functionCallHandlerRef = useRef<
    ((def: FunctionDefinition) => void) | null
  >(null);
  // Accumulated message content across WS chunks (closed-over in onmessage)
  const messageContentRef = useRef<string>("");
  // Track which groups we've subscribed to
  const subscribedGroupsRef = useRef<Set<string>>(new Set());

  // Keep ref in sync with state
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // ---- WebSocket lifecycle (app-level, single persistent connection) ----
  useEffect(() => {
    const wsUrl = BACKEND_URL.replace(/^http/, "ws") + "/ws/conversation/";
    const ws = new ReconnectingWebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Re-subscribe if we already had an active token (reconnection case)
      const token = accessTokenRef.current;
      if (token) {
        ws.send(JSON.stringify({ subscribe: token }));
        subscribedGroupsRef.current.add(token);
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const parsed = JSON.parse(event.data);

        // --- Non-chat events: delegate to registered handler ---
        if (parsed.type === "woo_question_answered") {
          functionCallHandlerRef.current?.({
            name: "woo_question_answered",
            arguments: parsed.data,
          });
          return;
        }
        if (parsed.type === "woo_question_progress") {
          functionCallHandlerRef.current?.({
            name: "woo_question_progress",
            arguments: parsed.data,
          });
          return;
        }
        if (parsed.type === "questions_added") {
          functionCallHandlerRef.current?.({
            name: "questions_added",
            arguments: parsed.data,
          });
          return;
        }

        // --- Streaming text chunks ---
        if (parsed.message) {
          messageContentRef.current += parsed.message;
          setAnimatedText((prev) => prev + parsed.message);
          return;
        }

        // --- Tool calls ---
        if (parsed.tool_calls) {
          const toolCalls = parsed.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            const firstTool = toolCalls[0];
            if (firstTool.function) {
              functionCallHandlerRef.current?.({
                name: firstTool.function.name,
                arguments: firstTool.function.arguments,
              });
            }
          }
          return;
        }

        // --- Completion ---
        if (parsed.completed || parsed.type === "complete") {
          const raw = messageContentRef.current;
          if (raw) {
            // Prefer backend-processed content (org-tag replacement) when available
            const finalContent = parsed.content || raw;
            setIsComplete(true);
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: finalContent },
            ]);
            messageContentRef.current = "";
            setAnimatedText("");
          }
          return;
        }

        // --- Error ---
        if (parsed.type === "error") {
          console.error("WS error event:", parsed.error);
        }
      } catch (e) {
        console.error("Failed to parse WS message", e);
      }
    };

    ws.onerror = (event) => {
      console.error("WebSocket error", event);
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, []);

  // ---- helpers ----

  /** Subscribe the WS to a conversation group (idempotent). */
  const wsSubscribe = useCallback((token: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ subscribe: token }));
      subscribedGroupsRef.current.add(token);
    }
  }, []);

  /** Send a dispatch command via WS to trigger Celery LLM streaming. */
  const wsDispatch = useCallback((token: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ dispatch: token }));
    }
  }, []);

  /** Upload files and return the effective access_token. */
  const uploadFiles = useCallback(
    async (files: File[]): Promise<string | null> => {
      let token = accessTokenRef.current;
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (token) {
          formData.append("access_token", token);
        }

        const res = await fetch(`${BACKEND_URL}/api/conversations/upload/`, {
          method: "POST",
          headers: getCSRFHeaders(),
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload file");
        }

        const data = await res.json();
        if (data.access_token) {
          token = data.access_token;
          accessTokenRef.current = token;
          setAccessToken(token);
          wsSubscribe(token);
        }
        if (data.document) {
          setUploadedDocuments((prev) => [
            ...prev,
            data.document as UploadedDocument,
          ]);
        }
      }
      return token;
    },
    [wsSubscribe]
  );

  // ---- public API ----

  const sendMessage = useCallback(
    async (message: string, files?: File[]) => {
      try {
        setIsComplete(false);
        setAnimatedText("");
        messageContentRef.current = "";
        setCurrentMessageKey(generateSecureRandomKey());
        setMessages((prev) => [...prev, { role: "user", content: message }]);

        // Upload files first if provided
        let activeToken = accessTokenRef.current;
        if (files && files.length > 0) {
          const newToken = await uploadFiles(files);
          if (newToken) activeToken = newToken;
        }

        // POST to save message (non-blocking — no LLM work)
        const response = await fetch(
          `${BACKEND_URL}/api/conversations/send-message/`,
          {
            method: "POST",
            headers: getCSRFHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({
              access_token: activeToken || null,
              message,
            }),
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to send message");
        }

        const data = await response.json();
        const token = data.access_token;

        // Update token state
        if (token) {
          accessTokenRef.current = token;
          setAccessToken(token);

          // Subscribe then dispatch (sequential on the same WS, so subscribe
          // is guaranteed to complete before dispatch is processed)
          wsSubscribe(token);
          wsDispatch(token);
        }
      } catch (error) {
        console.error("Failed to send message", error);
      }
    },
    [uploadFiles, wsSubscribe, wsDispatch]
  );

  const loadConversation = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/conversations/${token}/`,
          { credentials: "include" }
        );
        if (!response.ok) {
          console.error("Failed to fetch conversation");
          return;
        }
        const data = await response.json();

        // Populate chat state
        setAccessToken(token);
        accessTokenRef.current = token;
        setMessages(data.messages || []);
        setUploadedDocuments(data.documents || []);

        // Populate RequestFormContext via the function call handler
        // (questions/answers come from the conversation's woo_request,
        //  documents come from the conversation itself)
        functionCallHandlerRef.current?.({
          name: "load_conversation_data",
          arguments: {
            questions: data.woo_request?.questions || [],
            documents: data.documents || [],
          },
        });

        // Subscribe WS to this conversation
        wsSubscribe(token);
      } catch (error) {
        console.error("Error fetching conversation:", error);
      } finally {
        setLoading(false);
      }
    },
    [wsSubscribe]
  );

  const resetConversation = useCallback(() => {
    setAccessToken(null);
    accessTokenRef.current = null;
    setMessages([]);
    setAnimatedText("");
    messageContentRef.current = "";
    setIsComplete(false);
    setLoading(false);
    setUploadedDocuments([]);
    setCurrentMessageKey(generateSecureRandomKey());
    subscribedGroupsRef.current.clear();
  }, []);

  const createConversation = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/conversations/create/`,
        {
          method: "POST",
          headers: getCSRFHeaders({ "Content-Type": "application/json" }),
          credentials: "include",
        }
      );

      if (!response.ok) {
        console.error("Failed to create conversation");
        return null;
      }

      const data = await response.json();
      const token = data.access_token;

      setAccessToken(token);
      accessTokenRef.current = token;
      wsSubscribe(token);

      return token;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  }, [wsSubscribe]);

  const uploadDocuments = useCallback(
    async (files: File[]) => {
      await uploadFiles(files);
    },
    [uploadFiles]
  );

  const removeDocument = useCallback(async (s3Key: string) => {
    const token = accessTokenRef.current;
    if (!token) return;

    const res = await fetch(
      `${BACKEND_URL}/api/conversations/${token}/documents/delete/`,
      {
        method: "DELETE",
        headers: getCSRFHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ s3_key: s3Key }),
        credentials: "include",
      }
    );

    if (res.ok || res.status === 204) {
      setUploadedDocuments((prev) => prev.filter((d) => d.s3_key !== s3Key));
    } else {
      const errData = await res.json().catch(() => ({}));
      console.error("Failed to delete document", errData);
    }
  }, []);

  const setFunctionCallHandler = useCallback(
    (handler: ((def: FunctionDefinition) => void) | null) => {
      functionCallHandlerRef.current = handler;
    },
    []
  );

  // ---- context value ----

  const value = useMemo<ChatContextValue>(
    () => ({
      accessToken,
      messages,
      animatedText,
      isComplete,
      loading,
      currentMessageKey,
      uploadedDocuments,
      sendMessage,
      loadConversation,
      resetConversation,
      createConversation,
      uploadDocuments,
      removeDocument,
      setFunctionCallHandler,
    }),
    [
      accessToken,
      messages,
      animatedText,
      isComplete,
      loading,
      currentMessageKey,
      uploadedDocuments,
      sendMessage,
      loadConversation,
      resetConversation,
      createConversation,
      uploadDocuments,
      removeDocument,
      setFunctionCallHandler,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
