import { test } from "node:test"; // For type safety
import type { TestContext, WrappedTestOptions } from "../mod.ts"; //  Shared options
import type { TestSubject } from "../mod.ts";

function transformOptions(options?: WrappedTestOptions) {
  return {
    skip: options?.skip || false,
    timeout: options?.timeout,
  };
}

export function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
) {
  // deno-lint-ignore no-explicit-any
  test(name, transformOptions(options), async (context: any) => {
    // Create wrapped context with step method
    const wrappedContext: TestContext = {
      step: async (stepName: string, stepFn: () => void | Promise<void>) => {
        // Node.js supports nested tests via test() within a test callback
        // Use context.test() if available (Node 18.17.0+), otherwise use global test()
        if (context && typeof context.test === "function") {
          return await context.test(stepName, stepFn);
        } else {
          // Fallback for older Node versions - run the step directly without nesting
          return await stepFn();
        }
      },
    };

    // Adapt the context here
    let testFnPromise = undefined;
    const callbackPromise = new Promise((resolve, reject) => {
      testFnPromise = testFn(wrappedContext, (e) => {
        if (e) reject(e);
        else resolve(0);
      });
    });
    if (options.waitForCallback) await callbackPromise;
    await testFnPromise;
  });
}
