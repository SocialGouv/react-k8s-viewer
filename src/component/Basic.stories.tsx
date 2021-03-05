import React from "react";
import { ReactFlowProvider } from "react-flow-renderer";
import { Meta } from "@storybook/react/types-6-0";

import { K8sViewer } from "./K8sViewer";

export const Basic: React.FC<{}> = () => (
  <div style={{ height: 200 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/basic.json")} />
    </ReactFlowProvider>
  </div>
);

export const Replicas: React.FC<{}> = () => (
  <div style={{ height: 200 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/replicas.json")} />
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

export default {
  title: "K8sViewer - Basic examples", // Title of you main menu entry for this group of stories
  component: K8sViewer, // This is the component documented by this Storybook page
} as Meta;
