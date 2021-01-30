import React from "react";
import ReactFlow from "react-flow-renderer";
import type { Elements, ReactFlowProps } from "react-flow-renderer";

import { makeLayout } from "../common/makeLayout";
import { parseManifests } from "../common/parseManifests";
import { HtmlFlowNode } from "./HtmlFlowNode";

type AnyObject = {
  [U: string]: any;
};

interface ManifestList {
  kind: string;
  apiVersion: string;
  items: any[];
  metadata?: AnyObject;
}

const onLoad = (reactFlowInstance: any) => {
  reactFlowInstance.fitView();
  console.log("onload");
};

interface K8sViewerProps extends Omit<ReactFlowProps, "elements"> {
  manifests: ManifestList | undefined;
}

export const K8sViewer: React.FC<K8sViewerProps> = ({
  manifests,
}: K8sViewerProps) => {
  if (!manifests) {
    return <div>Invalid manifests</div>;
  }

  const elements = parseManifests(manifests);
  const flow = makeLayout(elements) as Elements;
  console.log({ manifests, elements, flow });
  return (
    <React.Fragment>
      <ReactFlow
        nodeTypes={{ ingress: HtmlFlowNode }}
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
