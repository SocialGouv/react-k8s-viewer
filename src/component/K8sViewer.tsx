import React from "react";
import ReactFlow, { Handle } from "react-flow-renderer";
import type { ReactFlowProps } from "react-flow-renderer";

import { makeLayout } from "../common/makeLayout";
import { parseManifests } from "../common/parseManifests";

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

const CustomIngressComponent = ({ data }) => {
  return (
    <div
      style={{
        width: 150,

        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
      className="react-flow__node-default react-flow__node-input react-flow__node-output"
      title={data.label}
    >
      <Handle type="target" position="left" style={{ borderRadius: 0 }} />
      <span dangerouslySetInnerHTML={{ __html: data.label }} />
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ top: "30%", borderRadius: 0 }}
      />
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ top: "70%", borderRadius: 0 }}
      />
    </div>
  );
};

interface K8sViewerProps extends ReactFlowProps {
  manifests: ManifestList | undefined;
}
export const K8sViewer: React.FC<K8sViewerProps> = ({
  manifests,
}: K8sViewerProps) => {
  if (!manifests) {
    return <div>Invalid manifests</div>;
  }

  const elements = parseManifests(manifests);
  const flow = makeLayout(elements);
  console.log({ manifests, elements, flow });
  return (
    <React.Fragment>
      <ReactFlow
        nodeTypes={{ ingress: CustomIngressComponent }}
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
