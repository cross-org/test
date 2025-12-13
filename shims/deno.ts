import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "../mod.ts"; // Assuming cross runtime types are here

export function wrappedTest(name: string, testFn: TestSubject, options: WrappedTestOptions): Promise<void> {
  // @ts-ignore The Deno namespace isn't available in Node or Bun
  Deno.test({
    name,
    ignore: options?.skip || false,
    async fn(context) {
      // Create wrapped context with step method
      const wrappedContext: TestContext = {
        // deno-lint-ignore no-explicit-any
        step: async (stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
          // Check function arity to determine how to handle it:
          // - length 0: Simple function with no parameters
          // - length 1: Function with context parameter for nesting
          // - length 2: Function with context and done callback
          const isSimpleFunction = stepFn.length === 0;
          const isContextFunction = stepFn.length === 1 && !stepOptions?.waitForCallback;
          const isCallbackFunction = stepOptions?.waitForCallback === true;

          // @ts-ignore context.step exists in Deno
          await context.step(stepName, async (stepContext) => {
            if (isSimpleFunction && !isCallbackFunction) {
              // Simple function without context or callback
              await (stepFn as SimpleStepFunction)();
            } else if (isContextFunction) {
              // Function with context parameter - create proper nested context
              const nestedWrappedContext: TestContext = createNestedContext(stepContext);
              await (stepFn as (context: TestContext) => void | Promise<void>)(nestedWrappedContext);
            } else {
              // Callback-based function
              const nestedWrappedContext: TestContext = createNestedContext(stepContext);
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
        },
      };

      // Helper function to create nested context with proper step support
      // deno-lint-ignore no-explicit-any
      function createNestedContext(denoContext: any): TestContext {
        return {
          // deno-lint-ignore no-explicit-any
          step: async (nestedStepName: string, nestedStepFn: SimpleStepFunction | ContextStepFunction | StepSubject, nestedStepOptions?: StepOptions): Promise<any> => {
            const isNestedSimple = nestedStepFn.length === 0;
            const isNestedContext = nestedStepFn.length === 1 && !nestedStepOptions?.waitForCallback;
            const isNestedCallback = nestedStepOptions?.waitForCallback === true;

            if (denoContext && typeof denoContext.step === "function") {
              // @ts-ignore context.step exists in Deno
              await denoContext.step(nestedStepName, async (deeperContext) => {
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
              // Fallback: execute step directly without Deno nesting when context lacks step method or is undefined
              // This can occur at deeper nesting levels where Deno's context.step may not be available
              if (isNestedSimple && !isNestedCallback) {
                await (nestedStepFn as SimpleStepFunction)();
              } else if (isNestedContext) {
                // Create a fallback context for deeper nesting
                const fallbackContext = createNestedContext(undefined);
                await (nestedStepFn as (context: TestContext) => void | Promise<void>)(fallbackContext);
              } else {
                // Callback-based step without Deno context
                const fallbackContext = createNestedContext(undefined);
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
      let timeoutId: number = -1; // Store the timeout ID
      try {
        if (options.timeout && options.timeout > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error("Test timed out"));
            }, options.timeout);
          });
          await Promise.race([options.waitForCallback ? callbackPromise : testFnPromise, timeoutPromise]);
        } else {
          await options.waitForCallback ? callbackPromise : testFnPromise;
        }
      } finally {
        if (timeoutId !== -1) clearTimeout(timeoutId);
        await testFnPromise;
        if (options.waitForCallback) await callbackPromise;
      }
    },
  });
  return Promise.resolve();
}
