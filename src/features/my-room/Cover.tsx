import React, { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { findEdition } from '../../editions.mjs';
import { coverAssets } from '../../covers';
import type { BookDraft } from './storage';
import type { PersonalBook } from './libraryData';

export function Cover({book}:{book:PersonalBook|BookDraft}) {
  const edition=findEdition(book);
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[edition?.id]);
  if(edition&&!failed)return <div className={`personal-cover actual-cover edition-${edition.id}`}><img src={coverAssets[edition.id]} alt={`${edition.title} 표지 · ${edition.publisher} · ${edition.language}`} onError={()=>setFailed(true)} decoding="async"/><span className="actual-cover-spine"/></div>;
  return <div className="personal-cover" style={{'--book':book.color} as React.CSSProperties}><span className="cover-imprint">MY READING COLLECTION</span><span className="cover-rule"/><strong>{book.title||'나만의 이야기'}</strong><span className="cover-motif"><BookOpen strokeWidth={.8}/></span><small>{book.author||'저자'}</small><span className="cover-spine"/></div>;
}
