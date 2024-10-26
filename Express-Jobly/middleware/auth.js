/**
 * @fileoverview Authentication middleware for Express applications.
 * This module provides functions for JWT authentication, ensuring user login,
 * admin access, and user-specific or admin access control.
 * 
 * @module auth
 * @requires jsonwebtoken
 * @requires ../config
 * @requires ../expressError
 */

"use strict";

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

/**
 * Authenticates JWT from the request header.
 * If a valid token is found, it sets the user information in res.locals.user.
 * 
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {void}
 */
function authenticateJWT(req, res, next) {
  try {
    const authHeader = req?.headers?.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/**
 * Ensures that a user is logged in.
 * If no user is logged in, it throws an UnauthorizedError.
 * 
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next middleware function
 * @throws {UnauthorizedError} If no user is logged in
 * @returns {void}
 */
function ensureLoggedIn(req, res, next) {
  try {
    if (!res?.locals?.user)
      throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Ensures that the logged-in user is an admin.
 * If the user is not an admin, it throws an UnauthorizedError.
 * 
 * @function
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {function} next - Express next middleware function
 * @throws {UnauthorizedError} If the user is not an admin
 * @returns {void}
 */
function onlyAdmin(req, res, next) {
  try {
    if (!res?.locals?.user?.isAdmin)
      throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Ensures that the logged-in user is either an admin or the user specified in the request params.
 * If neither condition is met, it throws an UnauthorizedError.
 * 
 * @function
 * @param {Object} req - Express request object
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.username - Username to check against
 * @param {Object} res - Express response object
 * @param {Object} res.locals - Response local variables
 * @param {Object} res.locals.user - Logged in user information
 * @param {function} next - Express next middleware function
 * @throws {UnauthorizedError} If the user is neither an admin nor the specified user
 * @returns {void}
 */
function ensureCorrectUserOrAdmin(req, res, next) {
  try {
    const user = res.locals.user;
    const username = req.params.username;

    if (user &&
      (user.isAdmin ||
        user.username === username)) {
      return next();
    } else {
      console.log(user, username);
      throw new UnauthorizedError();
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  onlyAdmin,
  ensureCorrectUserOrAdmin,
};
