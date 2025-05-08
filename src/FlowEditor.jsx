// React + Vite + React Flow scaffold

import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  ReactFlowProvider,
  Background,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import { parse } from 'mathjs';

const nodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `node_${id++}`;

const thStyle = { border: '1px solid #ccc', padding: '4px', background: '#f9f9f9' };
const tdStyle = { border: '1px solid #ccc', padding: '4px' };


function getStateDependenceFrame(nodes, edges) {
  const compartments = new Set(nodes.map(n => n.data?.label).filter(Boolean));
  const rows = [];

  for (const edge of edges) {
    const toNode = nodes.find(n => n.id === edge.target);
    const fromNode = nodes.find(n => n.id === edge.source);
    const toLabel = toNode?.data?.label;
    const flowName = edge.data?.name || 'unnamed_flow';
    const rateExpr = edge.label || '';

    if (!toLabel || !rateExpr || !fromNode || !toNode) continue;

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

    const midX = ((fromNode.position.x + toNode.position.x) / 2).toFixed(1);
    const midY = ((fromNode.position.y + toNode.position.y) / 2).toFixed(1);

    for (const v of varsInRate) {
      if (compartments.has(v)) {
        const stateNode = nodes.find(n => n.data?.label === v);
        if (stateNode) {
          rows.push({
            state: v,
            flow: flowName,
            stateX: stateNode.position.x.toFixed(1),
            stateY: stateNode.position.y.toFixed(1),
            flowX: midX,
            flowY: midY,
          });
        }
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
            label: 'rate_expression',
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

    // 
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

    // Generate model code based on diagram
    const flows = edges.map((e) => {
      const from = nodes.find((n) => n.id === e.source)?.data.label || e.source;
      const to = nodes.find((n) => n.id === e.target)?.data.label || e.target;
      const rate = e.label || 'RATE';
      const name = e.data?.name || 'unnamed_flow';
      return `  mp_per_capita_flow(from = "${from}", to = "${to}", rate = "${rate}", abs_rate = "${name}")`;
    });
    const code = ['mp_tmb_model_spec(during = list(', flows.join(',\n'), '))',].join('\n');
    setModelCode(code);

    // Determine which flows depend on which compartments
    const rows = getStateDependenceFrame(nodes, edges);
    setStateFrame(rows);
  }, [nodes, edges]);


  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Palette */}
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
      
      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative' }}>
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
            <Controls />
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      
      {/* Generated Code */}
      {modelCode && (
        <pre style={{ background: '#f0f0f0', padding: '10px', whiteSpace: 'pre-wrap' }}>
          {modelCode}
        </pre>
      )}

      {/* State Dependence Frame */}
      {stateFrame.length > 0 && (
        <div style={{ maxHeight: '200px', overflow: 'auto', padding: '10px', fontSize: '0.9em', position: 'relative' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>State dependence:</div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Row ID</th>
              <th style={thStyle}>state</th>
              <th style={thStyle}>flow</th>
              <th style={thStyle}>stateX</th>
              <th style={thStyle}>stateY</th>
              <th style={thStyle}>flowX</th>
              <th style={thStyle}>flowY</th>
            </tr>
          </thead>
          <tbody>
            {stateFrame.map((row, i) => (
              <tr key={i}>
                <td style={tdStyle}>{`ref-${i}`}</td>
                <td style={tdStyle}>{row.state}</td>
                <td style={tdStyle}>{row.flow}</td>
                <td style={tdStyle}>{row.stateX}</td>
                <td style={tdStyle}>{row.stateY}</td>
                <td style={tdStyle}>{row.flowX}</td>
                <td style={tdStyle}>{row.flowY}</td>
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


function DashedLinesOverlay({ stateFrame }) {
  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        top: 0,
        left: 0,
      }}
    >
      {stateFrame.map((row, i) => {
        const x1 = parseFloat(row.stateX);
        const y1 = parseFloat(row.stateY);
        const x2 = parseFloat(row.flowX);
        const y2 = parseFloat(row.flowY);

        if ([x1, y1, x2, y2].some(isNaN)) return null;

        return (
          <line
            key={`line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="gray"
            strokeWidth={1}
            strokeDasharray="4 2"
          />
        );
      })}
    </svg>
  );
}
