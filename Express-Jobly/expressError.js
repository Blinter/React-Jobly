/**
 * @fileoverview Custom error classes for Express application.
 * This module provides a set of custom error classes that extend the built-in Error class.
 * These custom errors are designed to be used with Express.js for better error handling and
 * consistent error responses across the application.
 * 
 * @module expressError
 * @requires none
 */

class ExpressError extends Error {
  /**
   * Create an ExpressError.
   * @param {string} message - The error message.
   * @param {number} status - The HTTP status code.
   */
  constructor(message, status) {
    super();
    this.message = message;
    this.status = status;
  }
}

/** 404 NOT FOUND error. */

class NotFoundError extends ExpressError {
  /**
   * Create a NotFoundError.
   * @param {string} [message="Not Found"] - The error message.
   */
  constructor(message = "Not Found") {
    super(message, 404);
  }
}

/** 401 UNAUTHORIZED error. */

class UnauthorizedError extends ExpressError {
  /**
   * Create an UnauthorizedError.
   * @param {string} [message="Unauthorized"] - The error message.
   */
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/** 400 BAD REQUEST error. */

class BadRequestError extends ExpressError {
  /**
   * Create a BadRequestError.
   * @param {string} [message="Bad Request"] - The error message.
   */
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/** 403 BAD REQUEST error. */

class ForbiddenError extends ExpressError {
  /**
   * Create a ForbiddenError.
   * @param {string} [message="Forbidden"] - The error message.
   */
  constructor(message = "Bad Request") {
    super(message, 403);
  }
}

module.exports = {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
};
