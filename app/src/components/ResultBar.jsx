import { useLayoutEffect, useRef, useState } from 'react';

export function ResultBar({ labels, notes, value, etStart, etEnd }) {
  const startLabelRef = useRef(null);
  const endLabelRef = useRef(null);
  const [raisedLabel, setRaisedLabel] = useState(null);
  const safeNotes = Number(notes);
  const safeValue = Number(value);
  const percent = Number.isFinite(safeNotes) && safeNotes > 0 && Number.isFinite(safeValue)
    ? Math.min(100, Math.max(0, (safeValue / safeNotes) * 100))
    : 0;
  const etStartPercent = Number.isFinite(safeNotes) && safeNotes > 0 && Number(etStart)
    ? Math.min(100, Math.max(0, (Number(etStart) / safeNotes) * 100))
    : 0;
  const etEndPercent = Number.isFinite(safeNotes) && safeNotes > 0 && Number(etEnd)
    ? Math.min(100, Math.max(0, (Number(etEnd) / safeNotes) * 100))
    : etStartPercent;
  const etWidth = Math.max(0, etEndPercent - etStartPercent);
  const rightWidth = Math.max(0, 100 - etEndPercent);
  const markerLeft = `min(100%, max(0%, ${percent}%))`;

  useLayoutEffect(() => {
    setRaisedLabel(null);

    if (!Number(etStart) || !Number(etEnd)) return undefined;

    let frameId = 0;
    frameId = window.requestAnimationFrame(() => {
      if (window.innerWidth >= 768) return;

      const startRect = startLabelRef.current?.getBoundingClientRect();
      const endRect = endLabelRef.current?.getBoundingClientRect();
      if (!startRect || !endRect) return;

      if (endRect.left - startRect.right < 6) {
        setRaisedLabel(etEndPercent > 75 ? 'start' : 'end');
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [etEnd, etEndPercent, etStart]);

  return (
    <div className="bar-section">
      <div className="bar-marker" style={{ left: markerLeft }}>
        <div className="bar-marker-label">Clear: {safeValue || '-'}</div>
        <div className="bar-marker-line" />
        <div className="bar-marker-arrow" />
      </div>

      <div className="bar-track">
        <div className="bar-left" style={{ width: `${etStartPercent}%` }} />
        <div className="bar-et" style={{ width: `${etWidth}%` }} />
        <div className="bar-right" style={{ width: `${rightWidth}%` }} />
      </div>

      <div className="bar-edge-marker left-edge">
        <div className="bar-edge-marker-label">0</div>
        <div className="bar-edge-marker-line" />
      </div>
      <div className="bar-edge-marker right-edge">
        <div className="bar-edge-marker-label">{safeNotes || '-'}</div>
        <div className="bar-edge-marker-line" />
      </div>

      <div className="bar-labels">
        {Number(etStart) ? (
          <span
            ref={startLabelRef}
            className={raisedLabel === 'start' ? 'bar-lbl above' : 'bar-lbl'}
            style={{ left: `${etStartPercent}%` }}
          >
            {etStart}
          </span>
        ) : null}
        {Number(etEnd) ? (
          <span
            ref={endLabelRef}
            className={raisedLabel === 'end' ? 'bar-lbl above' : 'bar-lbl'}
            style={{ left: `${etEndPercent}%` }}
          >
            {etEnd}
          </span>
        ) : null}
      </div>

      <div className="bar-legend">
        <div className="legend-item">
          <div className="legend-dot clear" />
          <span>{labels.clear}</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot et" />
          <span>{labels.et}</span>
        </div>
      </div>
    </div>
  );
}
