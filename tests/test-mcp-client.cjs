const { spawn } = require('child_process');
const readline = require('readline');

// Simple MCP client to test the Jane MCP server
const testJaneMcp = async () => {
  console.log('Starting Jane MCP server test client...');

  // Spawn the Jane MCP server
  const janeProcess = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', process.stderr]
  });

  // Create interface for reading/writing to the server
  const rl = readline.createInterface({
    input: janeProcess.stdout,
    output: process.stdout
  });

  // Handle server output
  rl.on('line', (line) => {
    try {
      const message = JSON.parse(line);
      console.log('Server response:', message);
      
      // If this is the server info message, run our test sequence
      if (message.type === 'server_info') {
        runTestSequence(janeProcess.stdin);
      }
    } catch (error) {
      console.error('Error parsing server response:', error);
    }
  });

  // Handle server exit
  janeProcess.on('close', (code) => {
    console.log(`Jane MCP server exited with code ${code}`);
    process.exit(0);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Terminating Jane MCP server...');
    janeProcess.kill();
    process.exit(0);
  });
};

// Run a sequence of tests against the MCP server
const runTestSequence = async (serverInput) => {
  console.log('Running test sequence...');
  
  const tests = [
    // Test 1: List all languages
    {
      name: 'List all languages',
      request: {
        type: 'tool_call',
        id: 'test-1',
        tool: 'list_stdlibs',
        parameters: {}
      }
    },
    
    // Test 2: Search for Python list methods
    {
      name: 'Search for Python list methods',
      request: {
        type: 'tool_call',
        id: 'test-2',
        tool: 'search',
        parameters: {
          query: 'list',
          type: 'stdlib',
          language: 'python'
        }
      }
    },
    
    // Test 3: Create a test document
    {
      name: 'Create test document',
      request: {
        type: 'tool_call',
        id: 'test-3',
        tool: 'create_document',
        parameters: {
          type: 'stdlib',
          language: 'python',
          path: 'test-mcp.md',
          title: 'MCP Test Document',
          description: 'A test document created via MCP client',
          author: 'MCP Test Client',
          tags: ['test', 'mcp', 'client'],
          content: '# MCP Test Document\n\nThis document was created via the MCP client test script.'
        }
      }
    },
    
    // Test 4: Verify document was created
    {
      name: 'Verify document creation',
      request: {
        type: 'tool_call',
        id: 'test-4',
        tool: 'get_stdlib',
        parameters: {
          language: 'python',
          path: 'test-mcp.md'
        }
      }
    }
  ];
  
  // Run each test with a delay between them
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n[Test ${i+1}/${tests.length}] ${test.name}`);
    
    // Send the request to the server
    serverInput.write(JSON.stringify(test.request) + '\n');
    
    // Wait before sending the next request
    if (i < tests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Allow time for the last response
  setTimeout(() => {
    console.log('\nTests completed. Terminating server...');
    serverInput.end();
  }, 2000);
};

// Start the test
testJaneMcp().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});