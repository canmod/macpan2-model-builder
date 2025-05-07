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
import { parse } from 'mathjs';

const nodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `node_${id++}`;

function getStateDependenceFrame(nodes, edges) {
  const compartments = new Set(nodes.map(n => n.data?.label).filter(Boolean));
  const rows = [];

  for (const edge of edges) {
    const toNode = nodes.find(n => n.id === edge.target);
    const toLabel = toNode?.data?.label;
    const flowName = edge.data?.name || 'unnamed_flow';
    const rateExpr = edge.label || '';

    if (!toLabel || !rateExpr) continue;

    let varsInRate;
    try {
      const ast = parse(rateExpr);
      varsInRate = ast
        .filter(node => node.isSymbolNode)
        .map(node => node.name);
    } catch (e) {
      console.warn(`Invalid rate expression: "${rateExpr}"`);
      varsInRate = [];
    }

    for (const v of varsInRate) {
      if (compartments.has(v)) {
        rows.push({ state: v, flow: flowName });
      }
    }
  }

  return rows;
}

function FlowEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [labelType, setLabelType] = useState('label');
  const [modelCode, setModelCode] = useState('');
  const [stateFrame, setStateFrame] = useState([]);

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
      if (labelType === 'label') {
        setInputValue(selectedElement.label || '');
      } else {
        setInputValue(selectedElement.data?.name || '');
      }
    } else {
      setInputValue(selectedElement.data?.label || '');
    }
  }, [selectedElement, labelType]);

  const updateLabel = () => {
    if (!selectedElement) return;
    if ('source' in selectedElement) {
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
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedElement.id ? { ...n, data: { ...n.data, label: inputValue } } : n
        )
      );
    }
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
    const rows = getStateDependenceFrame(nodes, edges);
    setStateFrame(rows);
  }, [nodes, edges]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={addNode}>Add Compartment</button>
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
            nodeTypes={nodeTypes}
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

      {stateFrame.length > 0 && (
        <div style={{ maxHeight: '200px', overflow: 'auto', padding: '10px', fontSize: '0.9em' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>State dependence:</div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {Object.keys(stateFrame[0]).map((col) => (
                  <th key={col} style={{ border: '1px solid #ccc', padding: '4px', background: '#f9f9f9' }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stateFrame.map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ border: '1px solid #ccc', padding: '4px' }}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FlowEditor;
