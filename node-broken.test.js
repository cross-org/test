import { test } from './mod.ts';
import { assertEquals } from '@std/assert';

// This should break - nested context.step calls
test('Node Test: BROKEN - Nested context.step', async (context) => {
  console.log('Starting nested context.step test - this will hang');
  
  await context.step('Outer step', async (context) => {
    console.log('Inside outer step');
    
    // This next line will cause Node.js to hang
    await context.step('Inner step - THIS WILL HANG', () => {
      console.log('If you see this, nested steps work in Node.js!');
      assertEquals(true, true);
    });
    
    console.log('If you see this, the inner step completed');
  });
  
  console.log('If you see this, the whole test completed');
});
