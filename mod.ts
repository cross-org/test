import { CurrentRuntime, Runtime } from "@cross/runtime";

/**
 * Simple step function without context or callback
 */
export type SimpleStepFunction = () => void | Promise<void>;

/**
 * Context step function - function with context parameter for nested steps
 */
export type ContextStepFunction = (context: TestContext) => void | Promise<void>;

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
 * Determines the function type based on arity and options
 * @internal
 */
export function getFunctionType(fn: SimpleStepFunction | ContextStepFunction | StepSubject, options?: StepOptions): "simple" | "context" | "callback" {
  if (options?.waitForCallback) return "callback";
  if (fn.length === 0) return "simple";
  if (fn.length === 1) return "context";
  return "callback";
}

/**
 * Executes a step function with the appropriate handling based on its type
 * @internal
 */
export async function executeStepFn(
  stepFn: SimpleStepFunction | ContextStepFunction | StepSubject,
  fnType: "simple" | "context" | "callback",
  createContext: () => TestContext,
  waitForCallback?: boolean,
): Promise<void> {
  if (fnType === "simple") {
    await (stepFn as SimpleStepFunction)();
  } else if (fnType === "context") {
    await (stepFn as ContextStepFunction)(createContext());
  } else {
    const ctx = createContext();
    let stepFnPromise: void | Promise<void> | undefined;
    const callbackPromise = new Promise<void>((resolve, reject) => {
      stepFnPromise = (stepFn as StepSubject)(ctx, (e) => {
        if (e) reject(e);
        else resolve();
      });
    });
    if (waitForCallback) await callbackPromise;
    await stepFnPromise;
  }
}

/**
 * Step function for nested tests - supports simple functions, context functions, and callback functions
 */
export type StepFunction = {
  (name: string, fn: SimpleStepFunction): Promise<void>;
  (name: string, fn: ContextStepFunction): Promise<void>;
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
