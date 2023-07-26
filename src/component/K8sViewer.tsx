import React, { FC, Fragment } from "react";
import type { Elements, OnLoadFunc, ReactFlowProps } from "react-flow-renderer";
import ReactFlow from "react-flow-renderer";

import { makeLayout } from "../common/makeLayout";
import { parseManifests } from "../common/parseManifests";
import type { Manifest, ManifestList } from "../types/types";
import { HtmlFlowNode } from "./HtmlFlowNode";

const onLoad: OnLoadFunc = (reactFlowInstance) => {
  reactFlowInstance.fitView();
};

interface K8sViewerProps extends Omit<ReactFlowProps, "elements"> {
  manifests: ManifestList | Manifest[];
}

export const K8sViewer: FC<K8sViewerProps> = ({
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
    <Fragment>
      <ReactFlow
        //@ts-ignore
        nodeTypes={{ ingress: HtmlFlowNode }}
        onLoad={onLoad}
        paneMoveable={true}
        nodesDraggable={true}
        elementsSelectable={false}
        nodesConnectable={false}
        {...props}
        elements={flow}
      />
    </Fragment>
  );
};
