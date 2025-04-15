
// React + Vite + React Flow scaffold

import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

const nodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `node_${id++}`;

function FlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [labelType, setLabelType] = useState('label');
  const [modelCode, setModelCode] = useState('');

  const inputRef = useRef(null);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            label: 'rate_here',
            data: { name: 'flow_name' },
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          eds
        )
      ),
    [setEdges]
  );

  const addNode = () => {
    const newNode = {
      id: getId(),
      type: 'custom',
      data: { label: `Box ${id}` },
      position: { x: Math.random() * 100, y: Math.random() * 100 },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onSelectionChange = ({ nodes: selectedNodes, edges: selectedEdges }) => {
    const selected = [...selectedNodes, ...selectedEdges][0];
    setSelectedElement(selected || null);
  };

  useEffect(() => {
    if (!selectedElement) return;
    if ('source' in selectedElement) {
      // edge
      if (labelType === 'label') {
        setInputValue(selectedElement.label || '');
      } else {
        setInputValue(selectedElement.data?.name || '');
      }
    } else {
      // node
      setInputValue(selectedElement.data?.label || '');
    }
  }, [selectedElement, labelType]);

  const updateLabel = () => {
    if (!selectedElement) return;
    if ('source' in selectedElement) {
      // edge
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === selectedElement.id) {
            return labelType === 'label'
              ? { ...e, label: inputValue }
              : { ...e, data: { ...e.data, name: inputValue } };
          }
          return e;
        })
      );
    } else {
      // node
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedElement.id ? { ...n, data: { ...n.data, label: inputValue } } : n
        )
      );
    }
  };

  const generateModelCode = () => {
    const flows = edges.map((e) => {
      const from = nodes.find((n) => n.id === e.source)?.data.label || e.source;
      const to = nodes.find((n) => n.id === e.target)?.data.label || e.target;
      const rate = e.label || 'RATE';
      const name = e.data?.name || 'unnamed_flow';
      return `  mp_per_capita_flow(from = "${from}", to = "${to}", rate = "${rate}", abs_rate = "${name}")`;
    });
    const code = [
      'mp_tmb_model_spec(during = list(',flows.join(',\n'),'))'].join('\n');
    
    setModelCode(code);
  };

  useEffect(() => {
    const flows = edges.map((e) => {
      const from = nodes.find((n) => n.id === e.source)?.data.label || e.source;
      const to = nodes.find((n) => n.id === e.target)?.data.label || e.target;
      const rate = e.label || 'RATE';
      const name = e.data?.name || 'unnamed_flow';
      return `  mp_per_capita_flow(from = "${from}", to = "${to}", rate = "${rate}", abs_rate = "${name}")`;
    });
  
    const code = [
      'mp_tmb_model_spec(during = list(',
      flows.join(',\n'),
      '))',
    ].join('\n');
  
    setModelCode(code);
  }, [nodes, edges]);
  

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={addNode}>Add Compartment</button>
        {/*<button onClick={generateModelCode}>Generate R Code</button>*/}
        {selectedElement && 'source' in selectedElement && (
          <>
            <select
              value={labelType}
              onChange={(e) => setLabelType(e.target.value)}
            >
              <option value="label">Rate expression</option>
              <option value="name">Flow name</option>
            </select>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={labelType === 'label' ? 'Edit rate' : 'Edit flow name'}
            />
            <button onClick={updateLabel}>Update</button>
          </>
        )}
        {selectedElement && !('source' in selectedElement) && (
          <>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Edit compartment name"
            />
            <button onClick={updateLabel}>Update</button>
          </>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodeTypes={{ custom: CustomNode }}
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onSelectionChange={onSelectionChange}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {modelCode && (
        <pre style={{ background: '#f0f0f0', padding: '10px', whiteSpace: 'pre-wrap' }}>
          {modelCode}
        </pre>
      )}
    </div>
  );
}

export default FlowEditor;
