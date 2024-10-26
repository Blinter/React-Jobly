/**
 * @fileoverview Company model for handling company-related database operations.
 * This module provides a Company class with static methods for creating, reading, updating, and deleting company information.
 * It also includes functionality for filtering companies based on various criteria.
 * 
 * @module company
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
 * @class Company
 * @description Represents a company and provides methods for CRUD operations on company data.
 */
class Company {
  /**
   * Creates a new company in the database.
   * 
   * @static
   * @async
   * @param {Object} company - The company data.
   * @param {string} company.handle - The company's unique identifier.
   * @param {string} company.name - The company's name.
   * @param {string} company.description - A description of the company.
   * @param {number} company.numEmployees - The number of employees in the company.
   * @param {string} company.logoUrl - URL to the company's logo.
   * @returns {Promise<Object>} The created company object.
   * @throws {BadRequestError} If a company with the same handle already exists.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async create({ handle, name, description, numEmployees, logoUrl }) {
    let duplicateCheck;
    try {
      duplicateCheck = await db.query(
        `SELECT 
        handle
      FROM 
        companies
      WHERE 
        handle = $1`,
        [handle]);
    } catch (err) {
      throw new ExpressError(err);
    }

    if (duplicateCheck === undefined) {
      throw new ExpressError("Error checking for duplicate company.");
    }

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    let insertResult;

    try {
      insertResult = await db.query(
        `INSERT INTO 
        companies
        (handle, 
        name, 
        description, 
        num_employees, 
        logo_url)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING 
        handle, 
        name, 
        description, 
        num_employees AS "numEmployees", 
        logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
      );
    } catch (err) {
      throw new ExpressError(err);
    }

    if (insertResult === undefined ||
      insertResult?.rows?.length === 0) {
      throw new ExpressError("Error creating new company.");
    }

    const company = insertResult.rows[0];

    return company;
  }

  /**
   * Retrieves all companies, optionally filtered by search criteria.
   * 
   * @static
   * @async
   * @param {Object} [filters={}] - The filter criteria.
   * @param {number} [filters.minEmployees] - The minimum number of employees.
   * @param {number} [filters.maxEmployees] - The maximum number of employees.
   * @param {string} [filters.nameLike] - Partial name match (case-insensitive).
   * @returns {Promise<Array<Object>>} An array of company objects.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async findAll(filters = {}) {
    const { minEmployees, maxEmployees, nameLike } = filters;

    let query = `
    SELECT 
      handle, 
      name, 
      description, 
      num_employees AS "numEmployees", 
      logo_url AS "logoUrl"
    FROM 
      companies`;

    const conditions = [];
    const values = [];

    if (minEmployees !== undefined) {
      conditions.push(`num_employees >= $${values.length + 1}`);
      values.push(minEmployees);
    }

    if (maxEmployees !== undefined) {
      conditions.push(`num_employees <= $${values.length + 1}`);
      values.push(maxEmployees);
    }

    if (nameLike !== undefined) {
      conditions.push(`LOWER(name) LIKE '%' || LOWER($${values.length + 1}) || '%'`);
      values.push(nameLike);
    }

    if (conditions.length > 0)
      query += " WHERE " + conditions.join(" AND ");

    query += " ORDER BY name";

    let companiesRes;

    try {
      companiesRes = await db.query(query, values);
    } catch (err) {
      throw new ExpressError(err);
    }

    return companiesRes.rows;
  }

  /**
   * Retrieves a specific company by its handle, including associated jobs.
   * 
   * @static
   * @async
   * @param {string} handle - The unique handle of the company to retrieve.
   * @returns {Promise<Object>} The company object with associated jobs.
   * @throws {NotFoundError} If no company is found with the given handle.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async get(handle) {
    if (!handle)
      throw new NotFoundError(`No company: ${handle}`);
    let companyRes;
    try {
      companyRes = await db.query(
        `SELECT 
          c.handle,
          c.name,
          c.description,
          c.num_employees AS "numEmployees",
          c.logo_url AS "logoUrl",
          j.id,
          j.title,
          j.salary,
          j.equity
        FROM 
          companies c
        LEFT JOIN 
          jobs j ON c.handle = j.company_handle
        WHERE 
          c.handle = $1`,
        [handle]
      );
    } catch (err) {
      throw new ExpressError(err);
    }

    if (companyRes === undefined ||
      companyRes?.rows?.length === 0)
      throw new NotFoundError(`No company: ${handle}`);

    const companyData = companyRes.rows[0];

    // Extract job data
    const jobs = companyRes.rows.map(row => ({
      id: row.id,
      title: row.title,
      salary: row.salary,
      equity: row.equity
    }));

    // Remove null entries (in case of no jobs)
    const filteredJobs = jobs.filter(job => job.id !== null);

    // Return company data with jobs
    return {
      handle: companyData.handle,
      name: companyData.name,
      description: companyData.description,
      numEmployees: companyData.numEmployees,
      logoUrl: companyData.logoUrl,
      jobs: filteredJobs
    };
  }

  /**
   * Updates an existing company's information.
   * 
   * @static
   * @async
   * @param {string} handle - The unique handle of the company to update.
   * @param {Object} data - The company data to update.
   * @param {string} [data.name] - The updated company name.
   * @param {string} [data.description] - The updated company description.
   * @param {number} [data.numEmployees] - The updated number of employees.
   * @param {string} [data.logoUrl] - The updated URL to the company's logo.
   * @returns {Promise<Object>} The updated company object.
   * @throws {NotFoundError} If no company is found with the given handle.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
    UPDATE 
      companies 
    SET 
      ${setCols} 
    WHERE 
      handle = ${handleVarIdx} 
    RETURNING 
      handle, 
      name, 
      description, 
      num_employees AS "numEmployees", 
      logo_url AS "logoUrl"`;

    let updateResult;
    try {
      updateResult = await db.query(querySql, [...values, handle]);
    } catch (err) {
      throw new ExpressError(err);
    }
    if (updateResult === undefined ||
      updateResult?.rows?.length === 0)
      throw new NotFoundError(`No company: ${handle}`);

    const company = updateResult.rows[0];
    return company;
  }

  /**
   * Removes a specific company from the database.
   * 
   * @static
   * @async
   * @param {string} handle - The unique handle of the company to remove.
   * @throws {NotFoundError} If no company is found with the given handle.
   * @throws {ExpressError} If there's an error during the database operation.
   */
  static async remove(handle) {
    let removeResult;
    try {
      removeResult = await db.query(
        `DELETE FROM 
        companies
      WHERE 
        handle = $1
      RETURNING 
        handle`,
        [handle]);
    } catch (err) {
      throw new ExpressError(err);
    }
    if (removeResult === undefined ||
      removeResult?.rows?.length === 0)
      throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
