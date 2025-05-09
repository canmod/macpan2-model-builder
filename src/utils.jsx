// React + Vite + React Flow scaffold

import {
  getBezierPath,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { parse } from 'mathjs';


function getHandleCoords(node, handleId) {
  const { x, y } = node.positionAbsolute ?? node.position;
  const width = 60;  // your actual node width
  const height = 32; // your actual node height

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  switch (handleId) {
    case 'left-source':
    case 'left-target':
      return { x: x, y: centerY, position: Position.Left };
    case 'right-source':
    case 'right-target':
      return { x: x + width, y: centerY, position: Position.Right };
    case 'top-source':
    case 'top-target':
      return { x: centerX, y: y, position: Position.Top };
    case 'bottom-source':
    case 'bottom-target':
      return { x: centerX, y: y + height, position: Position.Bottom };
    default:
      return { x: centerX, y: centerY, position: Position.Right };
  }
}

function getEdgeParams(edge, fromNode, toNode) {
  const source = getHandleCoords(fromNode, edge.sourceHandle);
  const target = getHandleCoords(toNode, edge.targetHandle);
  console.log(edge);

  return {
    sourceX: source.x,
    sourceY: source.y,
    targetX: target.x,
    targetY: target.y,
    sourcePosition: source.position,
    targetPosition: target.position,
  };
}


export default function getStateDependenceFrame(nodes, edges) {
  const compartments = new Set(nodes.map(n => n.data?.label).filter(Boolean));
  const rows = [];

  for (const edge of edges) {
    
    const toNode = nodes.find(n => n.id === edge.target);
    const fromNode = nodes.find(n => n.id === edge.source);
    const toLabel = toNode?.data?.label;
    const flowName = edge.data?.name || 'unnamed_flow';
    const rateExpr = edge.label || '';
    console.log(edge)

    //const labelX = edge.labelX;
    //const labelY = edge.labelY;

    const edgeParams = getEdgeParams(edge, toNode, fromNode);

    const [path, labelX, labelY] = getBezierPath(edgeParams);
    console.log('edgeParams', edgeParams, 'path', path, 'labelX', labelX, 'labelY', labelY);
    
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

    for (const v of varsInRate) {
      if (compartments.has(v)) {
        const stateNode = nodes.find(n => n.data?.label === v);
        if (stateNode) {
          rows.push({
            state: v,
            flow: flowName,
            stateX: stateNode.position.x + 30.0,
            stateY: stateNode.position.y + 16.0,
            flowX: labelX,
            flowY: labelY,
          });
        }
      }
    }
  }

  return rows;
}
