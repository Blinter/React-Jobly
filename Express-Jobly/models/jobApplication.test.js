/**
 * @fileoverview Test suite for the JobApplication class.
 * This module contains unit tests for the job application operations,
 * including applying for jobs and removing job applications.
 * 
 * @module JobApplicationTest
 * @requires ../db
 * @requires ../expressError
 * @requires ./jobApplication
 * @requires ./_testCommon
 */


const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const JobApplication = require("./jobApplication");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  getTestJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/** Testing suite for JobApplication functionalities */
describe("JobApplication", function () {
  /** Test applying a user to a job */
  test("apply", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    const username = "u1";
    const result = await JobApplication.apply(username, jobId);
    expect(result).toEqual({ applied: jobId });

    const found = await db.query(
      "SELECT * FROM applications WHERE username = $1 AND job_id = $2",
      [username, jobId]
    );
    expect(found.rows.length).toEqual(1);
  });

  /** Test for NotFoundError when applying with a bad job ID */
  test("apply - not found if bad job id", async function () {
    try {
      await JobApplication.apply("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /** Test for BadRequestError if application already exists */
  test("apply - bad request if application already exists", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    await JobApplication.apply("u1", jobId);
    try {
      await JobApplication.apply("u1", jobId);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  /** Test for NotFoundError when applying with a bad username */
  test("apply - not found if bad username", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    try {
      await JobApplication.apply("nonexistent_user", jobId);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual("Username cannot be found.");
    }
  });

  /** Test for BadRequestError if username is undefined */
  test("apply - bad request if username is undefined", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    try {
      await JobApplication.apply(...[undefined, jobId]);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual("Invalid input parameters.");
    }
  });

  /** Test for BadRequestError if jobId is undefined */
  test("apply - bad request if jobId is undefined", async function () {
    try {
      await JobApplication.apply("u1", undefined);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(err.message).toEqual("Invalid input parameters.");
    }
  });
});

/** Testing suite for removal of Job Application */
describe("remove", function () {
  /** Test successful removal of a job application */
  test("successfully remove a job application", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    const username = "u1";

    // First, apply for the job
    await JobApplication.apply(username, jobId);

    // Then, remove the application
    await JobApplication.remove(username, jobId);

    // Check that the application was removed
    const found = await db.query(
      "SELECT * FROM applications WHERE username = $1 AND job_id = $2",
      [username, jobId]
    );
    expect(found.rows.length).toEqual(0);
  });

  /** Test NotFoundError if trying to remove a non-existent application */
  test("not found if trying to remove non-existent application", async function () {
    const testJobIds = getTestJobIds();
    const jobId = testJobIds[0];
    const username = "u1";

    try {
      await JobApplication.remove(username, jobId);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(err.message).toEqual(`No job aplication found for Job ID ${jobId} by username ${username}`);
    }
  });

  /** Test NotFoundError if trying to remove with invalid job ID */
  test("not found if trying to remove with invalid job ID", async function () {
    try {
      await JobApplication.remove("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});