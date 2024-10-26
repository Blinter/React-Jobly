/**
 * @fileoverview Test suite for authentication middleware functions.
 * This module contains unit tests for the authenticateJWT, ensureLoggedIn, and onlyAdmin middleware functions.
 * It verifies the correct behavior of these functions under various scenarios, including valid and invalid JWT tokens,
 * logged-in and logged-out states, and admin and non-admin user roles.
 * 
 * @module auth.test
 * @requires jsonwebtoken
 * @requires ../expressError
 * @requires ../middleware/auth
 * @requires ../config
 */

"use strict";

const jwt = require("jsonwebtoken");
const { UnauthorizedError } = require("../expressError");
const { onlyAdmin } = require("../middleware/auth");
const {
  authenticateJWT,
  ensureLoggedIn,
} = require("./auth");
const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

/**
 * Test suite for authenticateJWT middleware.
 */

describe("authenticateJWT", function () {
  /**
   * Tests if authenticateJWT correctly processes a valid JWT in the header.
   */
  test("works: via header", function () {
    expect.assertions(2);
    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  /**
   * Tests if authenticateJWT handles requests without an authorization header.
   */
  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  /**
   * Tests if authenticateJWT correctly handles an invalid JWT token.
   */
  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


/**
 * Test suite for ensureLoggedIn middleware.
 */
describe("ensureLoggedIn", function () {
  /**
   * Tests if ensureLoggedIn allows authenticated users to pass through.
   */
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  /**
   * Tests if ensureLoggedIn blocks unauthenticated requests.
   */
  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    };
    ensureLoggedIn(req, res, next);
  });

  describe("onlyAdmin middleware", function () {
    /**
     * Tests if onlyAdmin allows admin users to pass through.
     */
    test("allows admins to pass through", async function () {
      const req = {};
      const res = { locals: { user: { isAdmin: true } } };
      const next = jest.fn();

      await onlyAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    /**
     * Tests if onlyAdmin blocks non-admin users.
     */
    test("blocks non-admins", async function () {
      const req = {};
      const res = { locals: { user: { isAdmin: false } } };
      const next = jest.fn();

      await onlyAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    /**
     * Tests if onlyAdmin handles cases where the user object is missing.
     */
    test("throws error if user object is missing", async function () {
      const req = {};
      const res = { locals: {} };
      const next = jest.fn();

      await onlyAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });
});
