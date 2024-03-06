import { CurrentRuntime, Runtime } from "@cross/runtime";

/**
 * Runtime independent test function
 */
export interface WrappedTest {
  (name: string, options: WrappedTestOptions, testFn: () => Promise<void>): Promise<void>;
}

/**
 * Runtime independent test options
 */
export interface WrappedTestOptions {
  timeout?: number; // Timeout duration in milliseconds (optional)
  skip?: boolean; // Whether to skip the test (optional)
}

let wrappedTestToUse: WrappedTest | undefined;
if (CurrentRuntime == Runtime.Deno) {
  const { wrappedTest } = await import("./shims/deno.js");
  // @ts-ignore js
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtime.Node) {
  const { wrappedTest } = await import("./shims/node.js");
  // @ts-ignore js
  wrappedTestToUse = wrappedTest;
} else {
  throw new Error("Unsupported runtime");
}
/**
 * Defines and executes a single test.
 * @param {string} name - The name of the test.
 * @param {any} options - Options for the test (structure depends on your shim)
 * @param {() => Promise<void>} testFn - The function containing the test logic.
 */
export async function test(name: string, options: WrappedTestOptions, testFn: () => Promise<void>) {
  if (wrappedTestToUse) await wrappedTestToUse(name, options, testFn);
}
