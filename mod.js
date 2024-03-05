import { CurrentRuntime, Runtimes } from "./runtime.js";

let wrappedTestToUse;
if (CurrentRuntime == Runtimes.Deno) {
  const { wrappedTest } = await import("./shim.deno.js");
  wrappedTestToUse = wrappedTest;
} else if (CurrentRuntime == Runtimes.Node) {
  const { wrappedTest } = await import("./shim.node.js");
  wrappedTestToUse = wrappedTest;
} else {
  throw new Error("Unsupported runtime");
}
/**
 * Defines and executes a single test.
 * @param {string} name - The name of the test.
 * @param {function} testFn - The function containing the test logic. The function should not take arguments or return a value.
 */
export async function test(name, options, testFn) {
  await wrappedTestToUse(name, options, testFn);
}
