'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'scene-script.js'), 'utf8');

function loadHandler(methods) {
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require(name) {
      assert.equal(name, './scene');
      return { methods };
    },
    Promise,
    Error,
    String,
    Array,
  });
  return module.exports['execute-scene-script'];
}

test('2.4 scene script dispatches a named method and replies with its result', async () => {
  const handler = loadHandler({
    inspect: async (options) => ({ name: options.name }),
  });
  const response = new Promise((resolve, reject) => {
    handler({ reply: (error, value) => (error ? reject(error) : resolve(value)) }, {
      method: 'inspect',
      args: [{ name: 'Root' }],
    });
  });

  assert.deepEqual(await response, { name: 'Root' });
});

test('2.4 scene script replies with an explicit error for unknown methods', async () => {
  const handler = loadHandler({});
  const response = new Promise((resolve) => {
    handler({ reply: (error) => resolve(error) }, { method: 'missing', args: [] });
  });

  assert.equal(await response, 'Scene method not found: missing');
});
