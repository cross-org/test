import { TestSubject, WrappedTestOptions } from "../mod.ts"; // Assuming cross runtime types are here

export function wrappedTest(name: string, testFn: TestSubject, options: WrappedTestOptions) {
  Deno.test({
    name,
    ignore: options?.skip || false,
    async fn(context) {
      // Adapt the context here
      let testFnPromise = undefined;
      const callbackPromise = new Promise((resolve, reject) => { 
          testFnPromise = testFn(context, (e) => { if (e) { reject(e) } else { resolve(0) }});
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
          await options.waitForCallback ? callbackPromise : testFnPromise;
        }
      } catch (error) {
        throw error;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        await testFnPromise;
        if (options.waitForCallback) await callbackPromise;
      }
    },
  });
}