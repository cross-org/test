import { test } from "./mod.js";
import { assertEquals, assertNotEquals } from "jsr:@std/assert";

test("Addition", {}, () => {
  assertEquals(2 + 3, 5);
  assertEquals(10 + -5, 5);
});

test("Multiplication", {}, () => {
  assertNotEquals(5 * 5, 20); // This test will fail
});
