// deno-lint-ignore no-unused-vars
import { test } from "node:test";

function transformOptions(o) {
  return o;
}

function wrapTest(testFn) {
  return async (c) => {
    // Transform context if needed
    await testFn(c);
  };
}

export function wrappedTest(name, options, test) {
  test(name, transformOptions(options), wrapTest(test));
}
