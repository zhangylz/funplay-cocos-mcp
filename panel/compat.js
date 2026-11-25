'use strict';

const PKG = 'funplay-cocos-mcp';

function sendToMain(message, args, callback) {
  if (typeof callback !== 'function') {
    callback = null;
  }
  if (!global.Editor || !Editor.Ipc || typeof Editor.Ipc.sendToMain !== 'function') {
    throw new Error('Editor.Ipc.sendToMain is unavailable in this Cocos extension host.');
  }
  if (callback) {
    Editor.Ipc.sendToMain(`${PKG}:${message}`, args, callback);
  } else {
    Editor.Ipc.sendToMain(`${PKG}:${message}`, args);
  }
}

function request(message, args) {
  return new Promise((resolve, reject) => {
    sendToMain(message, args || {}, (error, value) => {
      if (error) {
        reject(new Error(typeof error === 'string' ? error : (error.message || String(error))));
        return;
      }
      resolve(value);
    });
  });
}

module.exports = { request, sendToMain };
