/**
 * Union-Find with rollback.
 *
 * The data structure supports the usual union and find operations, plus the
 * ability to undo unions in strict last-in-first-out order. Path compression
 * is deliberately omitted: it mutates parent pointers in a way that cannot be
 * undone by a simple stack of union records. Union by size keeps trees shallow
 * enough that find stays near-constant in practice, and every state change is
 * accounted for so rollback is exact.
 */
export class UnionFindWithRollback {
  /**
   * @param {number} size number of elements, labelled 0..size-1
   */
  constructor(size) {
    if (!Number.isInteger(size) || size < 0) {
      throw new RangeError('size must be a non-negative integer');
    }
    this._parent = new Array(size);
    this._size = new Array(size);
    for (let i = 0; i < size; i++) {
      this._parent[i] = i;
      this._size[i] = 1;
    }
    // Each entry records enough information to reverse one union.
    // { root, child, sizeBefore } where root is the winning root,
    // child is the root that got attached, and sizeBefore is the size
    // of root before the merge (so rollback restores it exactly).
    this._history = [];
  }

  /**
   * Number of elements.
   * @returns {number}
   */
  get size() {
    return this._parent.length;
  }

  /**
   * Number of unions currently applied (not rolled back).
   * @returns {number}
   */
  get unionCount() {
    return this._history.length;
  }

  /**
   * Find the representative of the set containing x.
   * @param {number} x
   * @returns {number}
   */
  find(x) {
    this._check(x);
    let root = x;
    while (this._parent[root] !== root) {
      root = this._parent[root];
    }
    return root;
  }

  /**
   * Merge the sets containing a and b.
   * @param {number} a
   * @param {number} b
   * @returns {boolean} true if a union happened, false if already connected
   */
  union(a, b) {
    this._check(a);
    this._check(b);
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) {
      return false;
    }
    // Union by size: attach the smaller tree under the larger.
    if (this._size[ra] < this._size[rb]) {
      const t = ra;
      ra = rb;
      rb = t;
    }
    this._history.push({ root: ra, child: rb, sizeBefore: this._size[ra] });
    this._parent[rb] = ra;
    this._size[ra] += this._size[rb];
    return true;
  }

  /**
   * Undo the most recent union. Throws if there is nothing to undo.
   * @returns {void}
   */
  rollback() {
    const record = this._history.pop();
    if (record === undefined) {
      throw new Error('no union to roll back');
    }
    const { root, child, sizeBefore } = record;
    this._parent[child] = child;
    this._size[root] = sizeBefore;
  }

  /**
   * True if a and b are in the same set.
   * @param {number} a
   * @param {number} b
   * @returns {boolean}
   */
  connected(a, b) {
    return this.find(a) === this.find(b);
  }

  _check(x) {
    if (!Number.isInteger(x) || x < 0 || x >= this._parent.length) {
      throw new RangeError(`element out of range: ${x}`);
    }
  }
}
