import { test } from "bun:test";
import type { TestContext, TestSubject, WrappedTestOptions } from "../mod.ts";

export async function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
): Promise<void> {
  return await test(name, async () => {
    // Create wrapped context with step method
    const wrappedContext: TestContext = {
      step: async (stepName: string, stepFn: () => void | Promise<void>) => {
        // Bun supports nested tests using test() inside another test
        // We can use test() directly as it will be nested
        return await test(stepName, stepFn);
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
    let timeoutId: number = -1; // Store the timeout ID
    try {
      if (options.timeout) {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Test timed out"));
          }, options.timeout);
        });
        await Promise.race([options.waitForCallback ? callbackPromise : testFnPromise, timeoutPromise]);
      } else {
        // No timeout, just await testFn
        await options.waitForCallback ? callbackPromise : testFnPromise;
      }
    } catch (error) {
      throw error;
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      // Make sure testFnPromise has completed
      await testFnPromise;
      if (options.waitForCallback) await callbackPromise;
    }
  });
}
