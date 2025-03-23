const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Create a WebSocket proxy for hot module replacement
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:3000',
      ws: true,
      changeOrigin: true,
    })
  );

  // Proxy API requests to the backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://api.local',
      changeOrigin: true,
    })
  );
};
