/**
 * @fileoverview Test suite for the token creation functionality.
 * This module contains unit tests for the createToken function,
 * verifying its behavior for different user types (admin and non-admin).
 * 
 * @module tokens.test
 * @requires jest
 * @requires jsonwebtoken
 * @requires ./tokens
 * @requires ../config
 */

const jwt = require("jsonwebtoken");
const { createToken } = require("./tokens");
const { SECRET_KEY } = require("../config");

describe("createToken", function () {
  /**
   * Test case: Token creation for non-admin user.
   * @description Ensures that a token is correctly created for a non-admin user with the expected payload.
   */
  test("works: not admin", function () {
    const token = createToken({ username: "test", is_admin: false });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });

  /**
   * Test case: Token creation for admin user.
   * @description Ensures that a token is correctly created for an admin user with the expected payload.
   */
  test("works: admin", function () {
    const token = createToken({ username: "test", isAdmin: true });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: true,
    });
  });

  /**
   * Test case: Default token creation without specifying admin status.
   * @description Verifies that a token created without specifying admin status defaults to non-admin.
   * This test is crucial for security to ensure users aren't accidentally given admin privileges.
   */
  test("works: default no admin", function () {
    // given the security risk if this didn't work, check this specifically
    const token = createToken({ username: "test" });
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });
});
