## Cross-runtime Testing for Deno, Bun, and Node.js

[![JSR Version](https://jsr.io/badges/@cross/test?v=bust)](https://jsr.io/@cross/test) [![JSR Score](https://jsr.io/badges/@cross/test/score?v=bust)](https://jsr.io/@cross/test/score)

@cross/test is a minimal testing framework designed for seamless use across Deno, Bun, and Node.js. Works great with @std/assert and @std/expect for assertions, and sinon for spying. Part of the @cross suite - check out our growing collection of cross-runtime tools at [github.com/cross-org](https://github.com/cross-org).

### Installation

Install `@cross/test` along with the assertion library of your choice. We recommend using `@std/assert` for consistency across runtimes:

```bash
# Pick your runtime and package manager:
npx jsr add @cross/test @std/assert  # Node.js
deno add @cross/test @std/assert     # Deno
bunx jsr add @cross/test @std/assert # Bun
```

### Examples

#### Assertions using @std/assert

```javascript
import { test } from "@cross/test";
import { assertEquals, assertNotEquals } from "@std/assert";

test("Multiplication", () => {
  assertEquals(5 * 4, 20);
});

test("Multiplication with timeout", () => {
  assertEquals(5 * 4, 20);
}, { timeout: 1000 });

test("Async test", (_context, done) => {
  setTimeout(() => {
    assertNotEquals(5, 4);
    done();
  }, 500);
}, { waitForCallback: true });
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
      - run: deno test  # Runs tests
```

- **Node (GitHub actions):**

```yaml
name: Node.js CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

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
