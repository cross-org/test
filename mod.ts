import { CurrentRuntime, Runtime } from "@cross/runtime";

// Re-export types and utilities from shared module for public API
export type { ContextStepFunction, SimpleStepFunction, StepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "./shims/shared.ts";

// Internal utilities are not re-exported to keep the public API clean
// They are used internally by the shims

/**
 * Runtime independent test function
 */
export interface WrappedTest {
  (name: string, testFn: TestSubject, options?: WrappedTestOptions): Promise<void>;
}

import type { TestSubject, WrappedTestOptions } from "./shims/shared.ts";

let wrappedTestToUse: WrappedTest;
if (CurrentRuntime == Runtime.Deno) {
  const { wrappedTest } = await import("./shims/deno.ts");
  // @ts-ignore js
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtime.Node) {
  const { wrappedTest } = await import("./shims/node.ts");
  // @ts-ignore js
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtime.Bun) {
  const { wrappedTest } = await import("./shims/bun.ts");
  // @ts-ignore js
  wrappedTestToUse = wrappedTest;
} else {
  throw new Error("Unsupported runtime");
}
/**
 * Defines and executes a single test.
 * @param name - The name of the test.
 * @param options? - Options for the test (structure depends on your shim)
 * @param testFn - The function containing the test logic.
 */
export async function test(name: string, testFn: TestSubject, options: WrappedTestOptions = {}) {
  await wrappedTestToUse(name, testFn, options);
}
