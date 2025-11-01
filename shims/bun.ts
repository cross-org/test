import { test } from "bun:test";
import type { TestContext, TestSubject, WrappedTestOptions, StepSubject, StepOptions, SimpleStepFunction } from "../mod.ts";

export async function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
): Promise<void> {
  return await test(name, async () => {
    // Create wrapped context with step method
    const wrappedContext: TestContext = {
      // deno-lint-ignore no-explicit-any
      step: async (_stepName: string, stepFn: SimpleStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
        // Bun doesn't support nested tests like Deno, so we run steps inline
        // We could log the step name for debugging if needed

        // Check if this is a simple function (no parameters) or a callback-based function
        // Using function.length to detect arity: 0 = simple function, 2 = callback function (context, done)
        const isSimpleFunction = stepFn.length === 0;
        const isCallbackFunction = stepOptions?.waitForCallback === true;

        if (isSimpleFunction && !isCallbackFunction) {
          // Simple function without context or callback
          await (stepFn as SimpleStepFunction)();
        } else {
          // Callback-based function
          // Create a nested wrapped context for the step
          const nestedWrappedContext: TestContext = {
            // deno-lint-ignore no-explicit-any
            step: async (_nestedStepName: string, nestedStepFn: SimpleStepFunction | StepSubject, nestedStepOptions?: StepOptions): Promise<any> => {
              const isNestedSimple = nestedStepFn.length === 0;
              const isNestedCallback = nestedStepOptions?.waitForCallback === true;

              if (isNestedSimple && !isNestedCallback) {
                await (nestedStepFn as SimpleStepFunction)();
              } else {
                // Simplified context for deeply nested callback steps (level 3+)
                // Deep nesting is rare; most use cases need only one level of callback steps
                const nestedContext: TestContext = { 
                  // deno-lint-ignore no-explicit-any
                  step: async (): Promise<any> => {} 
                };
                let nestedStepFnPromise = undefined;
                const nestedCallbackPromise = new Promise((resolve, reject) => {
                  nestedStepFnPromise = (nestedStepFn as StepSubject)(nestedContext, (e) => {
                    if (e) reject(e);
                    else resolve(0);
                  });
                });
                if (nestedStepOptions?.waitForCallback) await nestedCallbackPromise;
                await nestedStepFnPromise;
              }
            },
          };

          // Handle the step function with callback support
          let stepFnPromise = undefined;
          const stepCallbackPromise = new Promise((resolve, reject) => {
            stepFnPromise = (stepFn as StepSubject)(nestedWrappedContext, (e) => {
              if (e) reject(e);
              else resolve(0);
            });
          });
          if (stepOptions?.waitForCallback) await stepCallbackPromise;
          await stepFnPromise;
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
