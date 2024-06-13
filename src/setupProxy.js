const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  // Proxy para el endpoint de frases del día
  app.use(
    "/api/phrase",
    createProxyMiddleware({
      target: "https://frasedeldia.azurewebsites.net",
      changeOrigin: true,
      pathRewrite: {
        "^/api/phrase": "/api/phrase",
      },
    })
  );

  // Proxy para el endpoint de búsqueda de ciudades
  app.use(
    "/api/locations",
    createProxyMiddleware({
      target: "http://dataservice.accuweather.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api/locations": "/locations/v1/cities/search",
      },
    })
  );

  // Proxy para el endpoint de condiciones actuales
  app.use(
    "/api/currentconditions",
    createProxyMiddleware({
      target: "http://dataservice.accuweather.com",
      changeOrigin: true,
      pathRewrite: {
        "^/api/currentconditions": "/currentconditions/v1",
      },
    })
  );

  // Proxy para el endpoint de coordenadas de OpenWeatherMap
  app.use(
    "/api/openweathermap/geo",
    createProxyMiddleware({
      target: "http://api.openweathermap.org",
      changeOrigin: true,
      pathRewrite: {
        "^/api/openweathermap/geo": "/geo/1.0/direct",
      },
    })
  );

  // Proxy para el endpoint de clima de OpenWeatherMap
  app.use(
    "/api/openweathermap/weather",
    createProxyMiddleware({
      target: "https://api.openweathermap.org",
      changeOrigin: true,
      pathRewrite: {
        "^/api/openweathermap/weather": "/data/2.5/weather",
      },
    })
  );
};
