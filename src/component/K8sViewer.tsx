// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line simple-import-sort/sort
import React from "react";
import ReactFlow, { Position, Handle } from "react-flow-renderer";
import type { ReactFlowProps } from "react-flow-renderer";

console.log("Position", Position);

// eslint-disable-next-line import/no-unresolved
import { makeLayout } from "../common/makeLayout";
// eslint-disable-next-line import/no-unresolved
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

interface HtmlLabelComponentProps {
  data: AnyObject;
}

const HtmlLabelComponent = ({ data }: HtmlLabelComponentProps) => {
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
      <Handle
        type="target"
        position={Position.Left}
        style={{ borderRadius: 0 }}
      />
      <span dangerouslySetInnerHTML={{ __html: data.label }} />
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: "30%", borderRadius: 0 }}
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
        nodeTypes={{ ingress: HtmlLabelComponent }}
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
