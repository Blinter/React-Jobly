/**
 * @fileoverview Configuration module for the application.
 * This module sets up environment variables and provides configuration
 * settings such as the secret key, server port, bcrypt work factor, and
 * database URI.
 * 
 * @module config
 * @requires dotenv
 * @requires colors
 */

"use strict";

require("dotenv").config();
require("colors");

/**
 * The secret key used for signing tokens.
 * @type {string}
 */
const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";

/**
 * The port number on which the server will listen.
 * @type {number}
 */
const PORT = +process.env.PORT || 3001;

/**
 * Retrieves the URI for the database connection.
 *
 * @function
 * @returns {string} The URI string for the database. Returns a test database URI
 * if the NODE_ENV environment variable is set to "test". Otherwise, it returns
 * the DATABASE_URL from environment variables or the default jobly database URI.
 */
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
    ? "postgresql:///jobly_test"
    : process.env.DATABASE_URL || "postgresql:///jobly";
}

/**
 * The bcrypt work factor used for hashing passwords.
 * It is set to 1 during tests to speed up the process.
 * @type {number}
 */
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 12;

module.exports = {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};