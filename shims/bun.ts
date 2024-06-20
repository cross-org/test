import type { TestSubject, WrappedTestOptions } from "../mod.ts";

export async function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
) {
  const { test } = await import("bun:test");
  return await test(name, async () => {
    // Adapt the context here
    let testFnPromise = undefined;
    const callbackPromise = new Promise((resolve, reject) => {
      testFnPromise = testFn(undefined, (e) => {
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
