import React from "react";
import { Position, Handle } from "react-flow-renderer";

type AnyObject = {
  [U: string]: any;
};

interface HtmlLabelComponentProps {
  data: AnyObject;
}

export const HtmlFlowNode = ({ data }: HtmlLabelComponentProps) => {
  return (
    <div
      style={{
        whiteSpace: "nowrap",
        overflow: "hidden",
        textAlign: "left",
      }}
      className="react-flow__node-default react-flow__node-input react-flow__node-output"
      title={data.label}
    >
      <Handle type="target" position={Position.Left} />
      <div dangerouslySetInnerHTML={{ __html: data.label }} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
