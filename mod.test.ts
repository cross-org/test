import { report, test } from "./mod.ts";
import { assertEquals } from "jsr:@std/assert";

test("Addition", () => {
  assertEquals(2 + 3, 5);
  assertEquals(10 + -5, 5);
});

test("Multiplication", () => {
  assertEquals(5 * 5, 20); // This test will fail
});

report();
