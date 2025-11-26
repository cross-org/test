import { test } from "bun:test";
import { executeStepFn, getFunctionType } from "./shared.ts";
import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "./shared.ts";

export async function wrappedTest(name: string, testFn: TestSubject, options: WrappedTestOptions): Promise<void> {
  return await test(name, async () => {
    function createNestedContext(): TestContext {
      return {
        // deno-lint-ignore no-explicit-any
        step: async (_stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
          const fnType = getFunctionType(stepFn, stepOptions);
          await executeStepFn(stepFn, fnType, createNestedContext, stepOptions?.waitForCallback);
        },
      };
    }

    const wrappedContext = createNestedContext();

    let testFnPromise: void | Promise<void> | undefined;
    const callbackPromise = new Promise<void>((resolve, reject) => {
      testFnPromise = testFn(wrappedContext, (e) => {
        if (e) reject(e);
        else resolve();
      });
    });
    let timeoutId: number = -1;
    try {
      if (options.timeout) {
        const timeoutPromise = new Promise<void>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Test timed out")), options.timeout);
        });
        await Promise.race([options.waitForCallback ? callbackPromise : testFnPromise, timeoutPromise]);
      } else {
        await (options.waitForCallback ? callbackPromise : testFnPromise);
      }
    } finally {
      if (timeoutId !== -1) clearTimeout(timeoutId);
      await testFnPromise;
      if (options.waitForCallback) await callbackPromise;
    }
  });
}
