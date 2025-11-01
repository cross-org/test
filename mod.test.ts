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

// Test with callback-based step (testing the new feature)
test("Test with callback-based steps", async (context) => {
  let stepCompleted = false;

  await context.step("Callback-based step", (_stepContext, done) => {
    setTimeout(() => {
      stepCompleted = true;
      assertEquals(stepCompleted, true);
      done();
    }, 100);
  }, { waitForCallback: true });

  // Verify step completed before moving on
  assertEquals(stepCompleted, true);
});

// Test with multiple callback-based steps
test("Test with multiple callback-based steps", async (context) => {
  const results: number[] = [];

  await context.step("Step 1 with callback", (_stepContext, done) => {
    setTimeout(() => {
      results.push(1);
      assertEquals(results.length, 1);
      done();
    }, 50);
  }, { waitForCallback: true });

  await context.step("Step 2 with callback", (_stepContext, done) => {
    setTimeout(() => {
      results.push(2);
      assertEquals(results.length, 2);
      done();
    }, 50);
  }, { waitForCallback: true });

  await context.step("Step 3 verify", () => {
    assertEquals(results, [1, 2]);
  });
});

// Test two-level nesting (steps within steps)
test("Two-level nested steps", async (context) => {
  let counter = 0;

  await context.step("Level 1", async (context: import("./mod.ts").TestContext) => {
    counter++;
    assertEquals(counter, 1);

    await context.step("Level 2 - step 1", () => {
      counter++;
      assertEquals(counter, 2);
    });

    await context.step("Level 2 - step 2", () => {
      counter++;
      assertEquals(counter, 3);
    });
  });

  assertEquals(counter, 3);
});

// Test three-level nesting
test("Three-level nested steps", async (context) => {
  let counter = 0;

  await context.step("Level 1", async (context: import("./mod.ts").TestContext) => {
    counter++;
    assertEquals(counter, 1);

    await context.step("Level 2", async (context: import("./mod.ts").TestContext) => {
      counter++;
      assertEquals(counter, 2);

      await context.step("Level 3", () => {
        counter++;
        assertEquals(counter, 3);
      });
    });
  });

  assertEquals(counter, 3);
});

// Test complex nested hierarchy with multiple branches
test("Complex nested hierarchy", async (context) => {
  const visited: string[] = [];

  await context.step("Root", async (context: import("./mod.ts").TestContext) => {
    visited.push("root");

    await context.step("Branch A", async (context: import("./mod.ts").TestContext) => {
      visited.push("a");

      await context.step("Branch A1", () => {
        visited.push("a1");
      });

      await context.step("Branch A2", () => {
        visited.push("a2");
      });
    });

    await context.step("Branch B", async (context: import("./mod.ts").TestContext) => {
      visited.push("b");

      await context.step("Branch B1", () => {
        visited.push("b1");
      });
    });
  });

  assertEquals(visited, ["root", "a", "a1", "a2", "b", "b1"]);
});

// Test three-level nesting with mixed async/callback operations
test("Three-Level Nesting with Mixed Operations", async (context) => {
  let executionCount = 0;

  await context.step("Level 1", async (context: import("./mod.ts").TestContext) => {
    executionCount++;
    assertEquals(executionCount, 1);

    await context.step("Level 2", async (context: import("./mod.ts").TestContext) => {
      executionCount++;
      assertEquals(executionCount, 2);

      // Test Level 3 with async operation
      await context.step("Level 3 - Async", async () => {
        executionCount++;
        await new Promise((resolve) => setTimeout(() => resolve(undefined), 5));
        assertEquals(executionCount, 3);
      });

      // Test Level 3 with callback operation
      await context.step("Level 3 - Callback", (_context: import("./mod.ts").TestContext, done: (value?: unknown) => void) => {
        executionCount++;
        setTimeout(() => {
          assertEquals(executionCount, 4);
          done();
        }, 5);
      }, { waitForCallback: true });
    });
  });

  assertEquals(executionCount, 4);
});
