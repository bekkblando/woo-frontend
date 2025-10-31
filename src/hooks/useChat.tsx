import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";


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
    const wsRef = useRef<WebSocket | null>(null);


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
        const ws = new WebSocket(wsUrl);
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
                console.log('Parsed chunk', parsedChunk);
                if (parsedChunk.message) {
                    console.log('Received message', parsedChunk.message);
                    messageContent += parsedChunk.message;
                    setAnimatedText(prev => prev + parsedChunk.message);
                    console.log('Animated text', animatedText);
                } else if (parsedChunk.function_call) {
                    const fullFunctionCallDefinition = {
                        name: parsedChunk.function_call.name,
                        arguments: parsedChunk.function_call.arguments
                    };
                    functionsCaller(fullFunctionCallDefinition);
                } else if (parsedChunk.completed || parsedChunk.type === 'complete') {
                    if (messageContent) {
                        updateMessagesWhenCompleted(messageContent);
                        messageContent = "";
                        setAnimatedText("");
                    }
                    // After first response completes, push chatId to URL once to avoid remounts during streaming
                    if (parsedChunk.conversation_id && searchParams.get('chatId') !== parsedChunk.conversation_id) {
                        console.log('Pushing chatId to URL', parsedChunk.conversation_id);
                        setSearchParams({ chatId: parsedChunk.conversation_id }, { replace: true } as any);
                    }
                }
            } catch (e) {
                console.error('Failed to parse WS message', e);
            }
        };

        ws.onerror = (event: Event) => {
            console.error('WebSocket error', event);
            console.error('WebSocket error');
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

            console.log('Sending message', message, wsRef.current, wsRef.current?.readyState);
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const idToUse = conversationId;
                wsRef.current.send(JSON.stringify({ conversation_id: idToUse, message }));
            } else {
                console.error('WebSocket is not open');
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    }, [conversationId]);
    
    function extractJsonObjects(chunkValue:string) {
        const jsonStrings = [];
        let bracketCount = 0;
        let currentJson = "";
    
        for (let i = 0; i < chunkValue.length; i++) {
            const char = chunkValue[i];
    
            if (char === '{') {
                if (bracketCount === 0) {
                    currentJson = char;
                } else {
                    currentJson += char;
                }
                bracketCount++;
            } else if (char === '}') {
                bracketCount--;
                currentJson += char;
    
                if (bracketCount === 0) {
                    jsonStrings.push(currentJson);
                    currentJson = "";
                }
            } else if (bracketCount > 0) {
                currentJson += char;
            }
        }
    
        const jsonObjects:any = [];
    
        jsonStrings.forEach(jsonString => {
            try {
                const parsedChunk = JSON.parse(jsonString);
                jsonObjects.push(parsedChunk);
            } catch (error) {
                console.error('Failed to parse JSON:', error);
            }
        });
    
        return jsonObjects;
    }
    return { messages, animatedText, isComplete, sendMessage, loading, currentMessageKey };
};



export default useChat;
