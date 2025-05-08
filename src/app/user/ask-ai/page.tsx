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
  const email = typeof window !== 'undefined' ? localStorage.getItem('email') : '';
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    const userMessage: Message = { sender: 'user', text: query };
    setChat((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    const res = await fetch('http://34.55.216.204:8000/user/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, query }),
    });
    const data = await res.json();
    const aiMessage: Message = { sender: 'ai', text: data.response.response };
    setChat((prev) => [...prev, aiMessage]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow h-[80vh] flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Ask Credalysis AI</h1>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 border rounded p-4 bg-gray-50">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
              msg.sender === 'user'
                ? 'ml-auto bg-blue-600 text-white'
                : 'mr-auto bg-gray-200 text-gray-800'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="mr-auto bg-gray-200 text-gray-600 text-sm p-3 rounded-lg max-w-[80%]">
            Typing...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2">
        <textarea
          className="flex-1 border rounded p-2 resize-none"
          rows={2}
          placeholder="Type your question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleAsk}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}