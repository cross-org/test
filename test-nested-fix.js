import { test as nodeTest } from 'node:test';

// Simplified version of the fixed wrappedTest for testing
function test(name, testFn, options = {}) {
  nodeTest(name, { skip: options?.skip || false, timeout: options?.timeout }, async (context) => {
    const wrappedContext = {
      step: async (stepName, stepFn, stepOptions) => {
        const isSimpleFunction = stepFn.length === 0;
        const isContextFunction = stepFn.length === 1 && !stepOptions?.waitForCallback;
        const isCallbackFunction = stepOptions?.waitForCallback === true;

        if (context && typeof context.test === "function") {
          return await context.test(stepName, async (nestedContext) => {
            if (isSimpleFunction && !isCallbackFunction) {
              await stepFn();
            } else if (isContextFunction) {
              const nestedWrappedContext = createNestedContext(nestedContext);
              await stepFn(nestedWrappedContext);
            } else {
              const nestedWrappedContext = createNestedContext(nestedContext);
              let stepFnPromise = undefined;
              const stepCallbackPromise = new Promise((resolve, reject) => {
                stepFnPromise = stepFn(nestedWrappedContext, (e) => {
                  if (e) reject(e);
                  else resolve(0);
                });
              });
              if (stepOptions?.waitForCallback) await stepCallbackPromise;
              await stepFnPromise;
            }
          });
        }
      },
    };

    function createNestedContext(nodeContext) {
      return {
        step: async (nestedStepName, nestedStepFn, nestedStepOptions) => {
          const isNestedSimple = nestedStepFn.length === 0;
          const isNestedContext = nestedStepFn.length === 1 && !nestedStepOptions?.waitForCallback;
          const isNestedCallback = nestedStepOptions?.waitForCallback === true;

          if (nodeContext && typeof nodeContext.test === "function") {
            return await nodeContext.test(nestedStepName, async (deeperContext) => {
              if (isNestedSimple && !isNestedCallback) {
                await nestedStepFn();
              } else if (isNestedContext) {
                const deeperWrappedContext = createNestedContext(deeperContext);
                await nestedStepFn(deeperWrappedContext);
              } else {
                const deeperWrappedContext = createNestedContext(deeperContext);
                let nestedStepFnPromise = undefined;
                const nestedCallbackPromise = new Promise((resolve, reject) => {
                  nestedStepFnPromise = nestedStepFn(deeperWrappedContext, (e) => {
                    if (e) reject(e);
                    else resolve(0);
                  });
                });
                if (nestedStepOptions?.waitForCallback) await nestedCallbackPromise;
                await nestedStepFnPromise;
              }
            });
          }
        },
      };
    }

    let testFnPromise = undefined;
    const callbackPromise = new Promise((resolve, reject) => {
      testFnPromise = testFn(wrappedContext, (e) => {
        if (e) reject(e);
        else resolve(0);
      });
    });
    if (options.waitForCallback) await callbackPromise;
    await testFnPromise;
  });
}

// Test the fix - two-level nesting
test('Fixed: Two level nesting', async (context) => {
  console.log('Starting two-level nesting test');
  let counter = 0;
  
  console.log('About to enter Level 1');
  await context.step('Level 1', async (context) => {
    console.log('Inside Level 1');
    
    console.log('About to enter Level 2 - step 1');
    await context.step('Level 2 - step 1', () => {
      console.log('Inside Level 2 - step 1');
      counter++;
      if (counter !== 1) throw new Error(`Expected counter to be 1, got ${counter}`);
      console.log('Finished Level 2 - step 1');
    });
    
    console.log('About to enter Level 2 - step 2');
    await context.step('Level 2 - step 2', () => {
      console.log('Inside Level 2 - step 2');
      counter++;
      if (counter !== 2) throw new Error(`Expected counter to be 2, got ${counter}`);
      console.log('Finished Level 2 - step 2');
    });
    
    console.log('Finished Level 1');
  });
  
  console.log('Test completed successfully');
});

// Test the fix - nested context.step
test('Fixed: Nested context.step', async (context) => {
  console.log('Starting nested context.step test');
  
  await context.step('Outer step', async (context) => {
    console.log('Inside outer step');
    
    await context.step('Inner step', () => {
      console.log('If you see this, nested steps work!');
    });
    
    console.log('Inner step completed');
  });
  
  console.log('Whole test completed');
});

// Test three levels of nesting
test('Fixed: Three level nesting', async (context) => {
  console.log('Starting three-level nesting test');
  let counter = 0;
  
  await context.step('Level 1', async (context) => {
    console.log('Inside Level 1');
    counter++;
    
    await context.step('Level 2', async (context) => {
      console.log('Inside Level 2');
      counter++;
      
      await context.step('Level 3', () => {
        console.log('Inside Level 3');
        counter++;
        if (counter !== 3) throw new Error(`Expected counter to be 3, got ${counter}`);
      });
      
      console.log('Finished Level 2');
    });
    
    console.log('Finished Level 1');
  });
  
  console.log('Test completed successfully, counter =', counter);
});
