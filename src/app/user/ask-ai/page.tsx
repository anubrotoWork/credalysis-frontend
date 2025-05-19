'use client';
import { useEffect, useRef, useState } from 'react';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function AskAIPage() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmailState] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = "http://34.9.145.33:8000";

  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    setEmailState(storedEmail);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleAsk = async () => {
    if (!query.trim() || !email) {
      if (!email) alert("User email not found. Please log in again.");
      return;
    }
    const userMessage: Message = { sender: 'user', text: query };
    setChat((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${backendApiUrl}/user/ask-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, query: currentQuery }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "An unknown error occurred" }));
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const aiText = data.response?.response || data.response || "Sorry, I couldn't get a response.";
      const aiMessage: Message = { sender: 'ai', text: aiText };
      setChat((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error asking AI:", error);
      const errorMessageText = error instanceof Error ? error.message : "Could not process your request.";
      // Avoid overly long technical error messages in chat
      const displayError = errorMessageText.length > 150 ? "An error occurred. Please try again." : `Error: ${errorMessageText}`;
      const errorMessage: Message = { sender: 'ai', text: displayError };
      setChat((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto'; // Reset height
    const maxHeight = 120; // Corresponds to style={{ maxHeight: '120px' }}
    const scrollHeight = e.target.scrollHeight;
    e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    if (scrollHeight > maxHeight) {
        e.target.style.overflowY = 'auto';
    } else {
        e.target.style.overflowY = 'hidden'; // Hide scrollbar if content fits
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-start"> {/* Full page wrapper */}
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] flex flex-col p-6"> {/* Chat container */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-indigo-600 text-center border-b border-gray-300 pb-4">
          Ask Credalysis AI
        </h1>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar"> {/* Chat messages area */}
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-xl text-sm sm:text-base whitespace-pre-wrap shadow break-words ${
                msg.sender === 'user'
                  ? 'ml-auto bg-indigo-600 text-white rounded-br-none' // User message style
                  : 'mr-auto bg-gray-200 text-gray-800 rounded-bl-none' // AI message style
              }`}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div className="mr-auto bg-gray-200 text-gray-700 text-sm sm:text-base p-3 rounded-xl rounded-bl-none max-w-[80%] shadow">
              <div className="flex items-center">
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1 animate-pulse delay-0"></span>
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full mr-1 animate-pulse delay-100"></span>
                <span className="inline-block w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-end gap-2 pt-4 border-t border-gray-300"> {/* Input area */}
          <textarea
            className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 custom-scrollbar"
            rows={1}
            placeholder="Type your question..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{ maxHeight: '120px' }} // overflowY will be handled by handleInputChange
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim() || !email}
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            Send
          </button>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a0aec0; /* gray-400 / gray-500 in Tailwind default */
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096; /* gray-500 / gray-600 in Tailwind default */
        }
        textarea {
          scrollbar-width: thin; /* For Firefox */
          scrollbar-color: #a0aec0 transparent; /* For Firefox */
        }
      `}</style>
    </div>
  );
}