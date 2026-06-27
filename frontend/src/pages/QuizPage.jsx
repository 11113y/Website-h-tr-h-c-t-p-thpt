import React from 'react';
import { HelpCircle, Bookmark, Check, Sparkles } from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/mockData';
import { useDialog } from '../contexts/DialogContext';

// Extract balanced brace content starting at openPos (index of '{')
function _extractBrace(str, openPos) {
  let depth = 0;
  for (let i = openPos; i < str.length; i++) {
    if (str[i] === '{') depth++;
    else if (str[i] === '}') { depth--; if (depth === 0) return { content: str.slice(openPos + 1, i), end: i }; }
  }
  return null;
}

// Tokenize a math string into typed tokens
function _tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    // Equation system [&eq1&eq2.
    if ((text[i] === '[' || text[i] === '{') && text[i+1] === '&') {
      const delim = text[i];
      const dot = text.indexOf('.', i);
      if (dot !== -1) { tokens.push({ t: 'sys', delim, eqs: text.slice(i+2, dot).split('&') }); i = dot+1; continue; }
    }
    // \table{<html>} — embedded Word table
    if (text.slice(i, i+7) === '\\table{') {
      const r = _extractBrace(text, i+6);
      if (r) { tokens.push({ t: 'tbl', html: r.content }); i = r.end+1; continue; }
    }
    // \frac{num}{den}
    if (text.slice(i, i+6) === '\\frac{') {
      const nr = _extractBrace(text, i+5);
      if (nr && text[nr.end+1] === '{') { const dr = _extractBrace(text, nr.end+1); if (dr) { tokens.push({ t: 'frac', num: nr.content, den: dr.content }); i = dr.end+1; continue; } }
    }
    // \sqrt[deg]{content}
    if (text.slice(i, i+6) === '\\sqrt[') {
      const endBracket = text.indexOf(']', i+6);
      if (endBracket !== -1 && text[endBracket+1] === '{') {
        const r = _extractBrace(text, endBracket+1);
        if (r) { tokens.push({ t: 'sqrt', deg: text.slice(i+6, endBracket), content: r.content }); i = r.end+1; continue; }
      }
    }
    // \sqrt{content}
    if (text.slice(i, i+6) === '\\sqrt{') {
      const r = _extractBrace(text, i+5);
      if (r) { tokens.push({ t: 'sqrt', deg: null, content: r.content }); i = r.end+1; continue; }
    }
    // \vec{x}
    if (text.slice(i, i+5) === '\\vec{') { const r = _extractBrace(text, i+4); if (r) { tokens.push({ t: 'vec', base: r.content }); i = r.end+1; continue; } }
    // \bar{x}
    if (text.slice(i, i+5) === '\\bar{') { const r = _extractBrace(text, i+4); if (r) { tokens.push({ t: 'bar', base: r.content }); i = r.end+1; continue; } }
    // \int_{lo}^{hi}
    if (text.slice(i, i+6) === '\\int_{') { const lo = _extractBrace(text, i+5); if (lo && text.slice(lo.end+1,lo.end+3)==='^{') { const hi = _extractBrace(text, lo.end+2); if (hi) { tokens.push({ t: 'int', lower: lo.content, upper: hi.content }); i = hi.end+1; continue; } } }
    // \sum_{lo}^{hi}
    if (text.slice(i, i+6) === '\\sum_{') { const lo = _extractBrace(text, i+5); if (lo && text.slice(lo.end+1,lo.end+3)==='^{') { const hi = _extractBrace(text, lo.end+2); if (hi) { tokens.push({ t: 'sum', lower: lo.content, upper: hi.content }); i = hi.end+1; continue; } } }
    // \prod_{lo}^{hi}
    if (text.slice(i, i+7) === '\\prod_{') { const lo = _extractBrace(text, i+6); if (lo && text.slice(lo.end+1,lo.end+3)==='^{') { const hi = _extractBrace(text, lo.end+2); if (hi) { tokens.push({ t: 'prod', lower: lo.content, upper: hi.content }); i = hi.end+1; continue; } } }
    // word_{sub} — subscript with braces
    const sm = text.slice(i).match(/^([a-zA-Z]+)_\{/);
    if (sm) { const r = _extractBrace(text, i+sm[1].length+1); if (r) { tokens.push({ t: 'sub', base: sm[1], sub: r.content }); i = r.end+1; continue; } }
    // word_digit — simple subscript without braces: x_1, x_12, x_K10
    const smS = text.slice(i).match(/^([a-zA-Z\u0394]+)_([0-9]+|[A-Z][0-9]*|[a-z](?![a-zA-Z]))/u);
    if (smS) { tokens.push({ t: 'sub', base: smS[1], sub: smS[2] }); i += smS[0].length; continue; }

    // Superscript: ^{content} or ^char(s)
    if (text[i] === '^') {
      i++; // skip ^
      if (i < text.length && text[i] === '{') {
        const r = _extractBrace(text, i);
        if (r) { tokens.push({ t: 'sup', content: r.content }); i = r.end+1; continue; }
      }
      // If it starts with a prime/apostrophe, match only primes/apostrophes
      const primeM = text.slice(i).match(/^(['′]+)/);
      if (primeM) { tokens.push({ t: 'sup', content: primeM[1] }); i += primeM[1].length; continue; }

      // Otherwise match digits or single letter, or negative numbers: e.g. -1, 2, n
      const expM = text.slice(i).match(/^(-?[0-9]+|-[a-zA-Z]|[a-zA-Z](?![a-zA-Z]))/);
      if (expM) { tokens.push({ t: 'sup', content: expM[1] }); i += expM[1].length; continue; }
      tokens.push({ t: 'txt', v: '^' }); continue;
    }
    // Accumulate plain text (break on \, [&, {&, ^ or simple subscript letter_digit)
    let j = i+1;
    while (j < text.length) {
      if (text[j] === '\\' || text[j] === '^' || ((text[j]==='['||text[j]==='{') && text[j+1]==='&')) break;
      const sm2 = text.slice(j).match(/^([a-zA-Z]+)_(\{|[0-9a-zA-Z'])/);
      if (sm2) break;
      j++;
    }
    tokens.push({ t: 'txt', v: text.slice(i, j) });
    i = j;
  }
  return tokens;
}

export function renderMathText(text) {
  if (!text) return '';
  const cleanText = typeof text === 'string' ? text.replace(/\$/g, '') : String(text).replace(/\$/g, '');
  const tokens = _tokenize(cleanText);
  if (tokens.length === 1 && tokens[0].t === 'txt') return tokens[0].v;
  const R = renderMathText;
  return tokens.map((tok, idx) => {
    const k = `mt-${idx}`;
    if (tok.t === 'vec') return <span key={k} className="inline-block relative px-0.5 align-middle"><span className="absolute top-[-0.3em] left-0 right-0 text-center text-[0.62em] font-normal pointer-events-none select-none leading-none">→</span><span className="italic font-semibold">{R(tok.base)}</span></span>;
    if (tok.t === 'bar') return <span key={k} className="inline-block px-0.5 align-middle" style={{borderTop:'1.5px solid currentColor',lineHeight:'1.1',paddingTop:'1px'}}><span className="italic font-semibold">{R(tok.base)}</span></span>;
    if (tok.t === 'sqrt') {
      const inner = R(tok.content);
      if (tok.deg) {
        return (
          <span key={k} className="inline-flex items-center align-middle mx-0.5">
            <sup className="text-[0.6em] font-bold mr-[-0.3em] z-10" style={{transform:'translateY(-0.25em)'}}>{tok.deg}</sup>
            <span className="text-[1.25em] font-serif leading-none mr-[-0.05em]" style={{transform:'scaleY(1.05) translateY(-0.02em)'}}>√</span>
            <span className="border-t border-current px-0.5 text-[0.95em]" style={{lineHeight:'1.1',paddingTop:'1px'}}>{inner}</span>
          </span>
        );
      } else {
        return (
          <span key={k} className="inline-flex items-center align-middle mx-0.5">
            <span className="text-[1.25em] font-serif leading-none mr-[-0.05em]" style={{transform:'scaleY(1.05) translateY(-0.02em)'}}>√</span>
            <span className="border-t border-current px-0.5 text-[0.95em]" style={{lineHeight:'1.1',paddingTop:'1px'}}>{inner}</span>
          </span>
        );
      }
    }
    if (tok.t === 'int') return <span key={k} className="inline-flex items-center mx-1 font-normal align-middle"><span className="text-[1.45em] leading-[1] italic font-serif" style={{marginRight:'-0.05em',transform:'scaleY(1.2)'}}>∫</span><span className="inline-flex flex-col justify-between text-[0.62em] leading-none" style={{height:'1.9em',marginRight:'0.12em',transform:'translateY(-0.06em)'}}><span className="font-extrabold opacity-70" style={{marginBottom:'0.2em'}}>{tok.upper}</span><span className="font-extrabold opacity-70">{tok.lower}</span></span></span>;
    if (tok.t === 'sum') return <span key={k} className="inline-flex items-center mx-1 font-normal align-middle"><span className="text-[1.35em] leading-[1] font-serif" style={{marginRight:'0.05em'}}>∑</span><span className="inline-flex flex-col justify-between text-[0.62em] leading-none" style={{height:'1.9em',marginRight:'0.12em',transform:'translateY(-0.06em)'}}><span className="font-extrabold opacity-70" style={{marginBottom:'0.2em'}}>{tok.upper}</span><span className="font-extrabold opacity-70">{tok.lower}</span></span></span>;
    if (tok.t === 'prod') return <span key={k} className="inline-flex items-center mx-1 font-normal align-middle"><span className="text-[1.35em] leading-[1] font-serif" style={{marginRight:'0.05em'}}>∏</span><span className="inline-flex flex-col justify-between text-[0.62em] leading-none" style={{height:'1.9em',marginRight:'0.12em',transform:'translateY(-0.06em)'}}><span className="font-extrabold opacity-70" style={{marginBottom:'0.2em'}}>{tok.upper}</span><span className="font-extrabold opacity-70">{tok.lower}</span></span></span>;
    if (tok.t === 'frac') return <span key={k} className="inline-flex flex-col text-center mx-0.5" style={{lineHeight:'1.1',verticalAlign:'middle'}}><span className="border-b border-current px-1 pb-0.5 font-semibold text-[0.9em]">{R(tok.num)}</span><span className="pt-0.5 font-semibold text-[0.9em]">{R(tok.den)}</span></span>;
    if (tok.t === 'sub') {
      const romanBases = ['lim', 'log', 'ln', 'sin', 'cos', 'tan', 'cot', 'max', 'min'];
      const isRoman = romanBases.includes(tok.base.toLowerCase());
      return (
        <span key={k} className="inline-block mr-0.5">
          <span className={isRoman ? "font-semibold text-[#241916]" : "italic font-semibold"}>{tok.base}</span>
          <sub className="text-[0.75em] font-semibold text-gray-500" style={{verticalAlign:'sub',marginLeft:'1px'}}>{tok.sub}</sub>
        </span>
      );
    }
    if (tok.t === 'sup') return <sup key={k} className="font-semibold" style={{fontSize:'0.72em',lineHeight:'0',verticalAlign:'super'}}>{R(tok.content)}</sup>;
    if (tok.t === 'tbl') return <div key={k} className="my-3 overflow-x-auto w-full" dangerouslySetInnerHTML={{__html: `<style>.word-table{border-collapse:collapse;width:100%;font-size:0.88em;}.word-table td{border:1px solid #d1c4b8;padding:4px 8px;text-align:center;white-space:nowrap;}.word-table tr:first-child td{background:#f5ede9;font-weight:700;color:#7c3f2a;}</style>${tok.html}`}} />;
    if (tok.t === 'sys') return <span key={k} className="inline-flex items-center align-middle mx-1 font-normal"><span style={{fontSize:'1.8em',fontWeight:'100',transform:'scaleY(1.25)',marginRight:'2px',userSelect:'none'}}>{tok.delim}</span><span className="inline-flex flex-col text-left text-[0.9em] leading-tight">{tok.eqs.map((eq,ei)=><span key={ei}>{R(eq)}</span>)}</span></span>;
    return tok.v;
  });
}

export default function QuizPage({
  questions = QUIZ_QUESTIONS,
  selectedAnswers,
  setSelectedAnswers,
  activeQuestionIdx,
  setActiveQuestionIdx,
  quizFinished,
  handleQuizSubmit,
  quizMode = 'opt1',
  isLoggedIn = false,
  savedQuestions = [],
  toggleSaveQuestion,
  navigateTo,
  roadmapMode = 'practice',
  onAskAi
}) {
  const { confirm } = useDialog();
  const answeredCount = Object.values(selectedAnswers).filter(ans => ans !== null && ans !== undefined).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="space-y-4 max-w-4xl mx-auto pt-0 pb-12 mt-1 md:mt-2">

      {/* ===== ONE SINGLE MASSIVE QUESTIONS CARD ===== */}
      <div className="bg-[var(--surface)] rounded-[24px] border border-[var(--border-color)] overflow-hidden shadow-sm divide-y divide-[var(--border-color)]/40">
        
        {questions.map((q, idx) => {
          const isActive = activeQuestionIdx === idx;
          const userAns = selectedAnswers[idx];
          
          let isQuestionAnswered = false;
          if (q.section === 'II') {
            isQuestionAnswered = userAns !== undefined && userAns !== null && Object.keys(userAns).length > 0;
          } else if (q.section === 'III') {
            isQuestionAnswered = typeof userAns === 'string' && userAns.trim() !== '';
          } else {
            isQuestionAnswered = userAns !== undefined && userAns !== null;
          }
          
          const showResultForQuestion = quizMode === 'opt2' 
            ? isQuestionAnswered 
            : (quizFinished && isLoggedIn);

          return (
            <section
              key={q.id}
              id={`question-block-${idx}`}
              onClick={() => setActiveQuestionIdx(idx)}
              className={`p-3 md:p-3.5 text-left space-y-2.5 scroll-mt-28 transition-all ${
                isActive ? 'bg-[var(--surface-dim)]' : 'bg-[var(--surface)]'
              }`}
            >
              {/* Question Text & Number */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <span className="bg-[var(--primary)] text-white px-2 py-0.5 rounded text-[10px] font-black shrink-0 mt-0.5">
                      Câu {idx + 1}
                    </span>
                    <p className="text-sm md:text-base font-extrabold text-[var(--text-primary)] leading-snug">
                      {renderMathText(q.question)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isLoggedIn && roadmapMode === 'practice' && onAskAi && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskAi(q, idx);
                        }}
                        className="p-1.5 rounded-full text-emerald-600 hover:text-white hover:bg-[#006b58] bg-[#006b58]/10 transition-all duration-200 cursor-pointer"
                        title="Hỏi Hima AI gợi ý"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveQuestion && toggleSaveQuestion(q.id);
                      }}
                      className={`p-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        savedQuestions.includes(q.id) 
                          ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
                          : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-100'
                      }`}
                      title={savedQuestions.includes(q.id) ? "Bỏ lưu câu hỏi" : "Lưu câu hỏi"}
                    >
                      <Bookmark size={16} className={savedQuestions.includes(q.id) ? "fill-indigo-600" : ""} />
                    </button>
                  </div>
                </div>
                
                {(q.images && q.images.length > 0) ? (
                  <div className="flex flex-col gap-4">
                    {q.images.map((imgUrl, imgIdx) => (
                      <div key={imgIdx} className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-center shadow-inner">
                        <div className="max-w-md w-full opacity-95">
                          <img 
                            alt={`Hình ảnh câu ${idx + 1}`} 
                            className="w-full h-auto mx-auto rounded-xl border border-gray-150 shadow-sm bg-white" 
                            src={imgUrl} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : q.image ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 flex justify-center shadow-inner">
                    <div className="max-w-md w-full opacity-95">
                      <img 
                        alt="Bảng biến thiên" 
                        className="w-full h-auto mx-auto rounded-xl border border-gray-150 shadow-sm bg-white" 
                        src={q.image} 
                      />
                    </div>
                  </div>
                ) : (
                  idx < 2 && (
                    <div className="bg-[var(--background)] border border-[var(--border-color)] rounded-xl p-1.5 md:p-2 text-center font-mono text-[var(--primary)] text-sm md:text-base font-bold select-none">
                      {idx === 0 ? 'A = (3x² - 2x + 5) - (2x² + x - 3)' : '2(x - 3) + 5 = 3(x + 1) - 4x'}
                    </div>
                  )
                )}
              </div>

              {/* Question Body depending on section / type */}
              {(!q.section || q.section === 'I') ? (
                /* Radio Options arranged vertically */
                <div className="flex flex-col gap-1.5">
                  {(q.options || []).map((option, optIdx) => {
                    const isSelected = selectedAnswers[idx] === optIdx;
                    const isCorrect = q.answer === optIdx;
                    
                    let borderStyle = "border-[var(--border-color)]/30 group-hover:border-[var(--primary)]/30 bg-[var(--surface)]";
                    let badgeStyle = "border-[var(--border-color)]/50 text-[var(--text-muted)]";
                    
                    if (showResultForQuestion) {
                      if (isCorrect) {
                        borderStyle = "border-emerald-500 bg-emerald-500/10 shadow-sm";
                        badgeStyle = "bg-emerald-500 text-white border-emerald-500 font-black";
                      } else if (isSelected) {
                        borderStyle = "border-rose-500 bg-rose-500/10 shadow-sm";
                        badgeStyle = "bg-rose-500 text-white border-rose-500 font-black";
                      } else {
                        borderStyle = "border-[var(--border-color)]/30 opacity-60 bg-[var(--surface)]";
                      }
                    } else if (isSelected) {
                      borderStyle = "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] shadow-sm";
                      badgeStyle = "bg-[var(--primary)] text-white border-[var(--primary)] font-black";
                    }

                    return (
                      <label key={optIdx} className="relative cursor-pointer group block">
                        <input
                          type="radio"
                          name={`question-${idx}`}
                          checked={isSelected}
                          disabled={quizFinished}
                          onChange={() => {
                            setSelectedAnswers(prev => ({ ...prev, [idx]: optIdx }));
                            setActiveQuestionIdx(idx);
                          }}
                          className="sr-only"
                        />
                        <div className={`flex items-center py-1.5 px-2.5 md:py-2 md:px-3 border rounded-[12px] transition-all ${borderStyle}`}>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 font-black text-xs mr-2 transition-all ${badgeStyle}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span className="font-extrabold text-sm text-[var(--text-primary)]">
                            {renderMathText(option)}
                          </span>
                          {showResultForQuestion && isCorrect && (
                            <span className="ml-auto text-xs font-black text-emerald-600 dark:text-emerald-400">✓ Đúng</span>
                          )}
                          {showResultForQuestion && isSelected && !isCorrect && (
                            <span className="ml-auto text-xs font-black text-rose-600 dark:text-rose-400">✗ Sai</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : q.section === 'II' ? (
                /* True/False Statements with Đúng / Sai options */
                <div className="flex flex-col gap-1.5">
                  {(q.tfStatements || []).map((st, sIdx) => {
                    const currentVal = (selectedAnswers[idx] || {})[st.key] || '';
                    const showResultForStmt = showResultForQuestion;
                    return (
                      <div key={st.key} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 px-2.5 border border-[var(--border-color)]/35 rounded-[12px] bg-[var(--surface)] gap-2 hover:border-[var(--primary)]/30 transition-all">
                        <div className="flex items-start gap-2">
                          <span className="font-black text-sm text-[var(--primary)] shrink-0 mt-0.5">{st.key})</span>
                          <span className="font-extrabold text-sm text-[var(--text-primary)] leading-snug">{renderMathText(st.text)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {['Đ', 'S'].map(choice => {
                            const isChosen = currentVal === choice;
                            const isCorrect = q.answer?.type === 'tf' && q.answer.vals[sIdx] === choice;
                            let btnStyle = "bg-[var(--surface)] border-[var(--border-color)]/60 text-[var(--text-secondary)] hover:border-[var(--primary)]/50";
                            
                            if (isChosen) {
                              btnStyle = choice === 'Đ' 
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm font-black"
                                : "bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm font-black";
                            }
                            if (showResultForStmt) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-500 border-emerald-500 text-white font-black";
                              } else if (isChosen) {
                                btnStyle = "bg-rose-500 border-rose-500 text-white font-black opacity-80";
                              } else {
                                btnStyle = "bg-gray-50 border-gray-100 text-gray-300 pointer-events-none";
                              }
                            }
                            
                            return (
                              <button
                                key={choice}
                                disabled={quizFinished}
                                onClick={() => {
                                  setSelectedAnswers(prev => {
                                    const current = prev[idx] || {};
                                    return {
                                      ...prev,
                                      [idx]: { ...current, [st.key]: choice }
                                    };
                                  });
                                  setActiveQuestionIdx(idx);
                                }}
                                className={`px-3 py-1 rounded-xl border text-xs font-black transition-all cursor-pointer ${btnStyle}`}
                              >
                                {choice === 'Đ' ? 'Đúng' : 'Sai'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Short Answer (Part III) */
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      disabled={quizFinished}
                      value={selectedAnswers[idx] || ''}
                      onChange={(e) => {
                        setSelectedAnswers(prev => ({ ...prev, [idx]: e.target.value }));
                        setActiveQuestionIdx(idx);
                      }}
                      placeholder="Nhập câu trả lời là một số bất kỳ (ví dụ: 0,14 hoặc 50)..."
                      className={`w-full px-3 py-1.5 border rounded-[12px] font-mono font-bold text-[var(--primary)] placeholder-[var(--text-muted)]/60 focus:outline-none transition-all ${
                        selectedAnswers[idx] 
                          ? 'border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)]' 
                          : 'border-[var(--border-color)]/60 focus:border-[var(--primary)]/60 bg-[var(--surface)]'
                      }`}
                    />
                    {selectedAnswers[idx] && !quizFinished && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Đã nhập
                      </span>
                    )}
                  </div>

                  {showResultForQuestion && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-[12px] bg-[var(--surface-dim)]/50 border border-[var(--border-color)]/50">
                      <div className="text-xs font-black text-[var(--text-secondary)]">
                        Câu trả lời của bạn: <span className="font-mono text-xs bg-[var(--border-color)]/30 px-2 py-0.5 rounded text-[var(--text-primary)]">{selectedAnswers[idx] || '(Chưa trả lời)'}</span>
                      </div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 sm:ml-auto flex items-center gap-1.5">
                        <Check size={14} /> Đáp án đúng: <span className="font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded text-[#006b58] font-bold">{q.answer?.val}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detail Solution (if quiz completed or question answered) */}
              {showResultForQuestion && (
                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-black text-sm text-indigo-500 dark:text-indigo-400 flex items-center gap-1.5">
                    <HelpCircle size={16} /> Lời giải chi tiết từ HIMA TEST:
                  </h4>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                    {renderMathText(q.explanation)}
                  </p>
                </div>
              )}


            </section>
          );
        })}

      </div>

      {/* ===== ACTIONS BOTTOM ROW ===== */}
      <div className="flex justify-between items-center gap-3 bg-[var(--surface)] border-2 border-[var(--border-color)] rounded-[24px] p-4 md:p-5 shadow-sm">
        <div className="text-left min-w-0">
          <span className="text-[9px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block truncate">Hệ thống thi thử HIMA TEST</span>
          <p className="text-[10px] md:text-xs font-semibold text-[var(--text-secondary)] mt-0.5 leading-normal">
            {quizFinished ? 'Bạn đang xem lời giải chi tiết.' : 'Chúc cậu làm bài thi đạt kết quả tốt nhất!'}
          </p>
        </div>
        {quizFinished ? (
          <button 
            onClick={() => navigateTo ? navigateTo('result') : null}
            className="bg-[#006b58] hover:bg-[#005a4a] text-white font-black text-[10px] md:text-xs px-4 py-2.5 md:px-7 md:py-3 rounded-full shadow-md flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            Quay lại kết quả
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                const confirmed = await confirm("Bạn có chắc chắn muốn tạm dừng làm bài và quay lại trang chủ? Tiến trình làm bài sẽ được lưu lại.");
                if (confirmed) {
                  if (navigateTo) {
                    navigateTo('home');
                  }
                }
              }}
              className="bg-[var(--surface)] hover:bg-[var(--surface-dim)]/50 border border-[var(--border-color)] text-[var(--primary)] font-black text-[10px] md:text-xs px-4 py-2.5 md:px-5 md:py-3 rounded-full shadow-sm flex items-center gap-1 transition-all cursor-pointer uppercase tracking-wider whitespace-nowrap shrink-0"
            >
              Tạm dừng & Thoát
            </button>
            <button 
              onClick={handleQuizSubmit} 
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black text-[10px] md:text-xs px-4 py-2.5 md:px-7 md:py-3 rounded-full shadow-md flex items-center gap-1 md:gap-2 transition-all cursor-pointer uppercase tracking-wider whitespace-nowrap shrink-0"
            >
              Nộp bài <Check size={14} className="shrink-0" />
            </button>
          </div>
        )}
      </div>

      {/* ===== MINIMAL FLOATING FIXED BOTTOM QUESTION NAVIGATION ===== */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[96%] max-w-5xl bg-[var(--surface)]/90 dark:bg-[var(--surface-dim)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-full px-4 py-1.5 shadow-[0_10px_35px_rgba(140,51,21,0.12)] flex items-center justify-center">
        <div className="w-full overflow-x-auto no-scrollbar flex items-center justify-start sm:justify-center gap-1 md:gap-1.5 py-0 px-1">
          {questions.map((_, idx) => {
            const qNum = idx + 1;
            const isAnswered = selectedAnswers[idx] !== null && selectedAnswers[idx] !== undefined;
            const isActive = activeQuestionIdx === idx;

            let circleStyle = "bg-[var(--surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--background)]";
            if (isAnswered) circleStyle = "bg-[#006b58] text-white border-transparent hover:bg-[#005a4a]";
            if (isActive) circleStyle = "bg-[var(--primary)] text-white border-[var(--primary)] ring-2 ring-[var(--primary)]/20 scale-105 shadow-sm";

            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveQuestionIdx(idx);
                  document.getElementById(`question-block-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`rounded-full border text-xs font-black flex items-center justify-center transition-all shrink-0 hover:border-[var(--primary)] cursor-pointer ${circleStyle}`}
                style={{ width: '32px', height: '32px' }}
              >
                {qNum}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
