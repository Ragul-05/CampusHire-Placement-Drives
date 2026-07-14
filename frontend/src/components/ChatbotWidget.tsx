import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ChevronDown, ChevronUp, Loader2, MoonStar, Send, Sparkles, X } from 'lucide-react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

type JwtPayload = {
  role?: string;
  sub?: string;
  email?: string;
};

type ChatbotMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cards?: Array<{
    title: string;
    subtitle?: string | null;
    rows?: Array<Record<string, unknown>>;
    chips?: Array<Record<string, unknown>>;
  }>;
  noData?: boolean;
};

const quickQuestions: Record<string, string[]> = {
  STUDENT: [
    'Show my profile',
    'Show my offers',
    'What drives am I eligible for?',
    'Show my current interview stage',
    'What announcements are available?'
  ],
  FACULTY: [
    'How many pending verifications?',
    'Show verified students',
    'Show department placement percentage',
    'Show drive analytics',
    'Export verified students'
  ],
  PLACEMENT_HEAD: [
    'How many drives are active?',
    'Show all placement results',
    'Show placement percentage',
    'Which company hired the most students?',
    'Generate placement report'
  ]
};

function getSessionRole() {
  const storedRole = localStorage.getItem('role');
  if (storedRole) return storedRole;
  const token = localStorage.getItem('token');
  if (!token) return 'STUDENT';
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.role || 'STUDENT';
  } catch {
    return 'STUDENT';
  }
}

function formatTime(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function renderCardValue(value: unknown) {
  if (value == null) return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

function formatLabel(label: string) {
  return label
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function DataCard({ card }: { card: NonNullable<ChatbotMessage['cards']>[number] }) {
  return (
    <div className="chatbot-data-card">
      <div className="chatbot-data-card__head">
        <div>
          <div className="chatbot-data-card__title">{card.title}</div>
          {card.subtitle && <div className="chatbot-data-card__subtitle">{card.subtitle}</div>}
        </div>
      </div>
      <div className="chatbot-data-card__body">
        {card.rows?.map((row, rowIndex) => {
          const entries = Object.entries(row);
          return (
            <div key={rowIndex} className="chatbot-data-row">
              {entries.map(([key, value]) => (
                <div key={key} className="chatbot-data-field">
                  <span className="chatbot-data-field__label">{formatLabel(key)}</span>
                  <span className="chatbot-data-field__value">{renderCardValue(value)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: ChatbotMessage }) {
  return (
    <div className="chatbot-assistant-card">
      <div className="chatbot-assistant-text">{message.text}</div>
      {message.cards?.length ? (
        <div className="chatbot-data-stack">
          {message.cards.map((card, index) => (
            <DataCard key={index} card={card} />
          ))}
        </div>
      ) : null}
      <div className="chatbot-meta-row">
        <span>{formatTime(message.timestamp)}</span>
        {message.noData && <span>No matching records found</span>}
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hi, I am CampusHire AI Assistant. Ask me about your placement data or general placement guidance.',
      timestamp: new Date().toISOString()
    }
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  const role = useMemo(() => getSessionRole(), []);
  const suggestions = quickQuestions[role] || quickQuestions.STUDENT;

  useEffect(() => {
    if (open && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, open]);

  const sendMessage = async (question?: string) => {
    const text = (question ?? input).trim();
    if (!text || loading) return;

    const userMessage: ChatbotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/chatbot/query`,
        { message: text },
        { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
      );

      const payload = response.data?.data;
      const assistantMessage: ChatbotMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: payload?.reply || 'I could not process that request.',
        timestamp: new Date().toISOString(),
        cards: payload?.cards || [],
        noData: payload?.noData || false
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: error?.response?.data?.message || 'Unable to fetch data. Please try again later.',
        timestamp: new Date().toISOString(),
        noData: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="chatbot-launcher fixed bottom-6 right-6 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.35)] transition hover:scale-105 hover:bg-slate-800"
          aria-label="Open CampusHire AI Assistant"
        >
          <Bot size={22} />
        </button>
      )}

      {open && (
        <div className="chatbot-panel fixed bottom-6 right-6 z-[80] flex h-[min(760px,calc(100vh-1.5rem))] w-[min(520px,calc(100vw-1rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.28)]">
          <div className="chatbot-header flex items-center justify-between border-b border-slate-800/60 bg-slate-950 px-5 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold leading-5">CampusHire AI Assistant</div>
                <div className="text-xs text-slate-300">Role aware · {role.replace('_', ' ')}</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(v => !v)} className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Minimize chatbot">
                {minimized ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => setOpen(false)} className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close chatbot">
                <X size={16} />
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="chatbot-body flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 via-white to-white">
              <div className="chatbot-suggestions border-b border-slate-200/80 px-5 py-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Suggested Questions</div>
                <div className="chatbot-suggestions__scroll flex gap-2 overflow-x-auto pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      onClick={() => sendMessage(item)}
                      className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[11px] font-medium leading-4 text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chatbot-thread min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <div className="flex flex-col gap-4 pb-1">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[84%] ${message.role === 'user' ? 'chatbot-user-card' : ''}`}>
                        {message.role === 'user' ? (
                          <div className="chatbot-user-bubble">
                            <div className="whitespace-pre-line">{message.text}</div>
                            <div className="chatbot-meta-row chatbot-meta-row--user">
                              <span>{formatTime(message.timestamp)}</span>
                            </div>
                          </div>
                        ) : (
                          <AssistantBubble message={message} />
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                        <Loader2 size={16} className="animate-spin" />
                        Typing...
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <div className="flex items-end gap-2 rounded-[22px] border border-slate-200 bg-slate-50 p-2.5 shadow-inner">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Ask about offers, drives, verification, analytics..."
                    className="max-h-28 min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    rows={1}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <button className="rounded-xl bg-slate-950 p-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void sendMessage()} disabled={loading || !input.trim()}>
                    <Send size={16} />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <MoonStar size={12} />
                    Secure role-based assistant
                  </div>
                  <button onClick={() => setMessages(messages.slice(0, 1))} className="font-medium text-slate-600 hover:text-slate-900">
                    Clear chat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}