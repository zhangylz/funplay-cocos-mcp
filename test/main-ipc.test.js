'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

function loadMessages(methods) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    require(name) {
      assert.equal(name, './browser');
      return { methods };
    },
  });
  return module.exports.messages;
}

test('2.4 IPC handler aliases reply to panel requests', async () => {
  const calls = [];
  const messages = loadMessages({
    openPanel: async (name) => {
      calls.push(name);
      return { opened: name };
    },
  });
  const response = new Promise((resolve) => {
    messages['open-panel']({ reply: (...args) => resolve(args) }, 'settings');
  });

  const [error, value] = await response;
  assert.equal(error, null);
  assert.deepEqual(calls, ['settings']);
  assert.equal(value.opened, 'settings');
});

test('2.4 IPC handler ignores a main-process event without a reply method', async () => {
  const calls = [];
  const messages = loadMessages({
    openPanel: async (name) => {
      calls.push(name || 'default');
      return { opened: name || 'default' };
    },
  });

  const result = await messages['open-panel']({ sender: {} });

  assert.deepEqual(calls, ['default']);
  assert.equal(result.opened, 'default');
});

test('2.4 IPC handler reports rejected methods through event.reply', async () => {
  const messages = loadMessages({
    restartServer: async () => {
      throw new Error('restart failed');
    },
  });
  const response = new Promise((resolve) => {
    messages['restart-server']({ reply: (error) => resolve(error) });
  });

  assert.equal(await response, 'restart failed');
});
