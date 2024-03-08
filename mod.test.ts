import { test } from "./mod.ts";
import { assertEquals, assertNotEquals, assertThrows } from "@std/assert";

// Simple test
test("Multiplication", () => {
  assertEquals(5 * 4, 20);
});

// Simple test with timeout
test("Multiplication with timeout", () => {
  assertEquals(5 * 4, 20);
}, { timeout: 1000 });

// Test with done callback (useful for async operations)
test("Async test", (_context, done) => {
   setTimeout(() => {
     assertNotEquals(2 + 2, 4); 
     done(); // Signal test completion
   }, 500); 
}, { waitForCallback: true});