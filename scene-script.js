'use strict';

const scene = require('./scene');

function executeSceneScript(event, request) {
  const reply = event && typeof event.reply === 'function' ? event.reply.bind(event) : null;
  const methodName = request && request.method;
  const method = scene.methods && scene.methods[methodName];

  if (typeof method !== 'function') {
    const error = new Error(`Scene method not found: ${methodName || ''}`);
    if (reply) {
      reply(error.message);
      return;
    }
    throw error;
  }

  let result;
  try {
    result = method.apply(scene, Array.isArray(request.args) ? request.args : []);
  } catch (error) {
    if (reply) {
      reply(error && error.message ? error.message : String(error));
      return;
    }
    throw error;
  }

  if (reply) {
    Promise.resolve(result).then(
      (value) => reply(null, value),
      (error) => reply(error && error.message ? error.message : String(error))
    );
    return;
  }
  return result;
}

module.exports = {
  'execute-scene-script': executeSceneScript,
};
