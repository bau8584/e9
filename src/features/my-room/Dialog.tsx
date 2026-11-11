import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Dialog({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const old=document.activeElement as HTMLElement;ref.current?.showModal();ref.current?.querySelector<HTMLElement>('[data-first],input,textarea')?.focus();return()=>{ref.current?.close();old?.focus();};},[]);
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="dialog-body"><header><div><h2 id="dialog-title">{title}</h2></div><button className="icon-btn" aria-label="닫기" onClick={onClose}><X/></button></header>{children}</div></dialog>;
}
