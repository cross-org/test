// Entry point for the npm (Node.js) build - uses the Node.js shim directly.
// For cross-runtime usage via JSR, use jsr:@cross/test instead.
import type { BrowserTestResult, TestSubject, WrappedTestOptions } from "./mod.ts";
import { wrappedTest } from "./shims/node.ts";

export type { BrowserTestResult, ContextStepFunction, SimpleStepFunction, StepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTest, WrappedTestOptions } from "./mod.ts";

/**
 * Defines and executes a single test (Node.js).
 * @param name - The name of the test.
 * @param testFn - The function containing the test logic.
 * @param options? - Options for the test.
 */
export async function test(name: string, testFn: TestSubject, options: WrappedTestOptions = {}) {
  await wrappedTest(name, testFn, options);
}

/**
 * Not applicable in Node.js - always returns undefined.
 */
export function getTestResults(): BrowserTestResult[] | undefined {
  return undefined;
}

/**
 * Not applicable in Node.js - no-op.
 */
export function printTestSummary(): void {
  // no-op
}
