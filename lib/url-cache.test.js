const urlCache = require('./url-cache');

test('url-cache set() and has()', () => {

  expect(urlCache.has('hello')).toBe(false);
  urlCache.set('hello');

  expect(urlCache.has('hello')).toBe(true);

});
