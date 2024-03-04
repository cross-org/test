const results = {
  passed: 0,
  failed: 0
};

function test(name: string, testFn: () => void) {
  console.log(`Test: ${name}`);

  try {
    testFn();
    results.passed++;
    console.log('  ✓ Passed');
  } catch (error) {
    results.failed++;
    console.log(`  ✗ Failed: ${error.message}`);
  }
}

function report() {
  console.log('\n----- Test Results -----');
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
}

export { test, report };