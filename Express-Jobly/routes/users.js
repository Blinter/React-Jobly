/**
 * @fileoverview Express router for handling user-related operations.
 * This module provides endpoints for creating, reading, updating, and deleting user information.
 * It also includes functionality for user authentication and job applications.
 * 
 * @module users
 * @requires express
 * @requires jsonschema
 * @requires ../middleware/auth
 * @requires ../expressError
 * @requires ../models/user
 * @requires ../helpers/tokens
 * @requires ../schemas/userNew.json
 * @requires ../schemas/userApplication.json
 * @requires ../schemas/userUpdate.json
 */

"use strict";

const jsonschema = require("jsonschema");

const express = require("express");
const {
  ensureLoggedIn,
  ensureCorrectUserOrAdmin,
  onlyAdmin
} = require("../middleware/auth");
const {
  BadRequestError,
  ExpressError
} = require("../expressError");
const User = require("../models/user");
const JobApplication = require("../models/jobApplication");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userApplication = require("../schemas/userApplication.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

/** Express router for users */
const router = express.Router();

/** All routes require an authenticated user. */
router.use(ensureLoggedIn);

/**
 * Creates a new user.
 * 
 * This is only for admin users to add new users. The new user can be an admin.
 * 
 * @route POST /
 * @param {Object} req.body - The user data.
 * @param {string} req.body.username - The user's username.
 * @param {string} req.body.password - The user's password.
 * @param {string} req.body.firstName - The user's first name.
 * @param {string} req.body.lastName - The user's last name.
 * @param {string} req.body.email - The user's email.
 * @param {boolean} [req.body.isAdmin] - Whether the user is an admin.
 * @returns {Object} 201 - The created user and authentication token.
 * @returns {Object} 201.user - The user object.
 * @returns {string} 201.user.username - The user's username.
 * @returns {string} 201.user.firstName - The user's first name.
 * @returns {string} 201.user.lastName - The user's last name.
 * @returns {string} 201.user.email - The user's email.
 * @returns {boolean} 201.user.isAdmin - Whether the user is an admin.
 * @returns {string} 201.token - Authentication token for the new user.
 * @throws {BadRequestError} 400 - If the request body is invalid.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.post("/", onlyAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/**
 * Adds a job application for a user.
 * 
 * @route POST /:username/jobs/:jobId
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.username - The username of the user applying for the job.
 * @param {string} req.params.jobId - The ID of the job being applied for.
 * @returns {Object} 201 - Confirmation of job application.
 * @returns {string} 201.applied - The ID of the job applied for.
 * @throws {BadRequestError} 400 - If the request body is invalid.
 * @throws {ExpressError} 500 - If an unexpected error occurs.
 * @access Private - Requires login.
 */
router.post("/:username/jobs/:jobId", ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.params, userApplication);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const { username, jobId } = req.params;
    const applicationStatus = await JobApplication.apply(username, jobId);
    //Handle unknown response

    if (applicationStatus == undefined)
      throw new ExpressError("An unexpected error occurred.", 500);

    return res.status(201).json({ applied: applicationStatus });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves a list of all users.
 * 
 * @route GET /
 * @returns {Object} 200 - An array of user objects.
 * @returns {Object[]} 200.users - The list of users.
 * @returns {string} 200.users[].username - The user's username.
 * @returns {string} 200.users[].firstName - The user's first name.
 * @returns {string} 200.users[].lastName - The user's last name.
 * @returns {string} 200.users[].email - The user's email.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.get("/", onlyAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves details of a specific user.
 *
 * @route GET /:username
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.username - The username of the user to retrieve.
 * @returns {Object} 200 - User details.
 * @returns {Object} 200.user - The user object.
 * @returns {string} 200.user.username - The user's username.
 * @returns {string} 200.user.firstName - The user's first name.
 * @returns {string} 200.user.email - The user's email address.
 * @returns {string} 200.user.lastName - The user's last name.
 * @returns {boolean} 200.user.isAdmin - Whether the user is an admin.
 * @returns {Number[]} 200.user.jobs - List of job IDs the user has applied to.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not authorized.
 * @throws {NotFoundError} 404 - If the user is not found.
 * @access Private - Requires login and correct user or admin privileges.
 */
router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * Updates a user's information.
 * 
 * @route PATCH /:username
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.username - The username of the user to update.
 * @param {Object} req.body - The user data to update.
 * @param {string} [req.body.firstName] - The updated first name.
 * @param {string} [req.body.lastName] - The updated last name.
 * @param {string} [req.body.password] - The updated password.
 * @param {boolean} [req.body.isAdmin] - The updated admin status.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 200.user - The user details.
 * @returns {string} 200.user.username - The user's username.
 * @returns {string} 200.user.firstName - The user's updated first name.
 * @returns {string} 200.user.lastName - The user's updated last name.
 * @returns {boolean} 200.user.isAdmin - The user's updated admin status.
 * @throws {BadRequestError} 400 - If the request body is invalid.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not authorized.
 * @throws {NotFoundError} 404 - If the user is not found.
 * @access Private - Requires login and correct user or admin privileges.
 */
router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**
 * Deletes a user.
 * 
 * This endpoint allows the deletion of a user account. It can be accessed by the user themselves
 * or by an admin. After successful deletion, it returns a confirmation message with the deleted username.
 *
 * @route DELETE /:username
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.username - The username of the user to delete.
 * @returns {Object} 200 - Confirmation of deletion.
 * @returns {string} 200.deleted - The username of the deleted user.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not authorized (neither the user themselves nor an admin).
 * @throws {NotFoundError} 404 - If the user with the specified username is not found.
 * @throws {BadRequestError} 400 - If there's an issue with the delete operation (e.g., database constraint violation).
 * @access Private - Requires login and must be the correct user or an admin.
 */
router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;