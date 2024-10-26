/**
 * @fileoverview Express router for handling authentication operations.
 * This module provides endpoints for user authentication and registration.
 * It uses JSON Schema for request validation and JWT for token generation.
 * 
 * @module auth
 * @requires express
 * @requires jsonschema
 * @requires ../expressError
 * @requires ../models/user
 * @requires ../helpers/tokens
 * @requires ../schemas/userAuth.json
 * @requires ../schemas/userRegister.json
 */
"use strict";

const express = require("express");
const { BadRequestError } = require("../expressError");
const jsonschema = require("jsonschema");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userAuthSchema = require("../schemas/userAuth.json");
const userRegisterSchema = require("../schemas/userRegister.json");

/** Express router for auth */
const router = new express.Router();

/**
 * Authenticate user and generate JWT token.
 * 
 * @route POST /auth/token
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - User's username
 * @param {string} req.body.password - User's password
 * @returns {Object} 200 - Response object with token
 * @returns {string} 200.token - JWT token
 * @throws {BadRequestError} 400 - If request body validation fails
 * @throws {UnauthorizedError} 401 - If authentication fails (thrown by User.authenticate)
 * @access Public
 */
router.post("/token", async function (req, res, next) {
  try {
    if (!req.body)
      throw new BadRequestError("No data sent");
    const validator = jsonschema.validate(req.body, userAuthSchema);
    if (!validator.valid) {
      // Map validation errors to a more readable format
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ token });
  } catch (err) {

    console.error("Error in /auth/token:", err);
    return next(err);
  }
});

/**
 * Register new user and generate JWT token.
 * 
 * @route POST /auth/register
 * @param {Object} req.body - Request body
 * @param {string} req.body.username - User's username
 * @param {string} req.body.password - User's password
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {string} req.body.email - User's email address
 * @returns {Object} 201 - Response object with token
 * @returns {string} 201.token - JWT token
 * @throws {BadRequestError} 400 - If request body validation fails
 * @access Public
 */
router.post("/register", async function (req, res, next) {
  try {
    if (!req.body)
      throw new BadRequestError("No data sent");
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const newUser = await User.register({ ...req.body, isAdmin: false });
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
