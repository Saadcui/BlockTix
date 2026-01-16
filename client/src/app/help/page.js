'use client';
import React, { useState, useEffect, useRef } from 'react';

const HelpCenter = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi there! I'm Tixie, your BlockTix assistant. How can I help you today?", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate "AI" thinking and responding based on keywords
    setTimeout(() => {
      let aiResponse = "That's a great question! Let me find a specialist for you, or you can check our documentation.";
      const lowerInputText = input.toLowerCase();

      if (lowerInputText.includes('ticket')) aiResponse = "You can view your tickets in the 'My Wallet' section after connecting your wallet.";
      if (lowerInputText.includes('refund')) aiResponse = "Refunds are processed automatically if an event is cancelled. Check your smart contract status.";
      if (lowerInputText.includes('crypto') || lowerInputText.includes('pay')) aiResponse = "BlockTix supports Ethereum, Polygon, and USDC for all transactions.";

      setMessages((prev) => [...prev, { id: Date.now() + 1, text: aiResponse, sender: 'ai' }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/50 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/50 blur-[120px]" />

      <div className="relative z-10 w-full max-w-4xl grid md:grid-cols-[1fr_2fr] gap-8">
        
        {/* Left Side: Info */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-black text-gray-900 mb-6">
            Help <span className="text-violet-600">Center</span>
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            Can't find what you're looking for? Chat with our AI assistant, Tixie, for instant support on blockchain ticketing.
          </p>
          <div className="space-y-4">
            {['How to buy tickets?', 'Connecting your wallet', 'Reselling on BlockTix'].map((item) => (
              <button 
                key={item}
                onClick={() => setInput(item)}
                className="block w-full text-left p-3 rounded-xl bg-white/50 border border-white/80 hover:bg-white transition-all text-sm font-semibold text-violet-700"
              >
                {item} →
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Chat Bot Window */}
        <div className="h-[600px] bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-white/40 border-b border-white/40 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-blue-500 flex items-center justify-center text-white font-bold">
              T
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Tixie AI</h3>
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Online</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                  m.sender === 'user' 
                  ? 'bg-violet-600 text-white rounded-tr-none' 
                  : 'bg-white/80 text-gray-800 rounded-tl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/80 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-4 bg-white/40 border-t border-white/40 flex gap-2">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Tixie something..."
              className="flex-1 bg-white/60 border border-white/80 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
            <button 
              type="submit"
              className="bg-violet-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/30"
            >
              Send
            </button>
          </form>
        </div>

      </div>
    </section>
  );
};

export default HelpCenter;