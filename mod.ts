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

/**
 * Browser test result entry
 */
export interface BrowserTestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
}

/**
 * Type for browser-only helper functions
 */
type BrowserTestHelpers = {
  getTestResults: () => BrowserTestResult[];
  printTestSummary: () => void;
};

let wrappedTestToUse: WrappedTest;
let browserHelpers: BrowserTestHelpers | undefined;

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
} else if (CurrentRuntime == Runtime.Browser) {
  const browserShim = await import("./shims/browser.ts");
  // @ts-ignore js
  wrappedTestToUse = browserShim.wrappedTest;
  browserHelpers = {
    getTestResults: browserShim.getTestResults,
    printTestSummary: browserShim.printTestSummary,
  };
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

/**
 * Get a summary of all test results (browser only).
 * Returns undefined when not running in a browser environment.
 * Useful for integrating with CI systems or custom reporting.
 */
export function getTestResults(): BrowserTestResult[] | undefined {
  return browserHelpers?.getTestResults();
}

/**
 * Print a summary of all test results to the console (browser only).
 * Does nothing when not running in a browser environment.
 * Call this at the end of your test file to see the overall results.
 */
export function printTestSummary(): void {
  browserHelpers?.printTestSummary();
}
