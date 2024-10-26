/**
 * @fileoverview Test suite for the Job model.
 * This module contains unit tests for the Job model's CRUD operations.
 * It verifies the functionality of creating, reading, updating, and deleting job records.
 *
 * @module job.test
 * @requires ../db.js
 * @requires ../expressError
 * @requires ./job.js
 * @requires ./_testCommon
 */

"use strict";

const db = require("../db.js");
const { 
  BadRequestError, 
  NotFoundError 
} = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**
 * Test suite for the Job.create method.
 * Tests the creation of new job records in the database.
 */
describe("create", function () {
  const newJob = {
    title: "New Job",
    salary: 50000,
    equity: "0.05",
    companyHandle: "c1",
  };

  /**
   * Test for successful creation of a job.
   * Ensures the job is created and data matches the intended input.
   */
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "New Job",
      salary: 50000,
      equity: "0.05",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE title = 'New Job'`
    );

    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "New Job",
        salary: 50000,
        equity: "0.05",
        company_handle: "c1",
      },
    ]);
  });

});

/**
 * Test suite for the Job.findAll method.
 * Tests the retrieval of job records with and without filters.
 */
describe("findAll", function () {
  /**
   * Test for retrieving all jobs without any filters.
   * Ensures all job records are returned.
   */
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });

  /**
   * Test for retrieving jobs with a salary equal to or greater than a specified minimum salary.
   */
  test("works: filter by minSalary", async function () {
    let jobs = await Job.findAll({ minSalary: 150000 });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });

  /**
   * Test for retrieving jobs that include equity.
   */
  test("works: filter by hasEquity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
    ]);
  });

  /**
   * Test for retrieving jobs with titles like a specified string.
   */
  test("works: filter by titleLike", async function () {
    let jobs = await Job.findAll({ titleLike: "j" });
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 200000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 300000,
        equity: "0",
        companyHandle: "c3",
      },
    ]);
  });
});

/**
 * Test suite for the Job.get method.
 * Tests retrieval of a specific job record by ID.
 */
describe("get", function () {
  /**
   * Test for successful retrieval of a job by ID.
   */
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "j1",
      salary: 100000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  /**
   * Test for retrieving a job that does not exist.
   * Ensures it throws a NotFoundError.
   */
  test("not found if no such job", async function () {
    try {
      await Job.get(99999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**
 * Test suite for the Job.update method.
 * Tests updating job records.
 */
describe("update", function () {
  const updateData = {
    title: "Updated Job",
    salary: 60000,
    equity: "0.1",
  };

  /**
   * Test for successful updating of a job.
   * Ensures the updated data matches the intended changes.
   */
  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      title: "Updated Job",
      salary: 60000,
      equity: "0.1",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
       FROM jobs
       WHERE id = 1`
    );
    expect(result.rows).toEqual([{
      id: 1,
      title: "Updated Job",
      salary: 60000,
      equity: "0.1",
      company_handle: "c1",
    }]);
  });

  /**
   * Test for updating a job that does not exist.
   * Ensures it throws a NotFoundError.
   */
  test("not found if no such job", async function () {
    try {
      await Job.update(99999, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
   * Test for updating a job with no data.
   * Ensures it throws a BadRequestError.
   */
  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/**
 * Test suite for the Job.remove method.
 * Tests removal of job records.
 */
describe("remove", function () {
  /**
   * Test for successful removal of a job.
   * Ensures the job is no longer in the database.
   */
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
      "SELECT id FROM jobs WHERE id=1");
    expect(res.rows.length).toEqual(0);
  });

  /**
   * Test for removing a job that does not exist.
   * Ensures it throws a NotFoundError.
   */
  test("not found if no such job", async function () {
    try {
      await Job.remove(99999);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});