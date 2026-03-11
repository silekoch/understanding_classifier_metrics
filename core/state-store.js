function notifyKey(ctx, key, prevValue) {
  const subs = ctx.subscribersByKey.get(key);
  if (!subs || subs.size === 0) {
    return;
  }
  const nextValue = ctx.values[key];
  for (const cb of subs) {
    cb(nextValue, prevValue);
  }
}

function flushPending(ctx) {
  if (ctx.pendingKeys.size === 0) {
    return;
  }
  const keys = Array.from(ctx.pendingKeys);
  ctx.pendingKeys.clear();
  for (const key of keys) {
    const prevValue = ctx.pendingPrevByKey.get(key);
    ctx.pendingPrevByKey.delete(key);
    notifyKey(ctx, key, prevValue);
  }
}

function getFromState(ctx, key) {
  if (typeof key === "undefined") {
    return { ...ctx.values };
  }
  return ctx.values[key];
}

function setInState(ctx, key, nextValue, options = {}) {
  const prevValue = ctx.values[key];
  if (Object.is(prevValue, nextValue)) {
    return false;
  }
  ctx.values[key] = nextValue;

  if (options.silent) {
    return true;
  }
  if (ctx.batchDepth > 0) {
    if (!ctx.pendingKeys.has(key)) {
      ctx.pendingPrevByKey.set(key, prevValue);
    }
    ctx.pendingKeys.add(key);
    return true;
  }
  notifyKey(ctx, key, prevValue);
  return true;
}

function subscribeToKey(ctx, key, callback) {
  let subs = ctx.subscribersByKey.get(key);
  if (!subs) {
    subs = new Set();
    ctx.subscribersByKey.set(key, subs);
  }
  subs.add(callback);
  return () => {
    const keySubs = ctx.subscribersByKey.get(key);
    if (!keySubs) {
      return;
    }
    keySubs.delete(callback);
    if (keySubs.size === 0) {
      ctx.subscribersByKey.delete(key);
    }
  };
}

function batchUpdates(ctx, run) {
  ctx.batchDepth += 1;
  try {
    run();
  } finally {
    ctx.batchDepth -= 1;
    if (ctx.batchDepth === 0) {
      flushPending(ctx);
    }
  }
}

export function createStateStore(initialValues = {}) {
  const ctx = {
    values: { ...initialValues },
    subscribersByKey: new Map(),
    batchDepth: 0,
    pendingKeys: new Set(),
    pendingPrevByKey: new Map(),
  };
  return {
    get: (key) => getFromState(ctx, key),
    set: (key, nextValue, options) => setInState(ctx, key, nextValue, options),
    subscribe: (key, callback) => subscribeToKey(ctx, key, callback),
    batch: (run) => batchUpdates(ctx, run),
  };
}
