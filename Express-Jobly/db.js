/**
 * @fileoverview Database connection module for the application.
 * This module establishes a connection to the PostgreSQL database using the pg library.
 * It handles different connection configurations for production and non-production environments.
 * 
 * @module db
 * @requires pg
 * @requires ./config
 */

"use strict";
const { Pool } = require("pg");
const { getDatabaseUri } = require("./config");
/**
 * The database pool instance.
 * @type {pg.Pool}
 */
let db;
if (process.env.NODE_ENV === "production") {
  /**
   * Production database configuration.
   * Uses SSL with rejected unauthorized connections.
   */
  db = new Pool({
    connectionString: getDatabaseUri(),
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  /**
   * Non-production (development/test) database configuration.
   * Does not use SSL.
   */
  db = new Pool({
    connectionString: getDatabaseUri()
  });
}
/**
 * Establishes a connection to the database.
 * @function
 */
db.connect();
/**
 * Exports the database pool instance.
 * @exports db
 */
module.exports = db;
