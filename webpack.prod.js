const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        content: './src/content.ts',
        background: './src/background.ts'
    },
    devtool: 'source-map', // Use 'source-map' for production
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
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
};