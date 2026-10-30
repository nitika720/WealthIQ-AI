import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage, ProposedAction } from '../types/index.ts';
import {
  Bot,
  User as UserIcon,
  Send,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const CopilotPage: React.FC = () => {
  const { user, currencySymbol } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);
  const [openToolsMap, setOpenToolsMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptSuggestions = [
    'Where did I spend the most this month?',
    `How can I reduce expenses by ${currencySymbol}5,000 next month?`,
    'Which categories are exceeding my budgets?',
    'Help me create a realistic monthly budget.',
    'Summarize my financial health and net cash flow.',
  ];

  const fetchHistory = async () => {
    try {
      const res = await api.getChatHistory();
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    setInput('');
    // Optimistic UI push
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      userId: user?.id || 'usr',
      role: 'user',
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text.trim());
      if (res.success && res.data) {
        setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, res.data]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          userId: user?.id || 'usr',
          role: 'system',
          content: `⚠️ Copilot service notice: ${err.message || 'Connection unavailable. Falling back to local rules engine.'}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    try {
      setActionProcessing(actionId);
      const res = await api.confirmProposedAction(actionId);
      if (res.success) {
        fetchHistory();
      }
    } catch (err: any) {
      alert(err.message || 'Action confirmation failed');
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRejectAction = async (actionId: string) => {
    try {
      setActionProcessing(actionId);
      const res = await api.rejectProposedAction(actionId);
      if (res.success) {
        fetchHistory();
      }
    } catch (err: any) {
      alert(err.message || 'Action rejection failed');
    } finally {
      setActionProcessing(null);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all conversation history?')) {
      await api.clearChatHistory();
      setMessages([]);
    }
  };

  const toggleTools = (id: string) => {
    setOpenToolsMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto h-[calc(100vh-60px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-sm shadow-cyan-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              WealthIQ AI Financial Copilot
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                Gemini 3.8 Flash + Tool Invocation
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Deterministic, permission-controlled agentic assistant with strict human-in-the-loop confirmation.
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
          title="Clear Conversation"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto py-12">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-white">How can I assist your finances today?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                I can inspect your transactions, identify top expenditure leaks, calculate savings rates, and propose realistic category budget limits.
              </p>
            </div>

            <div className="w-full space-y-2 text-left">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Suggested Prompts
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {promptSuggestions.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="w-full p-2.5 text-xs text-slate-300 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-xl space-y-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-xs'
                    : msg.role === 'system'
                    ? 'bg-slate-900/90 border border-slate-800 text-slate-300'
                    : 'bg-[#0F172A] border border-slate-800 text-slate-200 rounded-bl-xs shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed font-sans">{msg.content}</div>

                {/* Tool Invocations Inspector */}
                {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleTools(msg.id)}
                      className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{msg.toolInvocations.length} Verified Tool Calls</span>
                      {openToolsMap[msg.id] ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {openToolsMap[msg.id] && (
                      <div className="mt-2 p-2.5 bg-black/50 border border-slate-800 rounded-lg space-y-2 text-[11px] font-mono">
                        {msg.toolInvocations.map((tool, tIdx) => (
                          <div key={tIdx} className="space-y-1">
                            <span className="text-indigo-400 font-bold">⚡ tool: {tool.name}</span>
                            <pre className="text-[10px] text-slate-400 overflow-x-auto p-1.5 bg-slate-950 rounded">
                              {JSON.stringify(tool.result, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* State Mutation Action Confirmation Card */}
                {msg.proposedAction && (
                  <div className="p-3.5 bg-slate-900 border border-cyan-800/80 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Requires Explicit User Approval
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {msg.proposedAction.status}
                      </span>
                    </div>

                    <p className="text-xs text-white font-medium">
                      {msg.proposedAction.description}
                    </p>

                    {msg.proposedAction.status === 'PENDING_CONFIRMATION' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(msg.proposedAction!.id)}
                          disabled={actionProcessing === msg.proposedAction.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Execute Budget</span>
                        </button>
                        <button
                          onClick={() => handleRejectAction(msg.proposedAction!.id)}
                          disabled={actionProcessing === msg.proposedAction.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {msg.proposedAction.status === 'EXECUTED' && (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action verified in database & recorded in audit ledger.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3 bg-[#0F172A] border border-slate-800 text-slate-400 rounded-xl rounded-bl-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Analyzing financial vectors and invoking tools...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Suggestion Bar */}
      {messages.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
          {promptSuggestions.slice(0, 3).map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 whitespace-nowrap shrink-0 transition-colors cursor-pointer text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask Copilot about spending leaks, ₹5,000 savings strategies, or budget status..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 text-xs text-white bg-slate-900 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
