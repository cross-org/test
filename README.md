## Cross-runtime testing framework for Deno, Bun, and Node.js

[![JSR Version](https://jsr.io/badges/@cross/test)](https://jsr.io/@cross/test) [![JSR Score](https://jsr.io/badges/@cross/test/score)](https://jsr.io/@cross/test/score)

**Work in progress**

Truly cross runtime minimal testing framework working in collaboration with @std/assert, for Node, Deno and Bun.

## Install

Node:

```
npx jsr add @cross/test @std/assert
```

Deno:

```
deno add @cross/test @std/assert
```

## Example

my.test.js

```js
import { test } from "@cross/test";
import { assertEquals, assertNotEquals } from "@std/assert";

// Simple test
test("Multiplication", () => {
  assertEquals(5 * 4, 20);
});

// Simple test with timeout
test("Multiplication with timeout", () => {
  assertEquals(5 * 4, 20);
}, { timeout: 1000 });

// Test with done callback (useful for async operations)
test("Async test", (context, done) => {
   setTimeout(() => {
     done(); // Signal test completion
   }, 500); 

   assertEquals(2 + 2, 4); 
});
```

## Running the tests

Node:

`node --test`

Deno:

`deno test`
