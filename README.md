## Cross-runtime testing framework for Deno, Bun, and Node.js

[![JSR Version](https://jsr.io/badges/@cross/test)](https://jsr.io/@cross/test) [![JSR Score](https://jsr.io/badges/@cross/test/score)](https://jsr.io/@cross/test/score)

**Work in progress**

Truly cross runtime minimal testing framework working in collaboration with @std/assert, for Node, Deno and Bun.

## Install

Example for deno and node

```
npx add @cross/test @std/assert
deno add @cross/test @std/assert
```

## Example

my.test.js

```js
import { test } from "@cross/test";
import { assertEquals, assertNotEquals } from "@std/assert";

test("Addition", {}, () => {
  assertEquals(2 + 3, 5);
  assertEquals(10 + -5, 5);
});

test("Multiplication", {}, () => {
  assertNotEquals(5 * 5, 20);
});
```

## Running the tests

Deno: `deno test` Node: `node --test`
