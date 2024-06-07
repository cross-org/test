import { test } from "node:test"; // For type safety
import type { WrappedTestOptions } from "../mod.ts"; //  Shared options
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
) {
  // deno-lint-ignore no-explicit-any
  test(name, transformOptions(options), async (context: any) => {
    // Adapt the context here
    let testFnPromise = undefined;
    const callbackPromise = new Promise((resolve, reject) => {
      testFnPromise = testFn(context, (e) => {
        if (e) reject(e);
        else resolve(0);
      });
    });
    if (options.waitForCallback) await callbackPromise;
    await testFnPromise;
  });
}
