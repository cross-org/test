import { test } from "bun:test";
import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "../mod.ts";

export async function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
): Promise<void> {
  return await test(name, async () => {
    // Create wrapped context with step method
    const wrappedContext: TestContext = {
      // deno-lint-ignore no-explicit-any
      step: async (_stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
        // Bun doesn't support nested tests like Deno, so we run steps inline
        // We could log the step name for debugging if needed

        // Check function arity to determine how to handle it:
        // - length 0: Simple function with no parameters
        // - length 1: Function with context parameter for nesting
        // - length 2: Function with context and done callback
        const isSimpleFunction = stepFn.length === 0;
        const isContextFunction = stepFn.length === 1 && !stepOptions?.waitForCallback;
        const isCallbackFunction = stepOptions?.waitForCallback === true;

        if (isSimpleFunction && !isCallbackFunction) {
          // Simple function without context or callback
          await (stepFn as SimpleStepFunction)();
        } else if (isContextFunction) {
          // Function with context parameter - create proper nested context
          const nestedWrappedContext: TestContext = createNestedContext();
          await (stepFn as (context: TestContext) => void | Promise<void>)(nestedWrappedContext);
        } else {
          // Callback-based function
          const nestedWrappedContext: TestContext = createNestedContext();
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

    // Helper function to create nested context with proper step support
    function createNestedContext(): TestContext {
      return {
        // deno-lint-ignore no-explicit-any
        step: async (_nestedStepName: string, nestedStepFn: SimpleStepFunction | ContextStepFunction | StepSubject, nestedStepOptions?: StepOptions): Promise<any> => {
          const isNestedSimple = nestedStepFn.length === 0;
          const isNestedContext = nestedStepFn.length === 1 && !nestedStepOptions?.waitForCallback;
          const isNestedCallback = nestedStepOptions?.waitForCallback === true;

          if (isNestedSimple && !isNestedCallback) {
            await (nestedStepFn as SimpleStepFunction)();
          } else if (isNestedContext) {
            // Recursive: create another level of nesting
            const deeperWrappedContext = createNestedContext();
            await (nestedStepFn as (context: TestContext) => void | Promise<void>)(deeperWrappedContext);
          } else {
            // Callback-based nested step
            const deeperWrappedContext = createNestedContext();
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
