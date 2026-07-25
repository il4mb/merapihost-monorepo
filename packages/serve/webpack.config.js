const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
    mode: "production",
    devtool: false,
    target: "web",
    entry: "./src/client/index.tsx",

    output: {
        path: path.resolve(__dirname, "dist"),
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
                exclude: /node_modules/
            },
            {
                test: /\.s?css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "client.css",
        }),
    ],
};