import { runAllTests } from './backend.test.ts';

runAllTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
