export default {
  get: (...a) => globalThis.__fakeApi.get(...a),
  post: (...a) => globalThis.__fakeApi.post(...a),
  put: (...a) => globalThis.__fakeApi.put(...a),
  delete: (...a) => globalThis.__fakeApi.delete(...a),
  defaults: { headers: { common: {} } },
}
