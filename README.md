## Cross-runtime testing framework for Deno, Bun, and Node.js

[![JSR Version](https://jsr.io/badges/@cross/test)](https://jsr.io/@cross/test) [![JSR Score](https://jsr.io/badges/@cross/test/score)](https://jsr.io/@cross/test/score)

**Work in progress**

Truly cross runtime minimal testing framework working in collaboration with @std/assert, for Node, Deno and Bun.

## Example

```js
import { report, test } from "jsr:@cross/test";
import { assertEquals } from "jsr:@std/assert";

test("Addition", () => {
  assertEquals(2 + 3, 5);
  assertEquals(10 + -5, 5);
});

test("Multiplication", () => {
  assertEquals(5 * 5, 20); // This test will fail
});

report();
```
