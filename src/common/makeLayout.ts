import dagre from "dagre";
import type { Edge, Node } from "dagre";
import type { EdgeProps } from "react-flow-renderer";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;

interface SuperEdge extends Edge {
  label?: string;
}

interface SuperNode extends Node {
  element: any;
}

// auto-layout with dagre
export const makeLayout = (elements: any[]): any[] => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", align: "DR", edgesep: 20 });
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  elements.forEach((e) => {
    if (e.source && e.target) {
      g.setEdge(e.source, e.target);
    } else {
      g.setNode(e.id, {
        label: (e.data && e.data.label) || "",
        element: e,
        id: e.id,
        sourcePosition: e.sourcePosition,
        targetPosition: e.targetPosition,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    }
  });

  dagre.layout(g);

  const nodes = g.nodes().map((i) => {
    const n = g.node(i) as SuperNode;
    return {
      ...n.element,
      connectable: false,
      position: {
        x: n.x - n.width / 2,
        y: n.y - n.height / 2,
      },
    };
  });

  const edges = g.edges().map((e: SuperEdge) => {
    /* ----todo -- */
    const source = elements.find(
      (element: EdgeProps) =>
        element.source &&
        e.v &&
        element.source === e.v &&
        element.target &&
        e.w &&
        element.target === e.w
    );

    // if (!source || !e) {
    //   return null;
    // }
    return {
      id: `__${e.v}__${e.w}`,
      label: (source && source.label) || (e && e.label),
      points: g.edge(e).points,
      source: e.v,
      target: e.w,
      type: "auto",
      animated: /^(ingress|service)/i.exec(e.w) || /^(service)/i.exec(e.v),
    };
  });

  console.log({ nodes, edges });

  return [...nodes, ...edges];
};
