import React from "react";
import ReactFlow from "react-flow-renderer";

import { makeLayout } from "./makeLayout";
import { parseManifests } from "./parseManifests";

export interface K8sViewerProps {
  manifests: { kind: "List"; [U: string]: string } | undefined;
}

export const K8sViewer: React.FC<K8sViewerProps> = ({ manifests }) => {
  const elements = parseManifests(manifests);
  const flow = makeLayout(elements);
  console.log({
    manifests,
    elements,
    flow,
  });
  // return <div>io</div>;
  return (
    <ReactFlow
      paneMoveable={true}
      nodesDraggable={true}
      elementsSelectable={false}
      nodesConnectable={false}
      elements={flow}
    />
  );
};
