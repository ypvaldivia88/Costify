module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@costify/shared': '../../packages/shared/src',
            '@costify/client-data': '../../packages/client-data/src',
          },
        },
      ],
    ],
  };
};
