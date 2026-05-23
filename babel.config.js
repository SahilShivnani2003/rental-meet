module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      "module-resolver",
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@assets': './src/assets',
          '@components': './src/components',
          '@context': './src/context',
          '@data': './src/Data',
          '@hooks': './src/hooks',
          '@navigation': './src/navigations',
          '@screens': './src/screens',
          '@service': './src/service',
          '@store': './src/store',
          '@theme': './src/theme',
          '@types': './src/types',
          '@features': './src/features'
        },
      }
    ]
  ]
};
