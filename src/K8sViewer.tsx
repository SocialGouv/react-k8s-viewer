import React from "react";
import ReactFlow from "react-flow-renderer";

import { makeLayout } from "./makeLayout";
import { parseManifests } from "./parseManifests";

import "rc-simple-tooltip/dist/styles.css";

type AnyObject = {
  [U: string]: any;
};

interface ManifestList {
  kind: string;
  apiVersion: string;
  items: any[];
  metadata?: AnyObject;
}

interface K8sViewerProps {
  manifests: ManifestList | undefined;
}

const onLoad = (reactFlowInstance: any) => {
  reactFlowInstance.fitView();
};

export const K8sViewer: React.FC<K8sViewerProps> = ({ manifests }) => {
  if (!manifests) {
    return <div>Invalid manifests</div>;
  }

  const elements = parseManifests(manifests);
  const flow = makeLayout(elements);

  return (
    <React.Fragment>
      <ReactFlow
        onLoad={onLoad}
        paneMoveable={true}
        nodesDraggable={true}
        elementsSelectable={false}
        nodesConnectable={false}
        elements={flow}
      />
    </React.Fragment>
  );
};
