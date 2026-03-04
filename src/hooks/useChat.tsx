import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getCSRFHeaders } from './authentication_helper';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";


export interface FunctionDefinition {
    name: string;
    arguments: string;
}

interface Message {
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

interface UseChatReturn {
    messages: Message[];
    animatedText: string;
    isComplete: boolean;
    sendMessage: (message: string, files?: File[]) => Promise<void>;
    loading: boolean;
    currentMessageKey: string;
    uploadedDocuments: UploadedDocument[];
    removeDocument: (s3Key: string) => Promise<void>;
    uploadDocuments: (files: File[]) => Promise<void>;
}


function generateSecureRandomKey(length = 16) {
    const array = new Uint8Array(length);
    // Fill the array with cryptographically secure random values
    window.crypto.getRandomValues(array);
    // Convert the random values to a string of alphanumeric characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < array.length; i++) {
      result += characters.charAt(array[i] % characters.length);
    }
    return result;
  }
  
  

const useChat = (accessToken: string | null, functionsCaller: (functionDefinition: {name: string, arguments: string}) => void, defaultMessage = "Hello, how can I help you?", initialMessages: Message[] | null = null): UseChatReturn => {
    // Initialize messages from initialMessages if provided, otherwise empty array
    const [messages, setMessages] = useState<Message[]>(initialMessages && initialMessages.length > 0 ? initialMessages : []);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [animatedText, setAnimatedText] = useState<string>("");
    // Set loading to false if we have initial messages (they're already loaded)
    const [loading, setLoading] = useState<boolean>(!(initialMessages && initialMessages.length > 0));
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentMessageKey, setCurrentMessageKey] = useState<string>(generateSecureRandomKey());
    const wsRef = useRef<ReconnectingWebSocket | null>(null);
    const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
    // Track the effective access token (may be set before searchParams update)
    const effectiveAccessTokenRef = useRef<string | null>(accessToken);


    // Update messages if initialMessages change (e.g., when conversation is loaded)
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
            setLoading(false);
        }
    }, [initialMessages]);

    useEffect(() => {
        // Initialize websocket connection
        const wsUrl = BACKEND_URL.replace(/^http/, 'ws') + '/ws/conversation/';
        const ws = new ReconnectingWebSocket(wsUrl);
        wsRef.current = ws;
        let messageContent = "";

        ws.onopen = () => {
            setLoading(false);
            // Only set default message if no accessToken and no initialMessages
            if (!accessToken && (!initialMessages || initialMessages.length === 0)) {
                setMessages([{ role: 'assistant', content: defaultMessage }]);
            }
            wsRef.current = ws;
            // Subscribe to conversation group if we already have an access token
            if (accessToken) {
                ws.send(JSON.stringify({ subscribe: accessToken }));
            }
            console.log('WebSocket opened');
        };

        console.log('Rendered accessToken', accessToken);
        ws.onmessage = (event: MessageEvent) => {
            try {
                const parsedChunk = JSON.parse(event.data);
                console.log('Parsed chunk', parsedChunk, parsedChunk.type === "woo_question_answered");
                if (parsedChunk.type === "woo_question_answered") {
                    console.log('Parsed chunk answer', parsedChunk);
                    console.log('Received woo question answered', parsedChunk.data);
                    functionsCaller({
                        name: "woo_question_answered",
                        arguments: parsedChunk.data
                    });
                } else if (parsedChunk.type === "woo_question_progress") {
                    functionsCaller({
                        name: "woo_question_progress",
                        arguments: parsedChunk.data
                    });
                } else if (parsedChunk.type === "questions_added") {
                    console.log('Received questions_added', parsedChunk.data);
                    functionsCaller({
                        name: "questions_added",
                        arguments: parsedChunk.data
                    });
                } else if (parsedChunk.message) {
                    console.log('Received message', parsedChunk.message);
                    messageContent += parsedChunk.message;
                    setAnimatedText(prev => prev + parsedChunk.message);
                    console.log('Animated text', animatedText);
                } else if (parsedChunk.tool_calls) {
                    // Handle modern tool_calls format
                    const toolCalls = parsedChunk.tool_calls;
                    if (toolCalls && toolCalls.length > 0) {
                        // Use the first tool call (most common case)
                        const firstTool = toolCalls[0];
                        if (firstTool.function) {
                            const fullFunctionCallDefinition = {
                                name: firstTool.function.name,
                                arguments: firstTool.function.arguments
                            };
                            functionsCaller(fullFunctionCallDefinition);
                        }
                    }
                } else if (parsedChunk.completed || parsedChunk.type === 'complete') {
                    if (messageContent) {
                        // Use processed content from backend (with [ORG:ID] tags replaced)
                        // if available, otherwise fall back to raw accumulated content
                        const finalContent = parsedChunk.content || messageContent;
                        updateMessagesWhenCompleted(finalContent);
                        messageContent = "";
                        setAnimatedText("");
                    }
                    // After first response completes, push accessToken to URL once to avoid remounts during streaming
                    if (parsedChunk.access_token && searchParams.get('accessToken') !== parsedChunk.access_token) {
                        console.log('Pushing accessToken to URL', parsedChunk.access_token);
                        setSearchParams({ accessToken: parsedChunk.access_token }, { replace: true } as any);
                    }
                }
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.onerror = (event) => {
            console.error('WebSocket error', event);
        };

        ws.onclose = () => {
            console.error('WebSocket closed');
            wsRef.current = null;
        };

        return () => {
            ws.close();
        };
    }, []);

    // Keep effectiveAccessTokenRef in sync
    useEffect(() => {
        effectiveAccessTokenRef.current = accessToken;
    }, [accessToken]);

    const updateMessagesWhenCompleted = (messageContent:string) => {
        setIsComplete(true);
        setMessages(prevMessages => [...prevMessages, {role: "assistant", content: messageContent}]);
    }

    const uploadFiles = useCallback(async (files: File[]): Promise<string | null> => {
        let token = effectiveAccessTokenRef.current;
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            if (token) {
                formData.append('access_token', token);
            }

            const res = await fetch(`${BACKEND_URL}/api/conversations/upload/`, {
                method: 'POST',
                headers: getCSRFHeaders(),
                body: formData,
                credentials: 'include'
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to upload file');
            }

            const data = await res.json();
            // Use the access_token returned from the upload (may be newly created)
            if (data.access_token) {
                token = data.access_token;
                effectiveAccessTokenRef.current = token;
                // Subscribe the WebSocket to the conversation group
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ subscribe: token }));
                }
            }
            if (data.document) {
                setUploadedDocuments(prev => [...prev, data.document as UploadedDocument]);
            }
        }
        return token;
    }, []);

    const removeDocument = useCallback(async (s3Key: string) => {
        const token = effectiveAccessTokenRef.current;
        if (!token) return;

        const res = await fetch(
            `${BACKEND_URL}/api/conversations/${token}/documents/delete/`,
            {
                method: 'DELETE',
                headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ s3_key: s3Key }),
                credentials: 'include'
            }
        );

        if (res.ok || res.status === 204) {
            setUploadedDocuments(prev => prev.filter(d => d.s3_key !== s3Key));
        } else {
            const errData = await res.json().catch(() => ({}));
            console.error('Failed to delete document', errData);
        }
    }, []);

    // Upload documents immediately (without requiring a message)
    const uploadDocuments = useCallback(async (files: File[]) => {
        await uploadFiles(files);
    }, [uploadFiles]);

    const sendMessage = useCallback(async (message: string, files?: File[]) => {
        try {
            setIsComplete(false);
            setAnimatedText("");
            setCurrentMessageKey(generateSecureRandomKey());
            setMessages(prevMessages => [...prevMessages, {role: "user", content: message}]);

            // Upload files first if provided
            let activeToken = effectiveAccessTokenRef.current || accessToken;
            if (files && files.length > 0) {
                const newToken = await uploadFiles(files);
                if (newToken) activeToken = newToken;
            }

            // Send message via HTTP POST instead of WebSocket
            const response = await fetch(`${BACKEND_URL}/api/conversations/send-message/`, {
                method: 'POST',
                headers: getCSRFHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({
                    access_token: activeToken || null,
                    message: message
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            // Update accessToken if we got a new one
            if (data.access_token) {
                effectiveAccessTokenRef.current = data.access_token;
                // Subscribe the WebSocket to the new conversation group
                if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ subscribe: data.access_token }));
                }
            }
            if (data.access_token && data.access_token !== accessToken) {
                setSearchParams({ accessToken: data.access_token }, { replace: true } as any);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    }, [accessToken, setSearchParams, uploadFiles]);
    
    return { messages, animatedText, isComplete, sendMessage, loading, currentMessageKey, uploadedDocuments, removeDocument, uploadDocuments };
};



export default useChat;
