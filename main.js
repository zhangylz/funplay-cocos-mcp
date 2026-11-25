'use strict';

const implementation = require('./browser');

const MESSAGE_ALIASES = {
  openToolExposurePanel: 'open-tool-exposure',
  openSettingsPanel: 'open-settings',
  openProjectSkillsPanel: 'open-project-skills',
  listToolsForPanel: 'list-tools',
  callToolFromPanel: 'call-tool',
  createProjectSkillFromPanel: 'create-project-skill',
};

function toKebabCase(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function unwrapIpcArgs(args) {
  let event = null;
  const first = args[0];
  if (
    first &&
    typeof first === 'object' &&
    (
      typeof first.reply === 'function' ||
      'sender' in first ||
      'senderId' in first ||
      'returnValue' in first
    )
  ) {
    event = args.shift();
  }
  let callback = null;
  if (args.length && typeof args[args.length - 1] === 'function') {
    callback = args[args.length - 1];
    args = args.slice(0, -1);
  }
  return { args, callback, event };
}

function invoke(method, args) {
  const callArgs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
  try {
    return Promise.resolve(method.apply(implementation, callArgs));
  } catch (error) {
    return Promise.reject(error);
  }
}

function createMessages() {
  const messages = {};
  for (const [name, method] of Object.entries(implementation.methods || {})) {
    const messageNames = new Set([toKebabCase(name), MESSAGE_ALIASES[name] || name]);
    for (const messageName of messageNames) {
      messages[messageName] = function () {
        const unpacked = unwrapIpcArgs(Array.prototype.slice.call(arguments));
        const promise = invoke(method, unpacked.args);
        const reply = unpacked.callback || (
          unpacked.event && typeof unpacked.event.reply === 'function'
            ? unpacked.event.reply.bind(unpacked.event)
            : null
        );
        if (reply) {
          promise.then(
            (value) => reply(null, value),
            (error) => reply(error && error.message ? error.message : String(error))
          );
          return;
        }
        return promise;
      };
    }
  }
  return messages;
}

module.exports = {
  load() {
    return implementation.load();
  },

  unload() {
    return implementation.unload();
  },

  messages: createMessages(),
};
