module.exports = {
  entry: "./dist/index.js",
  devtool: "cheap-module-source-map",
  output: {
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
};