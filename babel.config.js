module.exports = (api) => {
  const isCj = api.env('cj');

  return {
    comments: false,
    presets: [
      ['@babel/preset-env', {
        modules: isCj ? 'commonjs' : false,
        useBuiltIns: 'usage',
        corejs: '3.9'
      }],
      ['@babel/preset-react', {
        runtime: 'automatic',
      }],
    ]
  }
};
