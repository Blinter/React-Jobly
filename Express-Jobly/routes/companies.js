/**
 * @fileoverview Express router for handling company-related operations.
 * This module provides endpoints for creating, reading, updating, and deleting company information.
 * It also includes functionality for filtering companies based on various criteria.
 * 
 * @module companies
 * @requires express
 * @requires jsonschema
 * @requires ../expressError
 * @requires ../middleware/auth
 * @requires ../models/company
 * @requires ../schemas/companyFilter.json
 * @requires ../schemas/companyNew.json
 * @requires ../schemas/companyUpdate.json
 * @requires ../schemas/companyHandleOnly.json
 */

"use strict";
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, onlyAdmin } = require("../middleware/auth");
const Company = require("../models/company");
const companySearchSchema = require("../schemas/companyFilter.json");
const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");
const companyHandleOnlySchema = require("../schemas/companyHandleOnly.json");

/** Express router for companies */
const router = new express.Router();

/**
 * Creates a new company.
 * 
 * @route POST /
 * @param {Object} req.body - The company data.
 * @param {string} req.body.handle - The company's unique identifier.
 * @param {string} req.body.name - The company's name.
 * @param {string} req.body.description - A description of the company.
 * @param {number} req.body.numEmployees - The number of employees in the company.
 * @param {string} req.body.logoUrl - URL to the company's logo.
 * @returns {Object} 201 - The created company object.
 * @throws {BadRequestError} 400 - If the request body is invalid.
 * @access Private - Requires login and admin privileges.
 */
router.post("/", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    if (!req.body)
      throw new BadRequestError("No data sent");
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    req.body.handle = req.body.handle.toLowerCase();
    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves a list of companies, optionally filtered by search criteria.
 * 
 * @route GET /
 * @param {Object} req.query - The query parameters for filtering.
 * @param {number} [req.query.minEmployees] - The minimum number of employees.
 * @param {number} [req.query.maxEmployees] - The maximum number of employees.
 * @param {string} [req.query.nameLike] - Partial name match (case-insensitive).
 * @returns {Object} 200 - An array of company objects.
 * @throws {BadRequestError} 400 - If the query parameters are invalid.
 * @access Public
 */
router.get("/", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.query, companySearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const { minEmployees, maxEmployees, nameLike } = req.query;
    const companies = await Company.findAll({ minEmployees, maxEmployees, nameLike });
    return res.json({ companies });
  } catch (err) {
    return next(err);
  }
});

/**
 * Retrieves details of a specific company by its handle.
 * 
 * @route GET /:handle
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.handle - The unique handle of the company to retrieve.
 * @returns {Object} 200 - Company details including associated jobs.
 * @returns {Object} 200.company - The company object.
 * @returns {string} 200.company.handle - The company's unique identifier.
 * @returns {string} 200.company.name - The company's name.
 * @returns {string} 200.company.description - A description of the company.
 * @returns {number} 200.company.numEmployees - The number of employees in the company.
 * @returns {string} 200.company.logoUrl - URL to the company's logo.
 * @returns {Array} 200.company.jobs - An array of job objects associated with the company.
 * @returns {number} 200.company.jobs[].id - The job's unique identifier.
 * @returns {string} 200.company.jobs[].title - The job title.
 * @returns {number} 200.company.jobs[].salary - The job salary.
 * @returns {string} 200.company.jobs[].equity - The job equity.
 * @returns {string} 200.company.jobs[].companyHandle - The handle of the company offering the job.
 * @throws {BadRequestError} 400 - If the company handle is invalid.
 * @throws {NotFoundError} 404 - If the company is not found.
 * @access Public
 */
router.get("/:handle", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.params, companyHandleOnlySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      console.error(errs);
      throw new BadRequestError(errs);
    }
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * Updates an existing company's information.
 *
 * Validates the body data against companyUpdateSchema.
 *
 * @route PATCH /:handle
 *
 * @param {Object} req.params - URL parameters.
 *
 * @param {Object} req.body - The company data to update.
 * @param {string} [req.body.name] - The updated company name.
 * @param {string} [req.body.description] - The updated company description.
 * @param {number} [req.body.numEmployees] - The updated number of employees.
 * @param {string} [req.body.logoUrl] - The updated URL to the company's logo.
 * @returns {Object} 200 - The updated company object.
 * @returns {Object} 200.company - The updated company details.
 * @returns {string} 200.company.handle - The company's unique identifier (unchanged).
 * @returns {string} 200.company.name - The company's updated name.
 * @returns {string} 200.company.description - The updated company description.
 * @returns {number} 200.company.numEmployees - The updated number of employees.
 * @returns {string} 200.company.logoUrl - The updated URL to the company's logo.
 * @throws {BadRequestError} 400 - If the request body is invalid or the company handle is invalid.
 * @throws {NotFoundError} 404 - If the company is not found.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.patch("/:handle", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/**
 * Deletes a specific company by its handle.
 *
 * @route DELETE /:handle
 * @param {Object} req - Express request object.
 * @param {Object} req.params - URL parameters.
 * @param {string} req.params.handle - The unique handle of the company to delete.
 * @returns {Object} 200 - Confirmation of deletion.
 * @returns {string} 200.deleted - The handle of the deleted company.
 * @throws {BadRequestError} 400 - If the company handle is invalid.
 * @throws {NotFoundError} 404 - If the company is not found.
 * @throws {UnauthorizedError} 401 - If the user is not logged in or not an admin.
 * @access Private - Requires login and admin privileges.
 */
router.delete("/:handle", onlyAdmin, ensureLoggedIn, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.params, companyHandleOnlySchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
