import React from "react";
import { ReactFlowProvider } from "react-flow-renderer";
import { Meta } from "@storybook/react/types-6-0";

import { K8sViewer } from "./K8sViewer";

// Primary will be the name for the first story
export const Basic: React.FC<{}> = () => (
  <div style={{ height: 200 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/basic.json")} />
    </ReactFlowProvider>
  </div>
);

export const IngressHosts: React.FC<{}> = () => (
  <div style={{ height: 300 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/ingress-hosts.json")} />
    </ReactFlowProvider>
  </div>
);

export const SealedSecret: React.FC<{}> = () => (
  <div style={{ height: 200 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/sealed-secret.json")} />
    </ReactFlowProvider>
  </div>
);

// Secondary will be the name for the second story
export const SampleNextApp: React.FC<{}> = () => (
  <div style={{ height: 700 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/sample-next-app.json")} />
    </ReactFlowProvider>
  </div>
);

export default {
  title: "K8sViewer", // Title of you main menu entry for this group of stories
  component: K8sViewer, // This is the component documented by this Storybook page
} as Meta;