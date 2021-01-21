import { someFunction } from "./someFunction";

describe("someFunction()", () => {
  test("return value", () => {
    expect(someFunction()).toBe("test");
  });
});
