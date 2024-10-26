/**
 * @fileoverview Express router for handling job-related operations.
 * This module provides endpoints for creating, reading, updating, and deleting job information.
 * It also includes functionality for filtering jobs based on various criteria.
 * 
 * @module jobs
 * @requires express
 * @requires jsonschema
 * @requires ../expressError
 * @requires ../middleware/auth
 * @requires ../models/job
 * @requires ../schemas/jobFilter.json
 * @requires ../schemas/jobNew.json
 * @requires ../schemas/jobUpdate.json
 * @requires ../schemas/jobIdOnly.json
 */


"use strict";

const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { 
  ensureLoggedIn, 
  onlyAdmin 
} = require("../middleware/auth");
const Job = require("../models/job");
const jobSearchSchema = require("../schemas/jobFilter.json");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobIdOnlySchema = require("../schemas/jobIdOnly.json");

/** Express router for jobs */
const router = new express.Router();

/**
 * Creates a new job.
 * 
 * Validates the body data against jobNewSchema.
 * 
 * @route POST /
 * @param {Object} req.body - The job data.
 * @param {string} req.body.title - The job title.
 * @param {number} req.body.salary - The job salary.
 * @param {string} req.body.equity - The job equity.
 * @param {string} req.body.companyHandle - The company handle (will be converted to lowercase).
 * @returns {Object} 201 - The created job object.
 * @returns {Object} 201.job - The job details.
 * @returns {number} 201.job.id - The job's unique identifier.
 * @returns {string} 201.job.title - The job title.
 * @returns {number} 201.job.salary - The job salary.
 * @returns {string} 201.job.equity - The job equity.
 * @returns {string} 201.job.companyHandle - The handle of the company offering the job.
 * @throws {BadRequestError} 400 - If the request body is invalid.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.post("/", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      console.error("Validation errors:", errs);
      throw new BadRequestError(errs);
    }
    // Convert companyHandle to lowercase
    req.body.companyHandle = req.body.companyHandle.toLowerCase();
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves a list of jobs, optionally filtered by search criteria.
 * 
 * @route GET /
 * @param {Object} req.query - The query parameters for filtering.
 * @param {number} [req.query.minSalary] - Minimum salary filter.
 * @param {boolean} [req.query.hasEquity] - Filter for jobs with equity.
 * @param {string} [req.query.title] - Exact title filter.
 * @param {string} [req.query.titleLike] - Partial title filter (case-insensitive).
 * @returns {Object} 200 - An array of job objects.
 * @returns {Object[]} 200.jobs - The list of jobs.
 * @returns {number} 200.jobs[].id - The job's unique identifier.
 * @returns {string} 200.jobs[].title - The job title.
 * @returns {number} 200.jobs[].salary - The job salary.
 * @returns {string} 200.jobs[].equity - The job equity.
 * @returns {string} 200.jobs[].companyHandle - The handle of the company offering the job.
 * @throws {BadRequestError} 400 - If the query parameters are invalid.
 * @access Public
 */
router.get("/", async function (req, res, next) {
  try {
    //Validate Schema
    const validator = jsonschema.validate(req.query, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const { minSalary, hasEquity, title, titleLike } = req.query;
    const jobs = await Job.findAll({ minSalary, hasEquity, title, titleLike });
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves details of a specific job by its ID.
 * 
 * @route GET /:id
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The unique ID of the job to retrieve.
 * @returns {Object} 200 - Job details.
 * @returns {Object} 200.job - The job object.
 * @returns {number} 200.job.id - The job's unique identifier.
 * @returns {string} 200.job.title - The job title.
 * @returns {number} 200.job.salary - The job salary.
 * @returns {string} 200.job.equity - The job equity.
 * @returns {string} 200.job.companyHandle - The handle of the company offering the job.
 * @throws {BadRequestError} 400 - If the job ID is invalid.
 * @throws {NotFoundError} 404 - If the job is not found.
 * @access Public
 */
router.get("/:id", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.params, jobIdOnlySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * Updates an existing job's information.
 *
 * Validates the body data against jobUpdateSchema.
 *
 * @route PATCH /:id
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The unique ID of the job to update.
 * @param {Object} req.body - The job data to update.
 * @param {string} [req.body.title] - The updated job title.
 * @param {number} [req.body.salary] - The updated job salary.
 * @param {string} [req.body.equity] - The updated job equity.
 * @returns {Object} 200 - The updated job object.
 * @returns {Object} 200.job - The updated job details.
 * @returns {number} 200.job.id - The job's unique identifier (unchanged).
 * @returns {string} 200.job.title - The job's updated title.
 * @returns {number} 200.job.salary - The updated job salary.
 * @returns {string} 200.job.equity - The updated job equity.
 * @returns {string} 200.job.companyHandle - The handle of the company offering the job (unchanged).
 * @throws {BadRequestError} 400 - If the request body is invalid or the job ID is invalid.
 * @throws {NotFoundError} 404 - If the job is not found.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.patch("/:handle", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.handle, req.body);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * Delete a job.
 * 
 * This endpoint allows administrators to delete a specific job by its ID.
 * It first validates the job ID against the jobIdOnlySchema.
 * If the job exists and is successfully deleted, it returns a confirmation message.
 *
 * @route DELETE /:id
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.id - The unique ID of the job to delete.
 * @returns {Object} 200 - Confirmation of deletion.
 * @returns {string} 200.deleted - The ID of the deleted job.
 * @throws {BadRequestError} 400 - If the job ID is invalid or doesn't match the schema.
 * @throws {NotFoundError} 404 - If the job with the specified ID is not found.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.delete("/:id", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.params, jobIdOnlySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
