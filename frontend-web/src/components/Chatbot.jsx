import { useState, useRef, useEffect } from 'react';
import api from '../api/axios';

const SUGGESTIONS = [
  "How many orders are pending?",
  "What's the status of ticket #1234?",
  "What's on the menu today?",
  "How do I update an order status?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm KitchenBot. Ask me about orders, menu items, or anything kitchen-related." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(msg) {
    const text = (msg || input).trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const { data } = await api.post('/chatbot/', { message: text });
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-xl shadow-lg shadow-brand-500/30 transition-all active:scale-95 z-40 flex items-center justify-center"
        aria-label={open ? 'Close KitchenBot' : 'Open KitchenBot'}
      >
        {open ? 'x' : '?'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-80 max-h-[70vh] flex flex-col bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-40 overflow-hidden">
          <div className="bg-brand-500/20 border-b border-white/10 px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-white/80">KB</span>
            <div>
              <div className="text-white font-display font-semibold text-sm">KitchenBot</div>
              <div className="text-white/40 text-xs">Live order assistant</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-brand-500 text-white rounded-br-sm'
                    : 'bg-white/10 text-white/80 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{animationDelay:`${i*0.15}s`}} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-white/60 hover:text-white px-2 py-1 rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              className="input text-sm flex-1 py-2"
              placeholder="Ask KitchenBot..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && send()}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2 text-sm disabled:opacity-50">
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
