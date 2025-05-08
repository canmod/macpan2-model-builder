import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function CustomNode({ data }) {
  return (
    <div
      style={{
        background: '#f9f9f9',
        border: '1px solid #555',
        borderRadius: 4,
        width: 60,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Target handles */}
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />

      {data.label}

      {/* Source handles */}
      <Handle type="source" position={Position.Left} id="left-source" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
    </div>
  );
}
