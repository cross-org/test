import { test } from './mod.ts';
import { assertEquals } from '@std/assert';

// Test only two-level nesting to isolate the issue
test('Node Test: Two level nesting ONLY', async (context) => {
  console.log('Starting two-level nesting test');
  let counter = 0;
  
  console.log('About to enter Level 1');
  await context.step('Level 1', async (context) => {
    console.log('Inside Level 1');
    
    console.log('About to enter Level 2 - step 1');
    await context.step('Level 2 - step 1', () => {
      console.log('Inside Level 2 - step 1');
      counter++;
      assertEquals(counter, 1);
      console.log('Finished Level 2 - step 1');
    });
    
    console.log('About to enter Level 2 - step 2');
    await context.step('Level 2 - step 2', () => {
      console.log('Inside Level 2 - step 2');
      counter++;
      assertEquals(counter, 2);
      console.log('Finished Level 2 - step 2');
    });
    
    console.log('Finished Level 1');
  });
  
  console.log('Test completed successfully');
});
