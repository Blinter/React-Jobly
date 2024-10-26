/**
 * @fileoverview Helper module for creating JSON Web Tokens (JWT) for user authentication.
 * This module provides functionality to create tokens with user information and admin status.
 * 
 * @module tokens
 * @requires jsonwebtoken
 * @requires ../config
 */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/**
 * Creates a JSON Web Token (JWT) for a user.
 * 
 * This function generates a JWT containing the user's username and admin status.
 * It uses the SECRET_KEY from the config to sign the token.
 * 
 * @function createToken
 * @param {Object} user - The user object for which to create a token.
 * @param {string} user.username - The username of the user.
 * @param {boolean} user.isAdmin - Whether the user has admin privileges.
 * @returns {string} A JSON Web Token containing the user's information.
 * @throws {AssertionError} If the user object does not have an isAdmin property.
 */
function createToken(user) {
  console.assert(user.isAdmin !== undefined,
      "createToken passed user without isAdmin property");

  let payload = {
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
