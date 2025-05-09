// CustomDefaultEdge.jsx
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
  labelStyle,
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
        <text
          x={labelX}
          y={labelY}
          style={{
            fontSize: 12,
            fill: 'black',
            textAnchor: 'middle',
            dominantBaseline: 'central',
            ...labelStyle,
          }}
        >
          {label}
        </text>
      )}
    </>
  );
}
