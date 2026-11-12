import test from 'node:test';
import assert from 'node:assert/strict';
import { UnionFindWithRollback } from '../src/index.js';

test('starts with every element in its own set', () => {
  const uf = new UnionFindWithRollback(4);
  assert.equal(uf.size, 4);
  assert.equal(uf.unionCount, 0);
  for (let i = 0; i < 4; i++) {
    assert.equal(uf.find(i), i);
  }
  assert.equal(uf.connected(0, 1), false);
});

test('union merges sets and reports whether it changed anything', () => {
  const uf = new UnionFindWithRollback(3);
  assert.equal(uf.union(0, 1), true);
  assert.equal(uf.union(1, 0), false);
  assert.equal(uf.connected(0, 1), true);
  assert.equal(uf.connected(0, 2), false);
  assert.equal(uf.unionCount, 1);
});

test('union by size keeps the larger root as representative', () => {
  const uf = new UnionFindWithRollback(5);
  uf.union(0, 1);
  uf.union(0, 2);
  // root 0 now has size 3; merging with singleton 3 must keep root 0.
  uf.union(3, 0);
  assert.equal(uf.find(3), uf.find(0));
  assert.equal(uf.find(1), uf.find(0));
});

test('rollback restores the previous partition exactly', () => {
  const uf = new UnionFindWithRollback(4);
  uf.union(0, 1);
  uf.union(1, 2);
  assert.equal(uf.connected(0, 2), true);
  uf.rollback();
  assert.equal(uf.connected(0, 2), false);
  assert.equal(uf.connected(0, 1), true);
  uf.rollback();
  assert.equal(uf.connected(0, 1), false);
  assert.equal(uf.unionCount, 0);
});

test('rollback of a no-op union does nothing because no record was pushed', () => {
  const uf = new UnionFindWithRollback(2);
  assert.equal(uf.union(0, 0), false);
  assert.equal(uf.unionCount, 0);
  assert.throws(() => uf.rollback(), /no union to roll back/);
});

test('rollback throws when the history is empty', () => {
  const uf = new UnionFindWithRollback(1);
  assert.throws(() => uf.rollback(), /no union to roll back/);
});

test('rollback undoes unions in last-in-first-out order', () => {
  const uf = new UnionFindWithRollback(4);
  uf.union(0, 1);
  uf.union(2, 3);
  uf.union(1, 3);
  assert.equal(uf.connected(0, 2), true);
  uf.rollback(); // undo union(1,3)
  assert.equal(uf.connected(0, 2), false);
  assert.equal(uf.connected(2, 3), true);
  uf.rollback(); // undo union(2,3)
  assert.equal(uf.connected(2, 3), false);
  assert.equal(uf.connected(0, 1), true);
});

test('size is restored after rollback so later unions still pick correctly', () => {
  const uf = new UnionFindWithRollback(6);
  uf.union(0, 1);
  uf.union(0, 2);
  uf.union(0, 3);
  uf.rollback(); // root 0 back to size 3
  uf.union(4, 5);
  // root 4 has size 2, root 0 has size 3, so 0 must win.
  uf.union(4, 0);
  assert.equal(uf.find(5), uf.find(0));
});

test('find rejects out-of-range and non-integer indices', () => {
  const uf = new UnionFindWithRollback(2);
  assert.throws(() => uf.find(-1), RangeError);
  assert.throws(() => uf.find(2), RangeError);
  assert.throws(() => uf.find(1.5), RangeError);
  assert.throws(() => uf.find('0'), RangeError);
});

test('union rejects out-of-range indices before doing any work', () => {
  const uf = new UnionFindWithRollback(2);
  assert.throws(() => uf.union(0, 5), RangeError);
  assert.equal(uf.unionCount, 0);
});

test('constructor rejects negative and non-integer sizes', () => {
  assert.throws(() => new UnionFindWithRollback(-1), RangeError);
  assert.throws(() => new UnionFindWithRollback(1.5), RangeError);
  assert.throws(() => new UnionFindWithRollback('3'), RangeError);
});

test('empty structure supports all read operations and rejects rollback', () => {
  const uf = new UnionFindWithRollback(0);
  assert.equal(uf.size, 0);
  assert.equal(uf.unionCount, 0);
  assert.throws(() => uf.rollback(), /no union to roll back/);
  assert.throws(() => uf.find(0), RangeError);
});
