/**
 * @fileoverview Helper functions for generating SQL queries.
 * This module provides utility functions for creating SQL queries,
 * particularly for partial updates of database records.
 * 
 * @module sql
 * @requires ../expressError
 */

"use strict";

const { BadRequestError } = require("../expressError");

/**
 * Generates a SQL query for updating specific columns of a table based on the given data.
 * 
 * @function sqlForPartialUpdate
 * 
 * @param {Object} dataToUpdate - An object containing the data that needs to be updated.
 * @param {Object} jsToSql - An object that maps JavaScript field names to their SQL column names.
 * 
 * @returns {Object} An object containing the SQL update string and values.
 * @returns {string} returns.setCols - A string of SQL column assignments formatted as `"col_name"=$1, ...`.
 * @returns {Array} returns.values - An array of corresponding values to be updated in the database.
 * 
 * @throws {BadRequestError} Throws an error if no data is provided for update.
 * 
 * @example
 * const dataToUpdate = { firstName: 'John', age: 30 };
 * const jsToSql = { firstName: 'first_name' };
 * const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
 * // result = {
 * //   setCols: '"first_name"=$1, "age"=$2',
 * //   values: ['John', 30]
 * // }
 * 
 * @description
 * This function takes an object of data to update and a mapping of JavaScript to SQL field names.
 * It generates a SQL-friendly string for updating columns and an array of corresponding values.
 * It handles nested objects and can use custom SQL column names if provided in the jsToSql mapping.
 * If a field's value is undefined, it is skipped in the update.
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (!keys.length) 
    throw new BadRequestError("No data");
  const cols = [];
  const values = [];
  keys.forEach(key => {
    const value = dataToUpdate[key];
    if (value !== undefined) {
      const sqlKey = jsToSql[key] || key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested objects
        if (Object.keys(jsToSql).some(k => k.startsWith(`${key}.`))) {
          Object.entries(value).forEach(([nestedKey, nestedValue]) => {
            if (nestedValue !== undefined) {
              const nestedSqlKey = jsToSql[`${key}.${nestedKey}`] || `${key}.${nestedKey}`;
              cols.push(`"${nestedSqlKey}"=$${values.length + 1}`);
              values.push(nestedValue);
            }
          });
        } else {
          // Treat the entire object as a single value
          cols.push(`"${sqlKey}"=$${values.length + 1}`);
          values.push(value);
        }
      } else {
        cols.push(`"${sqlKey}"=$${values.length + 1}`);
        values.push(value);
      }
    }
  });
  return {
    setCols: cols.join(", "),
    values,
  };
}

module.exports = { sqlForPartialUpdate };