import { readDocument, writeDocument, ensureJaneStructure, JANE_DIR, STDLIB_DIR, SPECS_DIR } from '../src/utils/filesystem.js';
import path from 'path';

async function testPaths() {
  console.log('Testing Jane path configuration');
  console.log('------------------------------');
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`Jane directory: ${JANE_DIR}`);
  console.log(`Stdlib directory: ${STDLIB_DIR}`);
  console.log(`Specs directory: ${SPECS_DIR}`);
  console.log('------------------------------');

  // Ensure directory structure exists
  await ensureJaneStructure();
  console.log('Directory structure created/verified');

  // Test writing to a new document
  const testContent = `# Test Document
  
This is a test document created to verify path handling.

Current time: ${new Date().toISOString()}
`;

  const testMeta = {
    title: 'Path Test Document',
    description: 'A document to test path handling',
    author: 'Path Tester',
    tags: ['test', 'paths'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Write test documents
  console.log('Writing test documents...');
  const stdlibResult = await writeDocument('stdlib', 'javascript/path-test.md', testContent, testMeta);
  console.log(`Stdlib write result: ${stdlibResult}`);

  const specResult = await writeDocument('spec', 'project1/path-test.md', testContent, testMeta);
  console.log(`Spec write result: ${specResult}`);

  // Read the documents back
  console.log('\nReading test documents...');
  const stdlibDoc = await readDocument('stdlib', 'javascript/path-test.md');
  console.log('Stdlib read result:', stdlibDoc ? 'Success' : 'Failed');
  if (stdlibDoc) {
    console.log(`  Path: ${stdlibDoc.path}`);
    console.log(`  Title: ${stdlibDoc.meta.title}`);
  }

  const specDoc = await readDocument('spec', 'project1/path-test.md');
  console.log('Spec read result:', specDoc ? 'Success' : 'Failed');
  if (specDoc) {
    console.log(`  Path: ${specDoc.path}`);
    console.log(`  Title: ${specDoc.meta.title}`);
  }
}

testPaths().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});