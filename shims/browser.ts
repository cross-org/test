import type { ContextStepFunction, SimpleStepFunction, StepOptions, StepSubject, TestContext, TestSubject, WrappedTestOptions } from "../mod.ts";

/**
 * Browser test runner - a minimal test runner for browser environments.
 * Results are logged to the console with styled output where supported.
 */

// Track test results for summary
const testResults: Array<{ name: string; passed: boolean; error?: Error; duration: number }> = [];

// Check if console supports styling (most modern browsers do)
const supportsStyles = typeof window !== "undefined" && typeof console !== "undefined";

// Console styling for browser DevTools
const styles = {
  pass: "color: #22c55e; font-weight: bold",
  fail: "color: #ef4444; font-weight: bold",
  skip: "color: #f59e0b; font-weight: bold",
  step: "color: #6366f1",
  info: "color: #64748b",
};

function logResult(type: "pass" | "fail" | "skip" | "step" | "info", message: string): void {
  if (supportsStyles) {
    console.log(`%c${message}`, styles[type]);
  } else {
    console.log(message);
  }
}

export async function wrappedTest(
  name: string,
  testFn: TestSubject,
  options: WrappedTestOptions,
): Promise<void> {
  // Handle skip option
  if (options?.skip) {
    logResult("skip", `⊘ SKIP: ${name}`);
    testResults.push({ name, passed: true, duration: 0 });
    return;
  }

  const startTime = performance.now();

  // Create wrapped context with step method
  const wrappedContext: TestContext = {
    // deno-lint-ignore no-explicit-any
    step: async (_stepName: string, stepFn: SimpleStepFunction | ContextStepFunction | StepSubject, stepOptions?: StepOptions): Promise<any> => {
      // Browser doesn't have native nested test support, so we run steps inline
      // Check function arity to determine how to handle it:
      // - length 0: Simple function with no parameters
      // - length 1: Function with context parameter for nesting
      // - length 2: Function with context and done callback
      const isSimpleFunction = stepFn.length === 0;
      const isContextFunction = stepFn.length === 1 && !stepOptions?.waitForCallback;
      const isCallbackFunction = stepOptions?.waitForCallback === true;

      const stepStart = performance.now();

      try {
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

        const stepDuration = performance.now() - stepStart;
        logResult("step", `  ✓ ${_stepName} (${stepDuration.toFixed(0)}ms)`);
      } catch (error) {
        const stepDuration = performance.now() - stepStart;
        logResult("fail", `  ✗ ${_stepName} (${stepDuration.toFixed(0)}ms)`);
        throw error;
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

        const stepStart = performance.now();

        try {
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

          const stepDuration = performance.now() - stepStart;
          logResult("step", `    ✓ ${_nestedStepName} (${stepDuration.toFixed(0)}ms)`);
        } catch (error) {
          const stepDuration = performance.now() - stepStart;
          logResult("fail", `    ✗ ${_nestedStepName} (${stepDuration.toFixed(0)}ms)`);
          throw error;
        }
      },
    };
  }

  try {
    // Adapt the context here
    let testFnPromise = undefined;
    const callbackPromise = new Promise((resolve, reject) => {
      testFnPromise = testFn(wrappedContext, (e) => {
        if (e) reject(e);
        else resolve(0);
      });
    });
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
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
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      // Make sure testFnPromise has completed
      await testFnPromise;
      if (options.waitForCallback) await callbackPromise;
    }

    const duration = performance.now() - startTime;
    logResult("pass", `✓ PASS: ${name} (${duration.toFixed(0)}ms)`);
    testResults.push({ name, passed: true, duration });
  } catch (error) {
    const duration = performance.now() - startTime;
    logResult("fail", `✗ FAIL: ${name} (${duration.toFixed(0)}ms)`);
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
      if (error.stack) {
        console.error(`  Stack: ${error.stack}`);
      }
      testResults.push({ name, passed: false, error, duration });
    } else {
      console.error(`  Error: ${String(error)}`);
      testResults.push({ name, passed: false, error: new Error(String(error)), duration });
    }
  }
}

/**
 * Get a summary of all test results.
 * Useful for integrating with CI systems or custom reporting.
 */
export function getTestResults(): Array<{ name: string; passed: boolean; error?: Error; duration: number }> {
  return [...testResults];
}

/**
 * Print a summary of all test results.
 * Call this at the end of your test file to see the overall results.
 */
export function printTestSummary(): void {
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;
  const total = testResults.length;
  const totalDuration = testResults.reduce((acc, r) => acc + r.duration, 0);

  console.log("\n" + "=".repeat(50));
  logResult("info", `Test Summary: ${passed}/${total} passed, ${failed} failed (${totalDuration.toFixed(0)}ms)`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    testResults.filter((r) => !r.passed).forEach((r) => {
      logResult("fail", `  ✗ ${r.name}`);
      if (r.error) {
        console.error(`    ${r.error.message}`);
      }
    });
  }
}
