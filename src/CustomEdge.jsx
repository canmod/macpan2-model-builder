import React from 'react';
import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  label,
  labelStyle
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      {label && (
        <foreignObject
          x={labelX}
          y={labelY}
          width={1000} // max width to prevent clipping
          height={40}
          style={{ overflow: 'visible' }}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              backgroundColor: '#E6F4E6',
              color: 'black',
              height: '30px',
              lineHeight: '30px',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 12,
              textAlign: 'center',
              transform: 'translate(-50%, -50%)',
              ...labelStyle
            }}
          >
            {label}
          </div>
        </foreignObject>
      )}
    </>
  );
}
