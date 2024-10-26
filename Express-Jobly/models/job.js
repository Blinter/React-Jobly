/**
 * @fileoverview Model for handling job-related operations.
 * This module provides methods for creating, reading, updating, and deleting job information.
 * It also includes functionality for filtering jobs based on various criteria.
 * 
 * @module Job
 * @requires ../db
 * @requires ../expressError
 * @requires ../helpers/sql
 */

"use strict";

const db = require("../db");
const { 
  BadRequestError, 
  NotFoundError, 
  ExpressError 
} = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/**
 * Class representing a job.
 */
class Job {
  /**
  * Create a new job.
  * 
  * @param {Object} jobData - The job data.
  * @param {string} jobData.title - The job title.
  * @param {number} jobData.salary - The job salary.
  * @param {string} jobData.equity - The job equity.
  * @param {string} jobData.companyHandle - The handle of the company offering the job.
  * @returns {Promise<Object>} The created job object.
  * @throws {BadRequestError} If the company handle is null or the company is not found.
  * @throws {ExpressError} If there is a database error.
  */
  static async create({ title, salary, equity, companyHandle }) {
    if (companyHandle == null)
      throw new BadRequestError("Company Handle is null. Please locate a company.");

    let companyCheck;
    try {
      companyCheck = await db.query(
        `SELECT 
          handle
        FROM 
          companies
        WHERE 
          handle = $1`,
        [companyHandle]);
    } catch (err) {
      throw new ExpressError(err, 500);
    }

    if (companyCheck === undefined)
      throw new ExpressError("Query could not complete", 500);

    if (companyCheck.rows === undefined ||
      companyCheck.rows.length === 0)
      throw new BadRequestError(`Company not found: ${companyHandle}`);

    let jobInsertResult;
    try {
      jobInsertResult = await db.query(
        `INSERT INTO 
          jobs 
          (title, 
          salary, 
          equity, 
          company_handle)
        VALUES 
          ($1, $2, $3, $4)
        RETURNING 
          id, 
          title, 
          salary, 
          equity, 
          company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
      );
    } catch (err) {
      // PostgreSQL error code for unique constraint violation
      // if (err.code === '23505') {
      //   throw new BadRequestError(`Duplicate job: ${title}`);
      // }
      throw new ExpressError(err, 500);
    }
    if (jobInsertResult === undefined)
      throw new ExpressError("Job could not be inserted", 500);

    const job = jobInsertResult.rows[0];
    console.log("Job inserted with ID " + job.id);

    return job;
  }

  /**
   * Find all jobs, optionally filtered by search criteria.
   * 
   * @param {Object} [filters] - The query parameters for filtering.
   * @param {number} [filters.minSalary] - The minimum salary.
   * @param {boolean} [filters.hasEquity] - Whether the job has equity.
   * @param {string} [filters.titleLike] - Partial title match (case-insensitive).
   * @returns {Promise<Array>} An array of job objects.
   */
  static async findAll(filters = {}) {

    const { minSalary, hasEquity, title, titleLike } = filters;
    let query = `
      SELECT 
        id, 
        title, 
        salary, 
        equity, 
        company_handle AS "companyHandle"
      FROM jobs
    `;

    const conditions = [];
    const values = [];

    if (minSalary !== undefined) {
      conditions.push(`salary >= $${values.length + 1}`);
      values.push(minSalary);
    }

    if (titleLike !== undefined) {
      conditions.push(`LOWER(title) LIKE '%' || LOWER($${values.length + 1}) || '%'`);
      values.push(titleLike);
    }

    if (title !== undefined) {
      conditions.push(`title = $${values.length + 1}`);
      values.push(title);
    }

    if (hasEquity === true ||
      hasEquity == 'true') {
      conditions.push(`equity > 0`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY title";

    const jobsRes = await db.query(query, values);
    return jobsRes.rows;
  }

  /**
   * Retrieve details of a specific job by its ID.
   * 
   * @param {number} id - The unique ID of the job to retrieve.
   * @returns {Promise<Object>} The job object.
   * @throws {NotFoundError} If the job is not found.
   * @throws {ExpressError} If there is a database error.
   */
  static async get(id) {
    if (id === undefined)
      throw new NotFoundError(`No job for ID: ${id}`);

    console.log("Search for ID", id);

    let jobRes;
    try {
      jobRes = await db.query(
        `SELECT 
          title,
          salary,
          equity,
          company_handle AS "companyHandle"
        FROM 
          jobs
        WHERE 
          id = $1`,
        [id]
      );
    } catch (err) {
      throw new ExpressError(err, 500);
    }

    if (jobRes === undefined ||
      jobRes.rows.length === 0)
      throw new NotFoundError(`No job was found for ID: ${id}`);

    const job = jobRes.rows[0];
    // Return job data with jobs
    return {
      id: id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      companyHandle: job.companyHandle,
    };
  }

  /**
   * Update an existing job's information.
   * 
   * @param {number} id - The unique ID of the job to update.
   * @param {Object} data - The job data to update.
   * @returns {Promise<Object>} The updated job object.
   * @throws {NotFoundError} If the job is not found.
   */
  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        title: "title",
        salary: "salary",
        equity: "equity",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
    UPDATE 
      jobs
    SET 
      ${setCols} 
    WHERE 
      id = ${handleVarIdx} 
    RETURNING 
      id, 
      title, 
      salary, 
      equity, 
      company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job was updated: ${id}`);

    return job;
  }

  /**
   * Delete a specific job by its ID.
   * 
   * @param {number} id - The unique ID of the job to delete.
   * @throws {NotFoundError} If the job is not found.
   */
  static async remove(id) {
    let jobRemovalResult;
    try {
      jobRemovalResult = await db.query(
        `DELETE FROM 
          jobs
        WHERE 
          id = $1
        RETURNING 
          id`,
        [id]);
    } catch (err) {
      throw new NotFoundError(err);
    }

    if (jobRemovalResult === undefined)
      throw new NotFoundError("Job cannot be deleted");

    const job = jobRemovalResult.rows[0];

    if (!job)
      throw new NotFoundError(`No job: ${id}`);
  }
}


module.exports = Job;
