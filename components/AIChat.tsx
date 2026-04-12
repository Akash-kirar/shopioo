import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MapPin, ShoppingBag } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Shop, Item } from '../types';

interface AIChatProps {
  shops: Shop[];
  items: Item[];
  userLocation: { lat: number; lng: number } | null;
  locationName: string;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const AILogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="ai_gradient_chat" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a82283" />
        <stop stopColor="#6366f1" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#ai_gradient_chat)" />
    <path d="M50 20C53 40 60 47 80 50C60 53 53 60 50 80C47 60 40 53 20 50C40 47 47 40 50 20Z" fill="white" />
    <path d="M75 25C77 35 82 40 92 42C82 44 77 49 75 59C73 49 68 44 58 42C68 40 73 35 75 25Z" fill="white" opacity="0.6" />
  </svg>
);

export const AIChat: React.FC<AIChatProps> = ({ shops, items, userLocation, locationName }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hi! I'm your Shopioo AI Assistant. I have real-time access to all ${shops.length} shops and ${items.length} products listed here. \n\nAsk me anything like:\n"Where can I find red shoes?"\n"Which shop is closest to me?"\n"Suggest a gift under ₹500"`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Construct context about the current app state
      const appData = {
        userContext: {
            location: locationName,
            coordinates: userLocation
        },
        shops: shops.map(s => ({
            name: s.name,
            category: s.category,
            address: s.address,
            openingTime: s.openingTime,
            closingTime: s.closingTime
        })),
        products: items.map(i => ({
            name: i.name,
            price: i.price,
            category: i.category,
            shopName: shops.find(s => s.id === i.shopId)?.name || 'Unknown Shop',
            tags: i.tag
        }))
      };

      const systemPrompt = `You are the Shopioo AI Assistant, an expert shopping concierge. 
      You have access to the current database of shops and products in the user's area.
      
      CURRENT DATA CONTEXT:
      ${JSON.stringify(appData)}

      INSTRUCTIONS:
      1. Answer the user's question specifically using the provided data.
      2. If they ask for a product, list the specific item names, prices, and which shop sells them.
      3. If they ask about location, use the user's current location to estimate proximity (qualitatively).
      4. Be helpful, friendly, and concise. Use emojis where appropriate.
      5. If the answer isn't in the data, suggest a similar category or shop that might help.
      6. Format prices clearly in ₹.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Build chat history for the model
      const history = messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
            ...history,
            { role: 'user', parts: [{ text: `System Context: ${systemPrompt}\n\nUser Query: ${input}` }] }
        ]
      });

      const text = response.text || "I'm having trouble connecting to the AI brain right now. Please try again.";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-10 h-10 shadow-md rounded-full overflow-hidden">
            <AILogo className="w-full h-full" />
        </div>
        <div>
            <h1 className="font-black text-lg text-gray-900 leading-none">Shopioo AI</h1>
            <p className="text-xs font-bold text-gray-500 mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Online • {items.length} Products Loaded
            </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-gray-200' : 'bg-transparent overflow-hidden'}`}>
                            {isUser ? <User className="w-4 h-4 text-gray-600" /> : <AILogo className="w-8 h-8" />}
                        </div>
                        <div className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isUser 
                            ? 'bg-gray-900 text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            <span className={`text-[10px] block mt-1 opacity-60 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>
            );
        })}
        {isLoading && (
             <div className="flex justify-start">
                <div className="flex gap-2 max-w-[85%]">
                    <div className="w-8 h-8 overflow-hidden rounded-full shrink-0 mt-1">
                        <AILogo className="w-full h-full" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                        <div className="flex gap-1">
                            <span className="w-2 h-2 bg-[#a82283] rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-[#a82283] rounded-full animate-bounce delay-75"></span>
                            <span className="w-2 h-2 bg-[#a82283] rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="relative flex items-center">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, shops, prices..."
                className="w-full bg-gray-100 text-gray-900 text-sm rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-[#a82283]/50 focus:bg-white transition-all border border-transparent focus:border-[#a82283]/20 font-medium"
            />
            <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-[#a82283] text-white rounded-full shadow-lg disabled:opacity-50 disabled:shadow-none hover:bg-[#8e1d6f] transition-all active:scale-90"
            >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
            </button>
        </form>
      </div>
    </div>
  );
};