import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, RotateCcw, X } from 'lucide-react';
import { startOnboarding } from '../../store/store';
import { chatFor, questions, readingTypes, RESULT_KEY, scoreAnswers, typeLabels, type ReadingType } from './discoveryData';
import './discovery.css';

export const openDiscovery = () => window.dispatchEvent(new Event('hipdok:discovery'));
export function DiscoveryDialog({ onClose, initial }: {onClose: () => void; initial?: string}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab,setTab] = useState<'quiz'|'types'>(initial ? 'types' : 'quiz');
  const [answers,setAnswers] = useState<number[]>([]);
  const [step,setStep] = useState(0);
  const [result,setResult] = useState<ReadingType|null>(null);
  const [notice,setNotice] = useState('');
  const [selectedCode,setSelectedCode] = useState<string|null>(initial && initial !== 'types' ? initial : null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const oldOverflow = document.body.style.overflow;
    const node = dialog.current;
    node?.showModal(); document.body.style.overflow='hidden';
    return () => { node?.close(); document.body.style.overflow=oldOverflow; previous?.focus(); };
  },[]);
  useEffect(() => { title.current?.focus(); },[step,result,tab]);
  function answer(value: number) {
    const next = [...answers]; next[step] = value; setAnswers(next);
    if (step < questions.length-1) setStep(step+1);
    else {
      const scored = scoreAnswers(next); setResult(scored);
      if (scored) { try { localStorage.setItem(RESULT_KEY,scored.code); window.dispatchEvent(new Event('hipdok:taste-saved')); } catch {setNotice('저장이 막혀 있어요. 이 화면에서 결과를 확인해주세요.');} }
    }
  }
  function restart() {setResult(null);setAnswers([]);setStep(0);setSelectedCode(null);setTab('quiz');setNotice('');}
  const shown = tab==='types' ? readingTypes.find(t=>t.code===selectedCode) : result;
  const chatId = shown ? chatFor(shown.code) : 'nietzsche';
  const chatName = chatId==='xunzi'?'순자':'니체';
  async function share() {
    if (!shown) return;
    const text=`나의 독서 유형은 ${shown.name}! 취향 철학자는 ${shown.philosopher}, 대화 추천은 ${chatName}. HIP讀에서 나의 독서 취향을 찾아봐요.`;
    try { await navigator.clipboard.writeText(text); setNotice('결과 문구를 복사했어요.'); } catch {setNotice('복사하지 못했어요. 유형 이름을 직접 복사해주세요.');}
  }
  function meet(id: 'xunzi'|'nietzsche') {onClose();startOnboarding(id);}
  return <dialog ref={dialog} className="taste-dialog" aria-labelledby="taste-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.currentTarget===e.target)onClose();}}>
    <header className="taste-dialog-head"><span><BookOpen size={18}/> HIP讀 READ YOURSELF</span><button className="taste-icon" onClick={onClose} aria-label="독서 취향 검사 닫기"><X/></button></header>
    <div className="taste-tabs"><button onClick={()=>{setTab('quiz');setSelectedCode(null);}} aria-pressed={tab==='quiz'}>나의 독서 취향</button><button onClick={()=>{setTab('types');setSelectedCode(null);}} aria-pressed={tab==='types'}>16유형 둘러보기</button></div>
    {shown ? <section className="taste-result">
      <p className="taste-eyebrow">{tab==='types'?'이런 독서 취향도 있어요':'나의 독서 유형은'}</p><p className="taste-code">{shown.code}</p>
      <h2 id="taste-title" ref={title} tabIndex={-1}>{shown.name}</h2>
      <div className="taste-tags">{typeLabels(shown.code).map(l=><span key={l}>{l}</span>)}</div>
      <p className="taste-description">{shown.description}</p>
      <div className="taste-philosopher"><span>취향으로 만나는 철학자</span><h3>{shown.philosopher}</h3><p>{shown.topic}</p></div>
      <div className="taste-connection"><strong>오늘 대화할 상대는 {chatName}</strong><p>{shown.contrast?`${shown.philosopher}와 다른 관점을 가진 순자에게 직접 물어보세요.`:shown.philosopher===chatName?'나의 관심사로 첫 대화를 시작해보세요.':`${shown.philosopher}에게서 발견한 질문을 ${chatName}의 관점으로 이어가요. 두 사람의 생각은 다를 수 있어요.`}</p><blockquote>{shown.prompt}</blockquote></div>
      <button className="taste-primary" onClick={()=>meet(chatId)}>{chatName} 선택하고 시작하기 <ArrowRight size={18}/></button>
      <button className="taste-other" onClick={()=>meet(chatId==='xunzi'?'nietzsche':'xunzi')}>{chatId==='xunzi'?'니체':'순자'}와 이야기해볼래요</button>
      <div className="taste-result-actions"><button onClick={share}><Copy size={15}/>결과 문구 복사</button><button onClick={restart}><RotateCcw size={15}/>다시 해보기</button>{tab==='types'&&<button onClick={()=>setSelectedCode(null)}>목록으로</button>}</div>
      <p role="status">{notice}</p>
    </section> : tab==='types' ? <section className="taste-directory"><h2 id="taste-title" ref={title} tabIndex={-1}>책장도, 취향도 가지각색.</h2><p>16가지 취향을 둘러보세요. 채팅은 니체와 순자, 두 사람과 할 수 있어요.</p><div className="taste-type-grid">{readingTypes.map((t,i)=><button key={t.code} onClick={()=>setSelectedCode(t.code)}><span className="taste-type-number">{String(i+1).padStart(2,'0')} / {t.code}</span><strong>{t.name}</strong><span>{t.philosopher} <ArrowRight size={14}/></span></button>)}</div></section>
    : <section className="taste-question"><div className="taste-step"><span>나를 읽는 12개의 질문</span><span>{String(step+1).padStart(2,'0')} <small>/ 12</small></span></div><progress value={step} max={12} aria-label="검사 진행도"/>
      <p className="taste-eyebrow">정답보다, 지금 내 취향대로.</p><h2 id="taste-title" ref={title} tabIndex={-1}>{questions[step].text}</h2>
      <div className="taste-options">{questions[step].options.map((o,i)=><button key={`${step}-${i}`} onClick={()=>answer(i)} aria-pressed={answers[step]===i}><span>{i===0?'A':'B'}</span>{o}{answers[step]===i?<Check size={19}/>:<ArrowRight size={19}/>}</button>)}</div>
      <div className="taste-question-footer"><button disabled={step===0} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/>이전 질문</button><span>오늘 더 끌리는 답 하나만 골라주세요.</span></div>
    </section>}
    <footer className="taste-fineprint">성격 진단이 아닌 재미로 보는 독서 취향 검사예요.<br/>철학자 매칭은 일부 관심 주제를 연결한 창작이며, 실제 MBTI와 무관해요.</footer>
  </dialog>;
}
