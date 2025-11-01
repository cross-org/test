import { CurrentRuntime, Runtime } from "@cross/runtime";

/**
 * Simple step function without context or callback
 */
export type SimpleStepFunction = () => void | Promise<void>;

/**
 * Step subject - the function executed within a step with context and callback support
 */
export type StepSubject = (context: TestContext, done: (value?: unknown) => void) => void | Promise<void>;

/**
 * Step options
 */
export interface StepOptions {
  waitForCallback?: boolean; // Whether to wait for the done-callback to be called
}

/**
 * Step function for nested tests - supports both simple functions and functions with context/callback
 */
export type StepFunction = {
  (name: string, fn: SimpleStepFunction): Promise<void>;
  (name: string, fn: StepSubject, options: StepOptions): Promise<void>;
};

/**
 * Test context with step support
 */
export interface TestContext {
  /**
   * Run a sub-test as a step of the parent test
   * @param name - The name of the step
   * @param fn - The function to run for this step
   * @param options - Optional configuration for the step
   */
  step: StepFunction;
}

/**
 * Test subject
 */
export type TestSubject = (context: TestContext, done: (value?: unknown) => void) => void | Promise<void>;

/**
 * Runtime independent test function
 */
export interface WrappedTest {
  (name: string, testFn: TestSubject, options?: WrappedTestOptions): Promise<void>;
}

/**
 * Runtime independent test options
 */
export interface WrappedTestOptions {
  timeout?: number; // Timeout duration in milliseconds (optional)
  skip?: boolean; // Whether to skip the test (optional)
  waitForCallback?: boolean; // Whether to wait for the done-callback to be called
}

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
