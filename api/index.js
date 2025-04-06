// Import the main Express app
const app = require('../src/server');

// Export as serverless function
module.exports = (req, res) => {
  // This delegates all requests to the Express app
  return app(req, res);
}; 