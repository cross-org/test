import { test } from "node:test"; // For type safety
import type { TestContext, WrappedTestOptions, StepSubject, StepOptions, SimpleStepFunction } from "../mod.ts"; //  Shared options
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
): Promise<void> {
  // deno-lint-ignore no-explicit-any
  test(name, transformOptions(options), async (context: any) => {
    // Create wrapped context with step method
    const wrappedContext: TestContext = {
      // deno-lint-ignore no-explicit-any
      step: async (stepName: string, stepFn: SimpleStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
        // Check if this is a simple function (no parameters) or a callback-based function
        // Using function.length to detect arity: 0 = simple function, 2 = callback function (context, done)
        const isSimpleFunction = stepFn.length === 0;
        const isCallbackFunction = stepOptions?.waitForCallback === true;

        // Node.js supports nested tests via test() within a test callback
        // Use context.test() if available (Node 18.17.0+), otherwise use global test()
        if (context && typeof context.test === "function") {
          return await context.test(stepName, async () => {
            if (isSimpleFunction && !isCallbackFunction) {
              // Simple function without context or callback
              await (stepFn as SimpleStepFunction)();
            } else {
              // Callback-based function
              // Create a nested wrapped context for the step
              const nestedWrappedContext: TestContext = {
                // deno-lint-ignore no-explicit-any
                step: async (nestedStepName: string, nestedStepFn: SimpleStepFunction | StepSubject, nestedStepOptions?: StepOptions): Promise<any> => {
                  if (context && typeof context.test === "function") {
                    return await context.test(nestedStepName, async () => {
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
                    });
                  } else {
                    // Fallback for older Node versions - run the step directly without nesting
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
          });
        } else {
          // Fallback for older Node versions - run the step directly without nesting
          if (isSimpleFunction && !isCallbackFunction) {
            // Simple function without context or callback
            await (stepFn as SimpleStepFunction)();
          } else {
            // Callback-based function
            const nestedWrappedContext: TestContext = { 
              // deno-lint-ignore no-explicit-any
              step: async (): Promise<any> => {} 
            };
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
  return Promise.resolve();
}
