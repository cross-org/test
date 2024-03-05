import { CurrentRuntime, Runtimes } from "./runtime.ts";

function transformOptionsToDeno(o) {
  return o;
}

function wrapDenoTest(testFn) {
  return async (c) => {
    // Transform context if needed
    await testFn(c);
  };
}

/**
 * Defines and executes a single test.
 * @param {string} name - The name of the test.
 * @param {function} testFn - The function containing the test logic. The function should not take arguments or return a value.
 */
export async function test(name, options, testFn) {
  switch (CurrentRuntime) {
    case Runtimes.Deno:
      await Deno.test(name, transformOptionsToDeno(options), wrapDenoTest(testFn));
      break;
    case Runtimes.Unsupported:
      console.error("Unsupported runtime");
      break;
  }
}
