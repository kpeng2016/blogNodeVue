module.exports = {
  publicPath: "./",
  filenameHashing: false,
  productionSourceMap: false,
  runtimeCompiler: true,
  transpileDependencies: [
    // echarts单独配置
    "vue-echarts",
    "resize-detector"
  ],
  chainWebpack: config => {
    if (process.env.NODE_ENV === "production") {
      config.output.filename("js/[name].js?v=[chunkhash:8]");
      config.output.chunkFilename("js/[name].js?v=[chunkhash:8]");
      config.plugin("extract-css").tap(() => [
        {
          filename: "css/[name].css?v=[chunkhash:8]",
          chunkFilename: "css/[name].css?v=[chunkhash:8]"
        }
      ]);
    }
  },
  devServer: {
    proxy: {
      "/admin": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
        pathRewrite: { "^/admin": "/admin" }
      }
    }
  }
};
