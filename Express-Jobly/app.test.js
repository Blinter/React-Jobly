/**
 * @fileoverview Test suite for the Express application.
 * This module contains tests for various endpoints of the application,
 * including tests for non-existent paths to ensure proper 404 responses.
 * It also includes setup and teardown logic for the database connection.
 * 
 * @module app.test
 * @requires supertest
 * @requires ./app
 * @requires ./db
 */

const request = require("supertest");

const app = require("./app");
const db = require("./db");

/**
 * Test for 404 not found response when accessing a non-existent path.
 * 
 * @function
 * @name testNotFound
 * @returns {Promise<void>} - A promise that resolves when the test is complete.
 */
test("not found for site 404", async function () {
  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);
});

/**
 * Test for 404 not found response and test stack print
 * by temporarily clearing the NODE_ENV variable.
 * 
 * @function
 * @name testNotFoundWithStackPrint
 * @returns {Promise<void>} - A promise that resolves when the test is complete.
 */
test("not found for site 404 (test stack print)", async function () {
  process.env.NODE_ENV = "";
  const resp = await request(app).get("/no-such-path");
  expect(resp.statusCode).toEqual(404);
  delete process.env.NODE_ENV;
});

/**
 * Clean up database connection after all tests are completed.
 * 
 * @function
 * @name afterAllTests
 */
afterAll(function () {
  db.end();
});
