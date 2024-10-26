/**
 * @fileoverview Common setup and teardown functions for testing.
 * This module provides utility functions to initialize the database state
 * before tests, manage transactions during tests, and clean up after tests.
 * It also includes token generation for test users.
 * 
 * @module _testCommon
 * @requires ../db.js
 * @requires ../models/user
 * @requires ../models/company
 * @requires ../models/job
 * @requires ../helpers/tokens
 */

"use strict";

const db = require("../db.js");
const User = require("../models/user");
const Company = require("../models/company");
const Job = require("../models/job");
const { createToken } = require("../helpers/tokens");

// create testJobId's and getTestJobIds() for testing job applications
const testJobIds = [];
const getTestJobIds = () => [...testJobIds];

/*
 * Setup function to initialize the database state before all tests are run.
 * It clears out existing entries in the "applications", "jobs", "users", and 
 * "companies" tables * and resets identity sequences to ensure predictable 
 * auto-increment values. After truncating tables, it seeds the database with 
 * multiple example companies, users, and jobs for testing purposes.
 */
async function commonBeforeAll() {
  await db.query('TRUNCATE TABLE applications RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE jobs RESTART IDENTITY CASCADE');
  await db.query("ALTER SEQUENCE jobs_id_seq RESTART WITH 1");
  await db.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
  await db.query('TRUNCATE TABLE companies RESTART IDENTITY CASCADE');

  await Company.create(
    {
      handle: "c1",
      name: "C1",
      numEmployees: 1,
      description: "Desc1",
      logoUrl: "http://c1.img",
    });
  await Company.create(
    {
      handle: "c2",
      name: "C2",
      numEmployees: 2,
      description: "Desc2",
      logoUrl: "http://c2.img",
    });
  await Company.create(
    {
      handle: "c3",
      name: "C3",
      numEmployees: 3,
      description: "Desc3",
      logoUrl: "http://c3.img",
    });

  await User.register({
    username: "u1",
    firstName: "U1F",
    lastName: "U1L",
    email: "user1@user.com",
    password: "password1",
    isAdmin: false,
  });

  await User.register({
    username: "u2",
    firstName: "U2F",
    lastName: "U2L",
    email: "user2@user.com",
    password: "password2",
    isAdmin: false,
  });

  await User.register({
    username: "u3",
    firstName: "U3F",
    lastName: "U3L",
    email: "user3@user.com",
    password: "password3",
    isAdmin: false,
  });

  await User.register({
    username: "a1",
    firstName: "a1F",
    lastName: "a1L",
    email: "admin1@user.com",
    password: "password1",
    isAdmin: true,
  });


  const job1 = await Job.create({
    title: "j1",
    salary: 100000,
    equity: "0.1",
    companyHandle: "c1",
  });
  testJobIds.push(job1.id);

  const job2 = await Job.create({
    title: "j2",
    salary: 200000,
    equity: "0.2",
    companyHandle: "c2",
  });
  testJobIds.push(job2.id);

  const job3 = await Job.create({
    title: "j3",
    salary: 300000,
    equity: "0",
    companyHandle: "c3",
  });
  testJobIds.push(job3.id);

  console.log("testJobIds after insertion:", testJobIds);

  await Job.create({
    title: "j4",
    companyHandle: "c1",
  });

  await Job.create({
    title: "j5",
    salary: 400000,
    companyHandle: "c2",
  });

  await Job.create({
    title: "j6",
    equity: "0.2",
    companyHandle: "c3",
  });

  await Job.create({
    title: "j7",
    equity: "1.0",
    companyHandle: "c1",
  });
}

/*
 * Start a new transaction before each test. This ensures that the database
 * remains in a consistent state by isolating tests from one another.
 */
async function commonBeforeEach() {
  await db.query("BEGIN");
}

/*
 * Rollback the current transaction after each test. This operation
 * discards all the changes made to the database during the test,
 * restoring the state as it was before the test ran.
 */
async function commonAfterEach() {
  await db.query("ROLLBACK");
}

/*
 * Close down the database connection after all tests in the suite have completed.
 * This is crucial to ensure that testing resources are properly released.
 */
async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false });
const u3Token = createToken({ username: "u3", isAdmin: false });
const a1Token = createToken({ username: "a1", isAdmin: true });

module.exports = {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token,
  a1Token,
  getTestJobIds
};