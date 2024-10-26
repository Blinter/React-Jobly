/**
 * @fileoverview Defines the JobApplication class for handling job application operations.
 * This module provides methods for applying to jobs and removing job applications.
 * 
 * @module JobApplication
 * @requires ../db
 * @requires ../expressError
 */

"use strict";

const db = require("../db");
const {
  BadRequestError,
  NotFoundError,
  ExpressError
} = require("../expressError");

/**
 * Class representing job application operations.
 * @class
 */
class JobApplication {
  /**
   * Apply for a job.
   * 
   * @static
   * @async
   * @param {Object} params - The parameters for job application.
   * @param {string} params.username - The username of the applicant.
   * @param {number} params.jobId - The ID of the job being applied to.
   * @returns {Promise<Object>} The job application object.
   * @throws {BadRequestError} If input parameters are invalid.
   * @throws {ExpressError} If there's an error during the database operations.
   */
  static async apply(username, jobId) {
    if (username === undefined ||
      jobId === undefined)
      throw new BadRequestError("Invalid input parameters.");

    let jobIdCheck;
    try {
      jobIdCheck = await db.query(
        `SELECT 
          id
        FROM 
          jobs
        WHERE 
          id = $1`,
        [jobId]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (!jobIdCheck?.rows?.length)
      throw new NotFoundError("Job cannot be found.");

    let validUsernameIdCheck;
    try {
      validUsernameIdCheck = await db.query(
        `SELECT 
          username
        FROM 
          users
        WHERE 
          username = $1`,
        [username]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }
    if (validUsernameIdCheck?.rows?.length === 0)
      throw new NotFoundError("Username cannot be found.");

    if (validUsernameIdCheck === undefined)
      throw new ExpressError("Valid Username Check did not complete.", 500);

    let jobApplicationCheck;
    try {
      jobApplicationCheck = await db.query(
        `SELECT 
          job_id
        FROM 
          applications
        WHERE 
          username = $1
        AND
          job_id = $2`,
        [username, jobId]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }

    if (jobApplicationCheck?.rows?.length !== 0)
      throw new BadRequestError("Job Application has already been submitted for this job.");

    let jobInsertResult;
    try {
      jobInsertResult = await db.query(
        `INSERT INTO 
          applications 
          (username, 
          job_id)
        VALUES 
          ($1, $2)
        RETURNING 
          username, 
          job_id as "jobId"`,
        [
          username,
          jobId,
        ],
      );
    } catch (err) {
      //PostgreSQL error code for unique constraint violation
      if (err.code === '23505')
        throw new BadRequestError(`${username} is already in list of job applications for Job ID ${id}`);
      throw new ExpressError(err, 500);
    }
    if (jobInsertResult === undefined)
      throw new ExpressError("Job could not be inserted", 500);

    const jobApplication = jobInsertResult.rows[0];

    return { applied: jobApplication.jobId };
  }

  /**
   * Remove a job application.
   * 
   * @static
   * @async
   * @param {string} username - The username of the applicant.
   * @param {number} jobId - The ID of the job application to remove.
   * @throws {NotFoundError} If the job application is not found.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async remove(username, jobId) {
    if (username === undefined ||
      jobId === undefined)
      throw new BadRequestError("Invalid input parameters.");
    let jobApplicationbRemovalResult;
    try {
      jobApplicationbRemovalResult = await db.query(
        `DELETE FROM 
          applications
        WHERE 
          job_id = $1
          AND
          username = $2
        RETURNING 
          job_id`,
        [jobId, username]);
    } catch (err) {
      throw new NotFoundError(err);
    }

    if (jobApplicationbRemovalResult === undefined)
      throw new ExpressError("Job Application cannot be removed due to a server error", 500);

    const jobApplication = jobApplicationbRemovalResult.rows[0];

    if (!jobApplication)
      throw new NotFoundError(`No job aplication found for Job ID ${jobId} by username ${username}`);
  }
}

module.exports = JobApplication;
