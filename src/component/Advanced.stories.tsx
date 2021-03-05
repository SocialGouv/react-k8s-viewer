import React from "react";
import { ReactFlowProvider } from "react-flow-renderer";
import { Meta } from "@storybook/react/types-6-0";

import { K8sViewer } from "./K8sViewer";

export const SampleNextApp: React.FC<{}> = () => (
  <div style={{ height: 700 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/sample-next-app.json")} />
    </ReactFlowProvider>
  </div>
);

export const StrapiHasura: React.FC<{}> = () => (
  <div style={{ height: 700 }}>
    <ReactFlowProvider>
      <K8sViewer manifests={require("../../fixtures/strapi-hasura-dev.json")} />
    </ReactFlowProvider>
  </div>
);

export default {
  title: "K8sViewer - Advanced", // Title of you main menu entry for this group of stories
  component: K8sViewer, // This is the component documented by this Storybook page
} as Meta;
