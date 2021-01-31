import React from "react";
import ReactFlow from "react-flow-renderer";
import type { OnLoadFunc, Elements, ReactFlowProps } from "react-flow-renderer";

import { makeLayout } from "../common/makeLayout";
import { parseManifests } from "../common/parseManifests";
import { HtmlFlowNode } from "./HtmlFlowNode";

import type { ManifestList, Manifest } from "../types/types";

const onLoad = (reactFlowInstance): OnLoadFunc => {
  reactFlowInstance.fitView();
};

interface K8sViewerProps extends Omit<ReactFlowProps, "elements"> {
  manifests: ManifestList | Manifest[];
}

export const K8sViewer: React.FC<K8sViewerProps> = ({
  manifests,
  ...props
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
        {...props}
        elements={flow}
      />
    </React.Fragment>
  );
};
