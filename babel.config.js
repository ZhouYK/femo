module.exports = (api) => {
  const isCj = api.env('cj');

  return {
    comments: false,
    presets: [
      ['@babel/preset-env', {
        modules: isCj ? 'commonjs' : false,
      }],
      ['@babel/preset-react', {
        runtime: 'automatic',
      }],
    ]
  }
};
