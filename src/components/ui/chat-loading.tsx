/**
 * Animated "typing" indicator shown while the chat is loading.
 * Three dots pulse in sequence to mimic a conversational typing bubble.
 */
const ChatLoading = () => {
    return (
        <div className="flex justify-start w-full">
            <div className="bg-[#EFF7FC] border-2 border-[#03689B] px-4 py-3 rounded-md inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#03689B] animate-[chatBounce_1.4s_ease-in-out_infinite]" />
                <span className="w-2 h-2 rounded-full bg-[#03689B] animate-[chatBounce_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="w-2 h-2 rounded-full bg-[#03689B] animate-[chatBounce_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
        </div>
    );
};

export default ChatLoading;
