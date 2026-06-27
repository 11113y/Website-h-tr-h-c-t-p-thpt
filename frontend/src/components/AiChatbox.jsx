import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, MessageSquare, AlertCircle, Bot, Zap } from 'lucide-react';
import axios from 'axios';
import { renderMathText } from '../pages/QuizPage';

export default function AiChatbox({
  activeTab,
  roadmapMode,
  activeQuestionIdx,
  questions,
  totalPoints,
  setTotalPoints,
  isLoggedIn,
  aiChatContext,
  setAiChatContext,
  isOpen,
  setIsOpen,
  systemSettings
}) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Chào cậu! Mình là HIMA AI. Mình có thể giúp cậu ôn tập môn Toán và hướng dẫn giải các bài tập. Cậu muốn hỏi gì hôm nay? 🧀',
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef(null);

  // Get AI Chat cost from system settings
  const aiCost = parseInt(systemSettings?.ai_chat_cost || '5', 10);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Handle preloaded AI Chat Context (from QuizPage "Hỏi AI" button)
  useEffect(() => {
    if (aiChatContext) {
      const qNum = aiChatContext.index + 1;
      // Append a system notification message about the selected question
      setMessages(prev => [
        ...prev,
        {
          role: 'system_info',
          content: `Đã chọn Câu ${qNum}. Nhấn nút bên dưới để hỏi AI gợi ý cách giải câu này (Trừ ${aiCost}🧀)`,
          questionData: aiChatContext.question,
          qIndex: aiChatContext.index
        }
      ]);
      setIsOpen(true);
      // Clear context after loading so it doesn't trigger repeatedly
      setAiChatContext(null);
    }
  }, [aiChatContext]);

  // Hide completely if not logged in or on Exam screens
  const isExamActive = activeTab === 'quiz' && roadmapMode === 'exam';
  if (!isLoggedIn || isExamActive) {
    return null;
  }

  const cleanLatex = (text) => {
    if (!text) return '';
    let cleaned = text
      .replace(/\\limits/g, '')
      .replace(/\\left/g, '')
      .replace(/\\right/g, '')
      .replace(/\\\[/g, '')
      .replace(/\\\]/g, '')
      .replace(/\\\(/g, '')
      .replace(/\\\)/g, '')
      .replace(/\\text\{([^{}]+)\}/g, '$1')
      .replace(/\\times/g, ' × ')
      .replace(/\\cdot/g, ' · ')
      .replace(/\\,/g, ' ');

    // Normalize integrals like \int_a^b, \int_{a}^b, \int_a^{b} to \int_{a}^{b}
    cleaned = cleaned.replace(/\\int_([a-zA-Z0-9])\^([a-zA-Z0-9])/g, '\\int_{$1}^{$2}');
    cleaned = cleaned.replace(/\\int_\{([^{}]+)\}\^([a-zA-Z0-9])/g, '\\int_{$1}^{$2}');
    cleaned = cleaned.replace(/\\int_([a-zA-Z0-9])\^{\^?([^{}]+)\}/g, '\\int_{$1}^{$2}');
    cleaned = cleaned.replace(/\\int_([a-zA-Z0-9])\^\{([^{}]+)\}/g, '\\int_{$1}^{$2}');

    // Normalize sums like \sum_a^b, \sum_{a}^b, \sum_a^{b} to \sum_{a}^{b}
    cleaned = cleaned.replace(/\\sum_([a-zA-Z0-9])\^([a-zA-Z0-9])/g, '\\sum_{$1}^{$2}');
    cleaned = cleaned.replace(/\\sum_\{([^{}]+)\}\^([a-zA-Z0-9])/g, '\\sum_{$1}^{$2}');
    cleaned = cleaned.replace(/\\sum_([a-zA-Z0-9])\^\{([^{}]+)\}/g, '\\sum_{$1}^{$2}');

    // Map common LaTeX math symbols to unicode equivalents
    const latexSymbols = {
      '\\\\approx': '≈',
      '\\\\leq': '≤',
      '\\\\le': '≤',
      '\\\\geq': '≥',
      '\\\\ge': '≥',
      '\\\\neq': '≠',
      '\\\\ne': '≠',
      '\\\\pm': '±',
      '\\\\infty': '∞',
      '\\\\pi': 'π',
      '\\\\alpha': 'α',
      '\\\\beta': 'β',
      '\\\\gamma': 'γ',
      '\\\\theta': 'θ',
      '\\\\lambda': 'λ',
      '\\\\sigma': 'σ',
      '\\\\Delta': 'Δ',
      '\\\\delta': 'δ',
      '\\\\to': '→',
      '\\\\rightarrow': '→',
      '\\\\gets': '←',
      '\\\\leftarrow': '←',
      '\\\\leftrightarrow': '↔',
      '\\\\parallel': '∥',
      '\\\\perp': '⊥',
      '\\\\angle': '∠',
      '\\\\triangle': '△',
      '\\\\in': '∈',
      '\\\\notin': '∉',
      '\\\\subset': '⊂',
      '\\\\supset': '⊃',
      '\\\\subseteq': '⊆',
      '\\\\supseteq': '⊇',
      '\\\\cap': '∩',
      '\\\\cup': '∪',
      '\\\\varnothing': '∅',
      '\\\\equiv': '≡',
      '\\\\dots': '...',
      '\\\\cdots': '···',
      '\\\\ddots': '⋱',
      '\\\\vdots': '⋰'
    };

    for (const [key, val] of Object.entries(latexSymbols)) {
      const regex = new RegExp(key + '(?![a-zA-Z])', 'g');
      cleaned = cleaned.replace(regex, val);
    }

    return cleaned;
  };

  // Helper to format messages with bold support and math text
  const renderMessageText = (content) => {
    if (!content) return '';
    
    // Split by ** to find bold sections
    const parts = content.split('**');
    return parts.map((part, idx) => {
      // If odd index, it's bold
      const isBold = idx % 2 === 1;
      const parsedMath = renderMathText(cleanLatex(part));
      
      return isBold ? (
        <strong key={idx} className="font-extrabold text-[#8c3315]">
          {parsedMath}
        </strong>
      ) : (
        <span key={idx}>{parsedMath}</span>
      );
    });
  };

  const handleSendMessage = async (textToSend, customQuestionData = null) => {
    const text = textToSend || input;
    if (!text.trim() && !customQuestionData) return;

    if (!isLoggedIn) {
      setError('Vui lòng đăng nhập để sử dụng Trợ lý Hima AI.');
      return;
    }

    if (totalPoints < aiCost) {
      setError(`Bạn không đủ điểm Phô mai (Cần ${aiCost}🧀, hiện có ${totalPoints}🧀).`);
      return;
    }

    setError('');
    setLoading(true);

    // Append student message
    const userMsg = {
      role: 'user',
      content: customQuestionData 
        ? `Gợi ý cho mình cách giải Câu ${customQuestionData.qIndex + 1} với!` 
        : text,
      time: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const isPractice = activeTab === 'quiz' && roadmapMode === 'practice';
      const contextType = isPractice ? 'PRACTICE' : 'HOME';

      // Phân tích câu hỏi được đề cập trong tin nhắn (ví dụ: "câu 2")
      let matchedQuestion = null;
      if (isPractice && questions) {
        const match = userMsg.content.match(/(?:câu|cau|c)(?:\s+số|\s+so)?\s*(\d+)/i);
        if (match) {
          const qNum = parseInt(match[1], 10);
          if (qNum >= 1 && qNum <= questions.length) {
            matchedQuestion = questions[qNum - 1];
          }
        }
      }

      const activeQuestion = (isPractice && questions && questions[activeQuestionIdx])
        ? questions[activeQuestionIdx]
        : null;

      const questionToSend = customQuestionData
        ? customQuestionData.question
        : (matchedQuestion || activeQuestion);

      const payload = {
        message: userMsg.content,
        contextType,
        questionData: questionToSend,
        history: [...messages, userMsg]
      };

      const res = await axios.post('/api/ai/chat', payload, { withCredentials: true });

      if (res.data && res.data.success) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: res.data.answer,
            time: new Date()
          }
        ]);
        // Update user points balance in header
        if (res.data.pointsLeft !== undefined) {
          setTotalPoints(res.data.pointsLeft);
        }
      } else {
        setError(res.data.message || 'Có lỗi xảy ra khi gọi AI.');
      }
    } catch (err) {
      console.error('AI chat error:', err);
      setError(err.response?.data?.message || 'Không thể kết nối với Hima AI. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 md:bottom-24 right-6 z-50 text-left font-sans">
      {/* 1. Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-[#006b58] hover:bg-[#005546] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(0,107,88,0.35)] transition-all duration-300 hover:scale-110 cursor-pointer relative group"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute right-16 bg-white border border-[#dfc0b7] text-[#241916] text-[10px] font-black px-2.5 py-1 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
            Trò chuyện với Hima AI 🧀
          </span>
        </button>
      )}

      {/* 2. Chat Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[500px] bg-white/95 backdrop-blur-md rounded-[32px] border-2 border-[#dfc0b7] shadow-[0_12px_40px_rgba(140,51,21,0.15)] flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-[#006b58] text-white p-4 flex items-center justify-between border-b border-[#005546]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black tracking-wide">HIMA AI ASSISTANT</h4>
                <p className="text-[10px] font-bold text-white/85 flex items-center gap-1">
                  <Zap size={10} className="fill-yellow-400 stroke-yellow-400" />
                  Số dư: <span className="font-extrabold">{totalPoints}🧀 Phô mai</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fffefd] no-scrollbar">
            {messages.map((msg, idx) => {
              if (msg.role === 'system_info') {
                return (
                  <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-2 animate-fadeIn">
                    <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                      <AlertCircle size={14} /> {msg.content}
                    </p>
                    <button
                      onClick={() => handleSendMessage(null, { question: msg.questionData, qIndex: msg.qIndex })}
                      className="px-4 py-1.5 bg-[#006b58] hover:bg-[#005546] text-white text-[10px] font-black uppercase rounded-full shadow-sm transition-all duration-200 cursor-pointer"
                    >
                      Hỏi AI ngay ⚡️
                    </button>
                  </div>
                );
              }

              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#e6f4f1] text-[#241916] rounded-tr-none'
                      : 'bg-gray-100/90 text-[#241916] rounded-tl-none border border-gray-200/50'
                  }`}>
                    <p className="whitespace-pre-line font-medium">
                      {renderMessageText(msg.content)}
                    </p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start items-center gap-2 animate-pulse">
                <div className="bg-gray-100 border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-tl-none text-xs text-gray-500 font-bold flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span>Hima AI đang giải toán...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Warning / Error Message Banner */}
          {error && (
            <div className="bg-rose-50 border-t border-b border-rose-100 px-4 py-2 text-[10px] font-black text-rose-600 flex items-center gap-1.5 animate-shake">
              <AlertCircle size={12} />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-[#dfc0b7]/40 bg-white flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder={isLoggedIn ? "Nhập câu hỏi tại đây..." : "Vui lòng đăng nhập..."}
                className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-[#dfc0b7]/40 focus:border-[#006b58] focus:bg-white rounded-2xl text-xs font-bold text-[#241916] outline-none transition-all placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-2xl bg-[#006b58] hover:bg-[#005546] disabled:bg-gray-200 text-white flex items-center justify-center shadow-sm disabled:shadow-none transition-colors cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="flex justify-between items-center px-1 text-[8.5px] font-bold text-gray-400">
              <span>Hỗ trợ ôn tập. AI có thể không chính xác 100%.</span>
              <span className="text-[#006b58] font-extrabold flex items-center gap-0.5 shrink-0">
                -{aiCost}🧀 Phô mai / câu
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
