import { useState, type ReactNode } from 'react';

interface Props {
  file: string;
  /** 앱에 묶인 그림 주소. 있으면 file 대신 쓴다. */
  src?: string;
  alt: string;
  className?: string;
  /** 이미지 파일이 없을 때 보이는 CSS 자리 표시 */
  children: ReactNode;
  /** 그림을 못 불러왔을 때 알린다. 다른 그림으로 바꿔 줄 때 쓴다. */
  onMissing?: () => void;
}

/** public/images 에 정해진 이름의 파일이 있으면 그 그림을, 없으면 자리 표시를 보여 준다. */
export function ImageSlot({ file, src, alt, className = '', children, onMissing }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'missing'>('loading');
  return (
    <div className={`image-slot ${className}`}>
      {status !== 'loaded' && (
        <div className="image-placeholder" role="img" aria-label={alt}>
          {children}
        </div>
      )}
      {status !== 'missing' && (
        <img
          src={src ?? `${import.meta.env.BASE_URL}images/${file}`}
          alt={status === 'loaded' ? alt : ''}
          className={status === 'loaded' ? 'is-loaded' : ''}
          onLoad={() => setStatus('loaded')}
          onError={() => {
            setStatus('missing');
            onMissing?.();
          }}
        />
      )}
    </div>
  );
}
