'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { getCurrentSelection, selectNode } = require('../lib/assets');

test('selection uses the Creator 2.4 Selection methods and derives an unambiguous type', (t) => {
  const previousEditor = global.Editor;
  const calls = [];
  global.Editor = {
    Selection: {
      clear: (type) => calls.push(['clear', type]),
      curActivate: (type) => type === 'node' ? 'node-uuid' : '',
      select: (type, uuid) => calls.push(['select', type, uuid]),
    },
  };
  t.after(() => {
    if (previousEditor === undefined) delete global.Editor;
    else global.Editor = previousEditor;
  });

  assert.deepEqual(selectNode('node-uuid'), { selected: true, uuid: 'node-uuid' });
  assert.deepEqual(calls, [['clear', 'node'], ['select', 'node', 'node-uuid']]);
  assert.deepEqual(getCurrentSelection(), { asset: '', node: 'node-uuid', type: 'node' });
});

test('selection type is empty when both an asset and node are selected', (t) => {
  const previousEditor = global.Editor;
  global.Editor = {
    Selection: {
      curActivate: (type) => type === 'node' ? 'node-uuid' : 'asset-uuid',
    },
  };
  t.after(() => {
    if (previousEditor === undefined) delete global.Editor;
    else global.Editor = previousEditor;
  });

  assert.deepEqual(getCurrentSelection(), {
    asset: 'asset-uuid',
    node: 'node-uuid',
    type: '',
  });
});
