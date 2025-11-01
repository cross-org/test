import { test } from './mod.ts';
import { assertEquals } from '@std/assert';

test('Three-Level Nesting Bug', async (context) => {
  let executionCount = 0;

  await context.step('Level 1', async (context) => {
    executionCount++; // ✅ Executes in both runtimes
    
    await context.step('Level 2', async (context) => {
      executionCount++; // ✅ Executes in both runtimes
      
      // 🐛 These Level 3 operations fail silently in Deno:
      await context.step('Level 3 - Async', async () => {
        executionCount++; // ❌ Never executes in Deno
        await new Promise(resolve => setTimeout(() => resolve(undefined), 5));
      });
      
      await context.step('Level 3 - Callback', (_context, done) => {
        executionCount++; // ❌ Never executes in Deno
        setTimeout(() => done(), 5);
      }, { waitForCallback: true });
    });
  });

  console.log(`Executed operations: ${executionCount}`);
  assertEquals(executionCount, 4); // Passes in Node.js, fails in Deno
});
