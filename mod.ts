/**
 * Stores the results of test execution.
 * @property {number} passed - The number of tests that have passed.
 * @property {number} failed - The number of tests that have failed.
 */
const results = {
  passed: 0,
  failed: 0,
};

/**
 * Defines and executes a single test.
 * @param {string} name - The name of the test.
 * @param {function} testFn - The function containing the test logic. The function should not take arguments or return a value.
 */
function test(name: string, testFn: () => void) {
  console.log(`Test: ${name}`);

  try {
    testFn();
    results.passed++;
    console.log("  ✓ Passed");
  } catch (error) {
    results.failed++;
    console.log(`  ✗ Failed: ${error.message}`);
  }
}

/**
 * Generates a report summarizing the test execution results.
 */
function report() {
  console.log("\n----- Test Results -----");
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  if (results.failed > 0) {
    // ToDo: Cross Runtime exit with error code, like Deno.exit(1);
  }
}

export { report, test };
