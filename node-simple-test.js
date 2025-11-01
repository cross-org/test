import { test } from 'node:test';

// Simple test to verify nested context.test works in Node.js
test('Two level nesting test', async (context) => {
  console.log('Starting two-level nesting test');
  let counter = 0;
  
  console.log('About to enter Level 1');
  await context.test('Level 1', async (context) => {
    console.log('Inside Level 1');
    
    console.log('About to enter Level 2 - step 1');
    await context.test('Level 2 - step 1', () => {
      console.log('Inside Level 2 - step 1');
      counter++;
      console.log('Counter is now:', counter);
      console.log('Finished Level 2 - step 1');
    });
    
    console.log('About to enter Level 2 - step 2');
    await context.test('Level 2 - step 2', () => {
      console.log('Inside Level 2 - step 2');
      counter++;
      console.log('Counter is now:', counter);
      console.log('Finished Level 2 - step 2');
    });
    
    console.log('Finished Level 1');
  });
  
  console.log('Test completed successfully, counter =', counter);
});
