import { writeDocument, readDocument, listLanguages, listProjects, listDocuments } from '../src/utils/filesystem.js';
import { documentIndex } from '../src/utils/search.js';

async function testDocumentOperations() {
  console.log('=== Testing document operations ===');
  
  // Initialize the document index
  console.log('Initializing document index...');
  await documentIndex.initialize();
  
  // 1. List available languages
  console.log('\n1. Listing languages:');
  const languages = await listLanguages();
  console.log(`Found languages: ${languages.join(', ')}`);
  
  // 2. List python documents
  console.log('\n2. Listing Python documents:');
  const pythonDocs = await listDocuments('stdlib', 'python');
  console.log(`Python documents: ${pythonDocs.join(', ')}`);
  
  // 3. Create a test document
  console.log('\n3. Creating test document:');
  const testContent = '# Test Document\n\nThis is a test document for debugging.';
  const testMeta = {
    title: 'Debug Test Document',
    description: 'Document for debugging Jane system',
    author: 'Debugger',
    tags: ['test', 'debug'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const writeResult = await writeDocument('stdlib', 'python/debug-test.md', testContent, testMeta);
  console.log(`Write result: ${writeResult}`);
  
  // 4. Read the document back
  console.log('\n4. Reading test document:');
  const readResult = await readDocument('stdlib', 'python/debug-test.md');
  console.log('Read result:', readResult ? 'Success' : 'Failed');
  if (readResult) {
    console.log(`  Path: ${readResult.path}`);
    console.log(`  Title: ${readResult.meta.title}`);
  }
  
  // 5. List documents again to verify
  console.log('\n5. Verifying document was created:');
  const updatedPythonDocs = await listDocuments('stdlib', 'python');
  console.log(`Updated Python documents: ${updatedPythonDocs.join(', ')}`);
  
  // 6. Add document to index and search
  console.log('\n6. Adding document to index and searching:');
  if (readResult) {
    await documentIndex.addOrUpdateDocument(readResult);
    console.log('Document added to index');
    
    // Search for the document
    const searchResults = await documentIndex.search('debug', {
      type: 'stdlib',
      language: 'python',
      includeContent: true
    });
    
    console.log(`Search results: ${searchResults.length}`);
    searchResults.forEach((result, i) => {
      console.log(`Result ${i+1}: ${result.document.path} - ${result.document.meta.title}`);
    });
  }
  
  // 7. List projects
  console.log('\n7. Listing projects:');
  const projects = await listProjects();
  console.log(`Found projects: ${projects.join(', ')}`);

  // 8. List spec documents
  console.log('\n8. Listing spec documents:');
  for (const project of projects) {
    const specDocs = await listDocuments('spec', project);
    console.log(`  Project ${project} documents: ${specDocs.join(', ')}`);
  }
}

testDocumentOperations().catch(error => {
  console.error('Test failed with error:', error);
  process.exit(1);
});