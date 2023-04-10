exports.mochaGlobalSetup = async function() {
  console.log('mochaGlobalSetup');
  const _ = require('symbol-observable').default;

  if (typeof Symbol === 'function' && !Symbol.observable) {
    console.log("polyfilling Symbol.observable");
  }

};