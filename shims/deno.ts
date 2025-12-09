import { executeStepFn, getFunctionType } from "./shared.ts";
import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "./shared.ts";

export function wrappedTest(name: string, testFn: TestSubject, options: WrappedTestOptions): Promise<void> {
  // @ts-ignore The Deno namespace isn't available in Node or Bun
  Deno.test({
    name,
    ignore: options?.skip || false,
    async fn(context) {
      // deno-lint-ignore no-explicit-any
      function createNestedContext(denoContext: any): TestContext {
        return {
          // deno-lint-ignore no-explicit-any
          step: async (stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
            const fnType = getFunctionType(stepFn, stepOptions);
            if (denoContext && typeof denoContext.step === "function") {
              // @ts-ignore context.step exists in Deno
              await denoContext.step(stepName, async (deeperContext) => {
                await executeStepFn(stepFn, fnType, () => createNestedContext(deeperContext), stepOptions?.waitForCallback);
              });
            } else {
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
    },
  });
  return Promise.resolve();
}
