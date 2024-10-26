// jest-css-transform.js
module.exports = {
  process() {
    return "module.exports = {};";
  },
  getCacheKey() {
    return "cssTransform";
  },
};
