module.exports = {
  presets: ['@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@goodsongs/tokens': '../../packages/tokens/src',
          '@goodsongs/api-client': '../../packages/api-client/src',
        },
      },
    ],
  ],
};
