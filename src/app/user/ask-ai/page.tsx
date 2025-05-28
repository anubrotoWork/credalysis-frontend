// src/app/user/ask-ai/page.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react'; // Added useCallback
import { useRouter } from 'next/navigation';
// You'll need to create this authFetch helper or implement its logic here
// import { authFetch } from '@/lib/authFetch'; 

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Create a simple authFetch function here if not imported from a lib
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.append('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('email');
      localStorage.removeItem('access');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
  return response;
}


export default function AskAIPage() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  // const [email, setEmailState] = useState<string | null>(null); // No longer need to store email from localStorage for sending
  const bottomRef = useRef<HTMLDivElement>(null);
  const backendApiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userAccessLevel = localStorage.getItem("access");
    // const storedEmail = localStorage.getItem("email"); // Not strictly needed for this page's core logic anymore

    if (!authToken) {
      console.log("AskAI: No authToken, redirecting to login.");
      router.push("/login");
      return;
    }

    if (userAccessLevel !== "user") {
      alert("You do not have permission to access this page.");
      router.push("/login");
      return;
    }
    // setEmailState(storedEmail); // No longer need to set email state for sending
    console.log("AskAI: User authenticated.");
  }, [router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleAsk = useCallback(async () => { // Wrapped in useCallback
    const currentQuery = query.trim(); // Trim query before check
    if (!currentQuery) { // Check trimmed query
      return;
    }
    if (!backendApiUrl) {
        alert("API URL is not configured.");
        return;
    }

    const userMessage: Message = { sender: 'user', text: currentQuery };
    setChat((prev) => [...prev, userMessage]);
    setQuery(''); // Clear input after getting currentQuery
    setLoading(true);

    try {
      // Use authFetch (or manually add Authorization header)
      const res = await authFetch(`${backendApiUrl}/user/ask-ai`, { // Ensure path matches router prefix if any
        method: 'POST',
        // headers: { 'Content-Type': 'application/json' }, // authFetch handles this
        body: JSON.stringify({ query: currentQuery }), // Only send the query
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "An unknown server error occurred" }));
        throw new Error(errorData.detail || `HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      // Adjust based on your actual backend response structure for AI text
      const aiText = data.response || "Sorry, I couldn't get a response for that."; 
      const aiMessage: Message = { sender: 'ai', text: aiText };
      setChat((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error asking AI:", error);
      const errorMessageText = error instanceof Error ? error.message : "Could not process your request.";
      const displayError = errorMessageText.length > 150 ? "An error occurred. Please try again." : `Error: ${errorMessageText}`;
      const errorMessage: Message = { sender: 'ai', text: displayError };
      setChat((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [query, backendApiUrl]); // Added router to dependencies for useCallback if it's used for nav on error

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
    e.target.style.height = 'auto';
    const maxHeight = 120;
    const scrollHeight = e.target.scrollHeight;
    e.target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    if (scrollHeight > maxHeight) {
        e.target.style.overflowY = 'auto';
    } else {
        e.target.style.overflowY = 'hidden';
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8 flex justify-center items-start">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-xl h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] flex flex-col p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-indigo-600 text-center border-b border-gray-300 pb-4">
          Ask Credalysis AI
        </h1>
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
          {chat.map((msg, index) => (
            <div
              key={index}
              className={`max-w-[85%] sm:max-w-[80%] p-3 rounded-xl text-sm sm:text-base whitespace-pre-wrap shadow break-words ${
                msg.sender === 'user'
                  ? 'ml-auto bg-indigo-600 text-white rounded-br-none'
                  : 'mr-auto bg-gray-200 text-gray-800 rounded-bl-none'
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
        <div className="flex items-end gap-2 pt-4 border-t border-gray-300">
          <textarea
            className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-500 custom-scrollbar"
            rows={1}
            placeholder="Type your question..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleAsk}
            disabled={loading || !query.trim()} // Removed !email check, auth is via token
            className="bg-indigo-600 text-white px-5 py-3 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed self-end"
          >
            Send
          </button>
        </div>
      </div>
      <style jsx global>{`
        /* ... (your custom-scrollbar styles) ... */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a0aec0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
        textarea {
          scrollbar-width: thin;
          scrollbar-color: #a0aec0 transparent;
        }
      `}</style>
    </div>
  );
}