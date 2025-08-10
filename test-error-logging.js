// Quick test to create sample error logs for demonstration

async function testErrorLogging() {
  try {
    // Create a test error log
    const response = await fetch('http://localhost:5000/api/admin/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=admin' // Bypass auth in development
      },
      body: JSON.stringify({
        title: "Sample API Integration Error",
        description: "This is a demonstration error to show how the error logging system captures and displays issues. In real usage, this would be automatically generated when API calls fail.",
        errorType: "API",
        severity: "medium",
        source: "TestSystem",
        stackTrace: "Error: Sample error for demonstration\n    at testFunction (test.js:10:5)\n    at main (test.js:25:3)",
        fixPrompt: "This is a sample error created for testing. To fix similar API integration errors, check your API keys, verify network connectivity, and ensure proper error handling is implemented. Review the API documentation for rate limits and authentication requirements.",
        metadata: {
          testError: true,
          apiEndpoint: "https://api.example.com/test",
          timestamp: new Date().toISOString(),
          sampleData: "This demonstrates how metadata can include context"
        }
      })
    });

    const result = await response.json();
    console.log('Test error created:', result);

    // Create another error with different severity
    const response2 = await fetch('http://localhost:5000/api/admin/errors', {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session=admin'
      },
      body: JSON.stringify({
        title: "Database Connection Timeout",
        description: "Database connection timed out after 30 seconds. This affects user authentication, data retrieval, and all database-dependent features.",
        errorType: "Database",
        severity: "critical",
        source: "DatabaseService",
        stackTrace: "Error: Connection timeout\n    at Pool.connect (pg-pool.js:45:12)\n    at Database.query (database.js:20:8)",
        fixPrompt: "Database connection is timing out. Check if the DATABASE_URL is correct, verify the PostgreSQL server is running and accessible, check network connectivity, and review connection pool settings. This is critical and needs immediate attention.",
        metadata: {
          timeout: 30000,
          connectionAttempts: 3,
          serverStatus: "unknown",
          timestamp: new Date().toISOString()
        }
      })
    });

    const result2 = await response2.json();
    console.log('Critical error created:', result2);

  } catch (error) {
    console.error('Failed to create test errors:', error);
  }
}

testErrorLogging();