import { test } from "node:test";
import { executeStepFn, getFunctionType } from "./shared.ts";
import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "./shared.ts";

function transformOptions(options?: WrappedTestOptions) {
  return {
    skip: options?.skip || false,
    timeout: options?.timeout,
  };
}

export function wrappedTest(name: string, testFn: TestSubject, options: WrappedTestOptions): Promise<void> {
  // deno-lint-ignore no-explicit-any
  test(name, transformOptions(options), async (context: any) => {
    // deno-lint-ignore no-explicit-any
    function createNestedContext(nodeContext: any): TestContext {
      return {
        // deno-lint-ignore no-explicit-any
        step: async (stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
          const fnType = getFunctionType(stepFn, stepOptions);
          if (nodeContext && typeof nodeContext.test === "function") {
            // deno-lint-ignore no-explicit-any
            return await nodeContext.test(stepName, async (deeperContext: any) => {
              await executeStepFn(stepFn, fnType, () => createNestedContext(deeperContext), stepOptions?.waitForCallback);
            });
          } else {
            console.warn("Warning: Nested steps are not fully supported in this Node version. Consider upgrading to Node 18.17.0+");
            await executeStepFn(stepFn, fnType, () => createNestedContext(undefined), stepOptions?.waitForCallback);
          }
        },
      };
    }

    const wrappedContext = createNestedContext(context);

    let testFnPromise: void | Promise<void> | undefined;
    const callbackPromise = new Promise<void>((resolve, reject) => {
      testFnPromise = testFn(wrappedContext, (e) => {
        if (e) reject(e);
        else resolve();
      });
    });
    if (options.waitForCallback) await callbackPromise;
    await testFnPromise;
  });
  return Promise.resolve();
}
