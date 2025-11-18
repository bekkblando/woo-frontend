import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReconnectingWebSocket from 'reconnecting-websocket';

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
interface UseChatReturn {
    messages: Message[];
    animatedText: string;
    isComplete: boolean;
    sendMessage: (message: string) => Promise<void>;
    loading: boolean;
    currentMessageKey: string;
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
  
  

const useChat = (conversationId: string | null, functionsCaller: (functionDefinition: {name: string, arguments: string}) => void, defaultMessage = "Hello, how can I help you?", initialMessages: Message[] | null = null): UseChatReturn => {
    // Initialize messages from initialMessages if provided, otherwise empty array
    const [messages, setMessages] = useState<Message[]>(initialMessages && initialMessages.length > 0 ? initialMessages : []);
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [animatedText, setAnimatedText] = useState<string>("");
    // Set loading to false if we have initial messages (they're already loaded)
    const [loading, setLoading] = useState<boolean>(!(initialMessages && initialMessages.length > 0));
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentMessageKey, setCurrentMessageKey] = useState<string>(generateSecureRandomKey());
    const wsRef = useRef<ReconnectingWebSocket | null>(null);


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
            // Only set default message if no conversationId and no initialMessages
            if ((!conversationId || isNaN(parseInt(conversationId))) && (!initialMessages || initialMessages.length === 0)) {
                setMessages([{ role: 'assistant', content: defaultMessage }]);
            }
            wsRef.current = ws;
            console.log('WebSocket opened');
        };

        console.log('Rendered Conversation ID', conversationId);
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
                        updateMessagesWhenCompleted(messageContent);
                        messageContent = "";
                        setAnimatedText("");
                    }
                    // After first response completes, push chatId to URL once to avoid remounts during streaming
                    if (parsedChunk.conversation_id && searchParams.get('chatId') !== parsedChunk.conversation_id || parsedChunk.woo_request_id !== searchParams.get('wooRequestId')) {
                        console.log('Pushing chatId to URL', parsedChunk.conversation_id);
                        setSearchParams({ chatId: parsedChunk.conversation_id, wooRequestId: parsedChunk.woo_request_id }, { replace: true } as any);
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

    const updateMessagesWhenCompleted = (messageContent:string) => {
        setIsComplete(true);
        setMessages(prevMessages => [...prevMessages, {role: "assistant", content: messageContent}]);
    }
    const sendMessage = useCallback(async (message: string) => {
        try {
            setIsComplete(false);
            setAnimatedText("");
            setCurrentMessageKey(generateSecureRandomKey());
            setMessages(prevMessages => [...prevMessages, {role: "user", content: message}]);

            // Send message via HTTP POST instead of WebSocket
            const response = await fetch(`${BACKEND_URL}/api/conversations/send-message/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    conversation_id: conversationId || null,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            // Update conversationId if we got a new one
            if ((data.conversation_id && data.conversation_id !== conversationId) && (data.woo_request_id && data.woo_request_id !== searchParams.get('wooRequestId'))) {
                setSearchParams({ chatId: data.conversation_id, wooRequestId: data.woo_request_id }, { replace: true } as any);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    }, [conversationId, setSearchParams]);
    
    return { messages, animatedText, isComplete, sendMessage, loading, currentMessageKey };
};



export default useChat;
