/**
 * @fileoverview Test setup and teardown utilities for the Jobly application.
 * This module provides common functions for setting up and cleaning up the test database,
 * including populating it with sample data and managing database transactions.
 * 
 * @module _testCommon
 * @requires bcrypt
 * @requires ../db
 * @requires ../config
 */

const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { createToken } = require("../helpers/tokens");

// create testJobId's and getTestJobIds() for testing job applications
const testJobIds = [];
const getTestJobIds = () => [...testJobIds];

/**
 * Sets up the test database by truncating existing tables and inserting sample data.
 * This function should be called before all tests in a test suite.
 * 
 * @async
 * @function commonBeforeAll
 * @returns {Promise<void>}
 */
async function commonBeforeAll() {
  await db.query('TRUNCATE TABLE applications RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE jobs RESTART IDENTITY CASCADE');
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
  await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');

  await db.query(`
    INSERT INTO 
      companies 
      (handle, 
      name, 
      num_employees, 
      description, 
      logo_url)
    VALUES 
      ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
      ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
      ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

  await db.query(`
    INSERT INTO 
      users 
      (username, 
      password,
      first_name,
      last_name,
      email,
      is_admin)
    VALUES 
      ('u1', $1, 'U1F', 'U1L', 'u1@email.com', FALSE),
      ('u2', $2, 'U2F', 'U2L', 'u2@email.com', FALSE),
      ('a1', $3, 'A1F', 'A1L', 'a1@email.com', TRUE)
    RETURNING 
      username`,
    [
      await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("password3", BCRYPT_WORK_FACTOR),
    ]);

  const resultsJobs = await db.query(`
    INSERT INTO
      jobs
      (title,
      salary,
      equity,
      company_handle)
    VALUES
      ('j1', 100000, '0.1', 'c1'),
      ('j2', 200000, '0.2', 'c2'),
      ('j3', 300000, '0', 'c3')
    RETURNING id`);

  //Use job ID's from resultsJobs for other tests
  testJobIds.push(...resultsJobs.rows.map(r => r.id));

  console.log("testJobIds after insertion:", testJobIds);
}

/**
 * Starts a new database transaction.
 * This function should be called before each individual test.
 * 
 * @async
 * @function commonBeforeEach
 * @returns {Promise<void>}
 */
async function commonBeforeEach() {
  await db.query("BEGIN");
}

/**
 * Rolls back the current database transaction.
 * This function should be called after each individual test to undo any changes made during the test.
 * 
 * @async
 * @function commonAfterEach
 * @returns {Promise<void>}
 */
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

/**
 * Closes the database connection.
 * This function should be called after all tests in a test suite have completed.
 * 
 * @async
 * @function commonAfterAll
 * @returns {Promise<void>}
 */
async function commonAfterAll() {
  await db.end();
}


const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const adminToken = createToken({ username: "admin", isAdmin: true });


module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getTestJobIds,
  u1Token,
  u2Token,
  adminToken,
};