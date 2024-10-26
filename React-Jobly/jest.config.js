module.exports = {
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
    "^.+\\.css$": "<rootDir>/jest-css-transform.js",
  },
  moduleFileExtensions: ["js", "jsx"],
  testEnvironment: "jsdom",
  //testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
  },
};
