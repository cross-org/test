import { test } from "./mod.ts";
import { assertEquals, assertNotEquals } from "@std/assert";
import { delay } from "@std/async";

// Simple test
test("Multiplication", () => {
  assertEquals(5 * 4, 20);
});

// Simple test with timeout
test("Multiplication with timeout", () => {
  assertEquals(5 * 4, 20);
}, { timeout: 1000 });

// Failing async test with done callback
test("Long async test", (_context, done) => {
  setTimeout(() => {
    assertNotEquals(5, 4);
    done(); // Signal test completion
  }, 500);
}, { waitForCallback: true });

// Test with done callback (useful for async operations)
test("Async test", (_context, done) => {
  setTimeout(() => {
    assertNotEquals(5, 4);
    done(); // Signal test completion
  }, 4500);
}, { waitForCallback: true, timeout: 5500 });

// Test async
test("async hello world", async () => {
  const x = 1 + 2;

  // await some async task
  await delay(100);

  if (x !== 3) {
    throw Error("x should be equal to 3");
  }
});

/* Test sinon */
import sinon from "sinon";

function bar() {/*...*/}

export const funcs = {
  bar,
};

// 'foo' no longer takes a parameter, but calls 'bar' from an object
export function foo() {
  funcs.bar();
}

test("calls bar during execution of foo", () => {
  // create a test spy that wraps 'bar' on the 'funcs' object
  const spy = sinon.spy(funcs, "bar");

  // call function 'foo' without an argument
  foo();

  assertEquals(spy.called, true);
  assertEquals(spy.getCalls().length, 1);
});
