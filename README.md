# union-find-with-rollback

A disjoint-set (union-find) structure that lets you undo the most recent merge, in last-in-first-out order.

```js
import { UnionFindWithRollback } from 'union-find-with-rollback';

const uf = new UnionFindWithRollback(5);
uf.union(0, 1);
uf.union(1, 2);
uf.connected(0, 2); // true
uf.unionCount;      // 2

uf.rollback();      // undo union(1, 2)
uf.connected(0, 2); // false
uf.connected(0, 1); // true
```

## Why this exists

Most union-find implementations use path compression, which rewrites parent pointers across many nodes at once. That makes rollback impossible without copying the whole structure. This library trades that speed for reversibility: it uses union by size only, records one small entry per successful union, and restores exactly the parent pointer and size that changed. `find` is still effectively constant for any realistic input because union by size bounds tree height.

## What to watch for

`rollback` throws if there is no union left to undo. A `union` that returns `false` (the two elements were already connected) pushes nothing, so it does not change what a subsequent `rollback` will undo. Indices are integers in `[0, size)`; anything else throws a `RangeError`.
