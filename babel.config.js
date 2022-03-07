module.exports = (api) => {
  const isCj = api.env('cj');

  return {
    presets: [
      ['@babel/preset-env', {
        modules: isCj ? 'commonjs' : false,
        useBuiltIns: 'usage',
        corejs: '3.9'
      }],
      '@babel/preset-react'
    ]
  }
};
