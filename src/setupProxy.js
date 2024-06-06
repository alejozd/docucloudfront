const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://dataservice.accuweather.com",
      changeOrigin: true,
    })
  );
  app.use(
    "/geo",
    createProxyMiddleware({
      target: "http://api.openweathermap.org",
      changeOrigin: true,
      pathRewrite: {
        "^/geo": "/geo/1.0",
      },
    })
  );
  app.use(
    "/data",
    createProxyMiddleware({
      target: "https://api.openweathermap.org",
      changeOrigin: true,
      pathRewrite: {
        "^/data": "/data/2.5",
      },
    })
  );
};
