const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development', // or 'production'
    entry: {
        content: './src/content.ts',
        background: './src/background.ts' // Add this line to include background.ts
    },
    devtool: 'source-map', // Use 'source-map' or 'inline-source-map' instead of 'eval'
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js', // This will generate content.js and background.js
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
    ],
};