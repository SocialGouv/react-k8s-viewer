import React from "react";
import { render } from "@testing-library/react";

describe("Fake test <K8sViewer />", () => {
  test("rendered text", () => {
    const screen = render(
      <div style={{ width: 1000, height: 800 }}>Service app</div>
    );
    expect(screen.getByText("Service app")).toBeDefined();
  });
});
