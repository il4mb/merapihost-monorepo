const path = require("path");

module.exports = {
    mode: "production",
    target: "web",

    entry: "./src/client/index.tsx",

    output: {
        path: path.resolve(__dirname, "dist/assets"),
        filename: "client.js",
        clean: true,
    },

    resolve: {
        extensions: [".tsx", ".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                options: {
                    configFile: path.resolve(__dirname, "tsconfig.client.json"),
                    onlyCompileBundledFiles: true,
                },
            },
        ],
    },
};