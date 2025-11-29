## Cross-runtime Testing for Deno, Bun, Node.js, and Browsers

[![JSR Version](https://jsr.io/badges/@cross/test?v=bust)](https://jsr.io/@cross/test) [![JSR Score](https://jsr.io/badges/@cross/test/score?v=bust)](https://jsr.io/@cross/test/score)

A minimal, focused testing framework for writing tests that run identically across Deno, Bun, Node.js, and browsers. Part of the @cross suite - check out our growing collection of cross-runtime tools
at [github.com/cross-org](https://github.com/cross-org).

### Why @cross/test?

While `node:test` now works across runtimes, @cross/test provides unique advantages:

- **Unified Simple API** - Single `test()` function with consistent behavior across all runtimes
- **JSR-First** - Seamlessly works with JSR packages like `@std/assert` and `@std/expect`
- **Test Steps** - Built-in `context.step()` support for organizing tests into sequential steps with shared state
- **Callback Support** - Native `waitForCallback` option for callback-based async tests
- **Browser Support** - Run the same tests in browser environments with console output
- **Minimal Surface** - Focused API that abstracts runtime differences without bloat

### Installation

Install `@cross/test` along with the assertion library of your choice. We recommend using `@std/assert` for consistency across runtimes:

```bash
# Pick your runtime and package manager:
npx jsr add @cross/test @std/assert  # Node.js
deno add jsr:@cross/test jsr:@std/assert     # Deno
bunx jsr add @cross/test @std/assert # Bun
```

### Examples

#### Simple tests with @std/assert

```javascript
import { test } from "@cross/test";
import { assertEquals, assertNotEquals } from "@std/assert";

test("Multiplication", () => {
  assertEquals(5 * 4, 20);
});

test("Test with timeout", () => {
  assertEquals(5 * 4, 20);
}, { timeout: 1000 });

// Callback-based async test (unique to @cross/test)
test("Callback-based async", (_context, done) => {
  setTimeout(() => {
    assertNotEquals(5, 4);
    done();
  }, 500);
}, { waitForCallback: true });
```

#### Test steps for sequential workflows

Organize tests into steps with shared state - perfect for integration tests and workflows:

```javascript
import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

test("User registration flow", async (context) => {
  let userId;

  await context.step("Create user", () => {
    userId = createUser("john@example.com");
    assertEquals(typeof userId, "string");
  });

  await context.step("Verify user exists", () => {
    const user = getUser(userId);
    assertEquals(user.email, "john@example.com");
  });

  await context.step("Delete user", () => {
    deleteUser(userId);
    assertEquals(getUser(userId), null);
  });
});
```

Steps share the parent test's scope and execute sequentially, making complex test flows easy to write and debug.

#### Callback support in test steps

Just like tests, steps can also use callbacks for async operations with the `waitForCallback` option:

```javascript
import { test } from "@cross/test";
import { assertEquals } from "@std/assert";

test("Test with callback-based steps", async (context) => {
  let completed = false;

  await context.step("Async operation", (_context, done) => {
    setTimeout(() => {
      completed = true;
      done();
    }, 100);
  }, { waitForCallback: true });

  assertEquals(completed, true);
});
```

#### Spying, mocking and stubbing using sinon

```js
import { test } from "@cross/test";
import { assertEquals } from "@std/assert";
import sinon from "sinon";

// Prepare the "environment"
function bar() {/*...*/}
export const funcs = {
  bar,
};
export function foo() {
  funcs.bar();
}

test("calls bar during execution of foo", () => {
  const spy = sinon.spy(funcs, "bar");

  foo();

  assertEquals(spy.called, true);
  assertEquals(spy.getCalls().length, 1);
});
```

### Running the tests

- **Node.js:** `node --test`
- **Node.js (TS):** `npx tsx --test` _Remember `{ "type": "module" }` in package.json_
- **Deno:** `deno test`
- **Bun:** `bun test`
- **Browser:** Include the bundled test file in an HTML page (see below)

### Browser Usage

@cross/test can run tests directly in the browser. Results are output to the browser's developer console with styled formatting.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Browser Tests</title>
  </head>
  <body>
    <script type="module">
      import { printTestSummary, test } from "https://esm.sh/jsr/@cross/test";

      // Your tests run automatically when imported
      test("Browser test", () => {
        if (1 + 1 !== 2) throw new Error("Math is broken");
      });

      test("Async browser test", async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Print summary after all tests complete
      setTimeout(() => printTestSummary(), 1000);
    </script>
  </body>
</html>
```

The browser shim provides:

- `test()` - Same API as other runtimes
- `getTestResults()` - Get an array of test results for custom reporting
- `printTestSummary()` - Print a formatted summary to the console

### Configuring CI

- **Bun (GitHub Actions):**

```yaml
name: Bun CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: antongolub/action-setup-bun@v1.12.8
        with:
          bun-version: v1.x # Uses latest bun 1
      - run: bun x jsr add @cross/test @std/assert # Installs dependencies
      - run: bun test # Runs the tests
```

- **Deno (GitHub Actions):**

```yaml
name: Deno CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x # Uses latest deno version 1
      - run: deno add @cross/test @std/assert # Installs dependencies from jsr.io
      - run: deno test # Runs tests
```

- **Node (GitHub actions):**

```yaml
name: Node.js CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 21.x]

    steps:
      - uses: actions/checkout@v3
      - run: npx jsr add @cross/test @std/assert
      - run: "echo '{ \"type\": \"module\" }' > package.json" # Needed for tsx to work
      - run: npx --yes tsx --test *.test.ts
```
