import { retrySave } from '../store/store';

export function SaveBanner() {
  return (
    <div className="save-banner" role="alert">
      <p>이 기기에 저장하지 못했어요. 고른 답은 화면에 남아 있어요. 창을 닫기 전에 다시 시도해 주세요.</p>
      <button type="button" className="btn btn-small" onClick={retrySave}>
        다시 시도
      </button>
    </div>
  );
}
