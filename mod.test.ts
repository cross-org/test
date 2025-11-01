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

// Test with nested steps
test("Parent test with nested steps", async (context) => {
  const results: number[] = [];
  
  await context.step("Step 1: Initialize", () => {
    results.push(1);
    assertEquals(results.length, 1);
  });
  
  await context.step("Step 2: Add more data", () => {
    results.push(2);
    assertEquals(results.length, 2);
  });
  
  await context.step("Step 3: Verify final state", () => {
    results.push(3);
    assertEquals(results, [1, 2, 3]);
  });
});

// Test with async nested steps
test("Async parent test with nested steps", async (context) => {
  let counter = 0;
  
  await context.step("Async step 1", async () => {
    await delay(10);
    counter++;
    assertEquals(counter, 1);
  });
  
  await context.step("Async step 2", async () => {
    await delay(10);
    counter++;
    assertEquals(counter, 2);
  });
});
