/**
 * @fileoverview User model for handling user-related operations.
 * This module provides methods for user authentication, registration, and management.
 * 
 * @module User
 * @requires ../db
 * @requires bcrypt
 * @requires ../helpers/sql
 * @requires ../expressError
 * @requires ../config
 */

"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ExpressError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/**
 * User class for managing user operations.
 */
class User {

  /**
   * Authenticate user with username and password.
   *
   * @async
   * @param {string} username - Username of the user
   * @param {string} password - Password of the user
   * @returns {Promise<Object>} User object if authentication is successful
   * @throws {UnauthorizedError} If username or password is invalid
   * @throws {ExpressError} If there is a database error
   */
  static async authenticate(username, password) {
    let foundUser;
    try {
      foundUser = await db.query(
        `SELECT
            username,
            password,
            first_name AS "firstName",
            last_name AS "lastName",
            email,
            is_admin AS "isAdmin"
          FROM
            users
          WHERE
            username = $1`,
        [username],
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (foundUser === undefined)
      throw new ExpressError("Could not find a valid user.", 500);

    const user = foundUser.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /**
   * Register a new user.
   *
   * @async
   * @param {Object} userData - User data
   * @param {string} userData.username - Username
   * @param {string} userData.password - Password
   * @param {string} userData.firstName - First name
   * @param {string} userData.lastName - Last name
   * @param {string} userData.email - Email address
   * @param {boolean} [userData.isAdmin=false] - Whether the user is an admin
   * @returns {Promise<Object>} Newly created user
   * @throws {BadRequestError} If username already exists
   * @throws {ExpressError} If there is a database error
   */
  static async register({
    username,
    password,
    firstName,
    lastName,
    email,
    isAdmin }) {
    let duplicateCheck;
    try {
      duplicateCheck = await db.query(
        `SELECT
          username
        FROM
          users
        WHERE
          username = $1`,
        [username],
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (duplicateCheck === undefined)
      throw new ExpressError("Query could not complete", 500);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate username: ${username}`);

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    let result;
    try {
      result = await db.query(
        `INSERT INTO
          users
          (username,
          password,
          first_name,
          last_name,
          email,
          is_admin)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          username,
          first_name AS "firstName",
          last_name AS "lastName",
          email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (result === undefined)
      throw new ExpressError("Query could not complete", 500);

    const user = result.rows[0];

    return user;
  }

  /**
  * Find all users.
  *
  * @async
  * @returns {Promise<Array<Object>>} List of all user objects
  * @throws {ExpressError} If there is a database error
  */
  static async findAll() {
    let result;
    try {
      result = await db.query(
        `SELECT
          username,
          first_name AS "firstName",
          last_name AS "lastName",
          email,
          is_admin AS "isAdmin"
        FROM
          users
        ORDER BY
          username`,
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (result === undefined)
      throw new ExpressError("Query could not complete", 500);

    return result.rows;
  }

  /**
   * Get details of a specific user by username.
   *
   * @async
   * @param {string} username - Username of the user
   * @returns {Promise<Object>} User object
   * @throws {NotFoundError} If no user found
   * @throws {ExpressError} If there is a database error
   */
  static async get(username) {
    let userRes;
    try {
      userRes = await db.query(
        `SELECT
          u.username,
          u.first_name AS "firstName",
          u.last_name AS "lastName",
          u.email,
          u.is_admin AS "isAdmin",
          a.job_id AS "jobId"
        FROM
          users u
        LEFT JOIN
          applications a ON u.username = a.username
        WHERE
          u.username = $1`,
        [username],
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }

    if (userRes === undefined ||
      userRes?.rows?.length === 0)
      throw new NotFoundError(`No username found: ${username}`);

    const user = userRes.rows[0];

    // Extract job data
    const jobs = userRes.rows.map(row => (
      row.jobId
    ));

    // Remove null entries (in case of no jobs)
    const filteredJobs = jobs.filter(job => job !== null);

    // Return user data with jobs
    return {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      jobs: filteredJobs
    };
  }

  /**
   * Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * @async
   * @param {string} username - Username of the user to update
   * @param {Object} data - Data to update
   * @returns {Promise<Object>} Updated user object
   * @throws {NotFoundError} If no user is found
   * @throws {ExpressError} If there is a database error
   *
   * @description
   * Returns { username, firstName, lastName, email, isAdmin, jobs: [jobId, ...] }
   * Upon update, retrieves any job applications to be served to the user when the
   * User object is returned.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        firstName: "first_name",
        lastName: "last_name",
        isAdmin: "is_admin",
      });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `
    UPDATE
      users
    SET
      ${setCols}
    WHERE
      username = ${usernameVarIdx}
    RETURNING
      username,
      first_name AS "firstName",
      last_name AS "lastName",
      email,
      is_admin AS "isAdmin"`;

    let result;
    try {
      result = await db.query(querySql, [...values, username]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (result === undefined)
      throw new ExpressError("Query could not complete", 500);

    const user = result.rows[0];

    if (!user) 
      throw new NotFoundError(`No user: ${username}`);

    // remove the user's password so they can't view it.
    delete user.password;

    // Retrieve the user's job list
    let userJobs;
    try{
      userJobs = await db.query(`
        SELECT
          job_id AS "jobId"
        FROM
          applications
        WHERE
          username = $1`,
        [user.username]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }

    // add jobs to returning user object
    if (userJobs !== undefined &&
      userJobs?.rows?.length !== 0)
       user.jobs = userJobs.rows.map(row => row.jobId);

    return user;
  }

  /**
   * Remove a user from the database.
   *
   * @async
   * @param {string} username - Username of the user to remove
   * @returns {Promise<void>}
   * @throws {NotFoundError} If no user found
   * @throws {ExpressError} If there is a database error
   */
  static async remove(username) {
    let result;
    try {
      result = await db.query(
        `DELETE FROM
          users
        WHERE
          username = $1
        RETURNING username`,
        [username],
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (result === undefined)
      throw new ExpressError("Query could not complete", 500);

    const user = result.rows[0];

    if (!user) 
      throw new NotFoundError(`No user: ${username}`);
  }
}

module.exports = User;