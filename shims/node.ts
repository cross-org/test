import { test } from "node:test"; // For type safety
import type { SimpleStepFunction, StepOptions, StepSubject, TestContext, WrappedTestOptions } from "../mod.ts"; //  Shared options
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
        // Check function arity to determine how to handle it:
        // - length 0: Simple function with no parameters
        // - length 1: Function with context parameter for nesting
        // - length 2: Function with context and done callback
        const isSimpleFunction = stepFn.length === 0;
        const isContextFunction = stepFn.length === 1 && !stepOptions?.waitForCallback;
        const isCallbackFunction = stepOptions?.waitForCallback === true;

        // Node.js supports nested tests via test() within a test callback
        // Use context.test() if available (Node 18.17.0+), otherwise use global test()
        if (context && typeof context.test === "function") {
          return await context.test(stepName, async (nestedContext) => {
            if (isSimpleFunction && !isCallbackFunction) {
              // Simple function without context or callback
              await (stepFn as SimpleStepFunction)();
            } else if (isContextFunction) {
              // Function with context parameter - create proper nested context
              const nestedWrappedContext: TestContext = createNestedContext(nestedContext);
              await (stepFn as (context: TestContext) => void | Promise<void>)(nestedWrappedContext);
            } else {
              // Callback-based function
              const nestedWrappedContext: TestContext = createNestedContext(nestedContext);
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
          } else if (isContextFunction) {
            // Function with context parameter - create basic context
            const nestedWrappedContext: TestContext = {
              // deno-lint-ignore no-explicit-any
              step: async (): Promise<any> => {},
            };
            await (stepFn as (context: TestContext) => void | Promise<void>)(nestedWrappedContext);
          } else {
            // Callback-based function
            const nestedWrappedContext: TestContext = {
              // deno-lint-ignore no-explicit-any
              step: async (): Promise<any> => {},
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

    // Helper function to create nested context with proper step support
    // deno-lint-ignore no-explicit-any
    function createNestedContext(nodeContext: any): TestContext {
      return {
        // deno-lint-ignore no-explicit-any
        step: async (nestedStepName: string, nestedStepFn: SimpleStepFunction | StepSubject, nestedStepOptions?: StepOptions): Promise<any> => {
          const isNestedSimple = nestedStepFn.length === 0;
          const isNestedContext = nestedStepFn.length === 1 && !nestedStepOptions?.waitForCallback;
          const isNestedCallback = nestedStepOptions?.waitForCallback === true;

          if (nodeContext && typeof nodeContext.test === "function") {
            return await nodeContext.test(nestedStepName, async (deeperContext) => {
              if (isNestedSimple && !isNestedCallback) {
                await (nestedStepFn as SimpleStepFunction)();
              } else if (isNestedContext) {
                // Recursive: create another level of nesting
                const deeperWrappedContext = createNestedContext(deeperContext);
                await (nestedStepFn as (context: TestContext) => void | Promise<void>)(deeperWrappedContext);
              } else {
                // Callback-based nested step
                const deeperWrappedContext = createNestedContext(deeperContext);
                let nestedStepFnPromise = undefined;
                const nestedCallbackPromise = new Promise((resolve, reject) => {
                  nestedStepFnPromise = (nestedStepFn as StepSubject)(deeperWrappedContext, (e) => {
                    if (e) reject(e);
                    else resolve(0);
                  });
                });
                if (nestedStepOptions?.waitForCallback) await nestedCallbackPromise;
                await nestedStepFnPromise;
              }
            });
          } else {
            // Fallback for older Node versions
            if (isNestedSimple && !isNestedCallback) {
              await (nestedStepFn as SimpleStepFunction)();
            } else if (isNestedContext) {
              const fallbackContext: TestContext = {
                // deno-lint-ignore no-explicit-any
                step: async (): Promise<any> => {},
              };
              await (nestedStepFn as (context: TestContext) => void | Promise<void>)(fallbackContext);
            } else {
              const fallbackContext: TestContext = {
                // deno-lint-ignore no-explicit-any
                step: async (): Promise<any> => {},
              };
              let nestedStepFnPromise = undefined;
              const nestedCallbackPromise = new Promise((resolve, reject) => {
                nestedStepFnPromise = (nestedStepFn as StepSubject)(fallbackContext, (e) => {
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
    }

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
