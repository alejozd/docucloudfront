const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function addProxyMiddleware(app) {
  console.log("Proxy middleware setup");
  app.use(
    "/api/phrase",
    createProxyMiddleware({
      target: "https://frasedeldia.azurewebsites.net",
      changeOrigin: true,
      pathRewrite: {
        "^/api/phrase": "/api/phrase",
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log(
          `Proxying request to: ${proxyReq.getHeader("host")}${proxyReq.path}`
        );
      },
    })
  );
  // app.use(
  //   "/api",
  //   createProxyMiddleware({
  //     target: "http://dataservice.accuweather.com",
  //     changeOrigin: true,
  //   })
  // );
  // app.use(
  //   "/geo",
  //   createProxyMiddleware({
  //     target: "http://api.openweathermap.org",
  //     changeOrigin: true,
  //     pathRewrite: {
  //       "^/geo": "/geo/1.0",
  //     },
  //   })
  // );
  // app.use(
  //   "/data",
  //   createProxyMiddleware({
  //     target: "https://api.openweathermap.org",
  //     changeOrigin: true,
  //     pathRewrite: {
  //       "^/data": "/data/2.5",
  //     },
  //   })
  // );
};
