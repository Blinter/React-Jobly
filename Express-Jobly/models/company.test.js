/**
 * @fileoverview Test suite for the Company model.
 * This module contains unit tests for the Company model, covering all CRUD operations
 * and various filtering scenarios. It ensures the proper functioning of company creation,
 * retrieval, updating, and deletion, as well as the correct behavior of the findAll method
 * with different filter combinations.
 *
 * @module company.test
 * @requires ../db
 * @requires ../expressError
 * @requires ./company
 * @requires ./_testCommon
 */

"use strict";

const db = require("../db.js");
const { 
  BadRequestError, 
  NotFoundError 
} = require("../expressError");
const Company = require("./company.js");
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

/** Tests for creating a company in the database. */
describe("create", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    description: "New Description",
    numEmployees: 1,
    logoUrl: "http://new.img",
  };

  /** Verifies that a new company can be created successfully. */
  test("works", async function () {
    let company = await Company.create(newCompany);
    expect(company).toEqual(newCompany);

    const result = await db.query(
          `SELECT
            handle,
            name,
            description,
            num_employees,
            logo_url
           FROM
            companies
           WHERE
            handle = 'new'`);
    expect(result.rows).toEqual([
      {
        handle: "new",
        name: "New",
        description: "New Description",
        num_employees: 1,
        logo_url: "http://new.img",
      },
    ]);
  });

  /** Throws a BadRequestError if attempting to create with a duplicate handle. */
  test("bad request with dupe", async function () {
    try {
      await Company.create(newCompany);
      await Company.create(newCompany);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/** Tests for retrieving all companies with optional filters. */
describe("findAll", function () {
  /** Ensures findAll works without any filter applied. */
  test("works: no filter", async function () {
    let companies = await Company.findAll();
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  /** Tests filtering companies by minimum number of employees, with string input. */
  test("works: filter by minEmployees with string input", async function () {
    let companies = await Company.findAll({ minEmployees: "2" });
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  /** Tests filtering companies by maximum number of employees, with string input. */
  test("works: filter by maxEmployees with string input", async function () {
    let companies = await Company.findAll({ maxEmployees: "2" });
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  /** Tests filtering with both minEmployees and maxEmployees. */
  test("works: filter by minEmployees and maxEmployees", async function () {
    let companies = await Company.findAll({ minEmployees: 2, maxEmployees: 2 });
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  /** Tests filtering by minEmployees and maxEmployees with string input values. */
  test("works: filter by minEmployees and maxEmployees with string inputs", async function () {
    let companies = await Company.findAll({ minEmployees: "2", maxEmployees: "2" });
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  /** Tests filtering companies by minimum number of employees. */
  test("works: filter by minEmployees", async function () {
    let companies = await Company.findAll({ minEmployees: 2 });
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  /** Tests filtering companies by maximum number of employees. */
  test("works: filter by maxEmployees", async function () {
    let companies = await Company.findAll({ maxEmployees: 2 });
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    ]);
  });

  /** Tests filtering companies by name. */
  test("works: filter by nameLike", async function () {
    let companies = await Company.findAll({ nameLike: "c" });
    expect(companies).toEqual([
      {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });

  /** Tests finding companies with multiple simultaneous filters applied. */
  test("works: combine filters", async function () {
    let companies = await Company.findAll({ minEmployees: 2, maxEmployees: 3, nameLike: "c" });
    expect(companies).toEqual([
      {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
      {
        handle: "c3",
        name: "C3",
        description: "Desc3",
        numEmployees: 3,
        logoUrl: "http://c3.img",
      },
    ]);
  });
});

/** Tests for retrieving a company by handle from the database. */
describe("get", function () {
  /** Ensures that retrieving an existing company works correctly. */
  test("works", async function () {
    let company = await Company.get("c1");
    expect(company).toEqual({
      handle: "c1",
      jobs: expect.any(Array),
      name: "C1",
      description: "Desc1",
      numEmployees: 1,
      logoUrl: "http://c1.img",
    });
  });

  /** Throws a NotFoundError if no company is found. */
  test("not found if no such company", async function () {
    try {
      await Company.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/** Tests for updating an existing company in the database. */
describe("update", function () {
  const updateData = {
    name: "New",
    description: "New Description",
    numEmployees: 10,
    logoUrl: "http://new.img",
  };

  /** Tests updating a company in the database. Ensures the company details are updated correctly. */
  test("works", async function () {
    let company = await Company.update("c1", updateData);
    expect(company).toEqual({
      handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });
  
  /**
    * Tests updating a company with fields set to null.
    * Ensures that updating a company's nullable fields works correctly,
    * and verifies the updated state in the database.
    */
  test("works: null fields", async function () {
    const updateDataSetNulls = {
      name: "New",
      description: "New Description",
      numEmployees: null,
      logoUrl: null,
    };

    let company = await Company.update("c1", updateDataSetNulls);
    expect(company).toEqual({
      handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT handle, name, description, num_employees, logo_url
           FROM companies
           WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: null,
      logo_url: null,
    }]);
  });

  /**
   * Tests that a NotFoundError is thrown when updating a non-existent company.
   * This ensures that the update method properly handles cases where the company handle
   * does not exist in the database, and does not perform any changes.
   */
  test("not found if no such company", async function () {
    try {
      await Company.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
   * Tests that a BadRequestError is thrown when attempting to update
   * a company with no data provided. This verifies that the update
   * method requires at least one field to update, and ensures
   * the method properly handles invalid update requests.
   */
  test("bad request with no data", async function () {
    try {
      await Company.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  /**
   * Tests updating a company with string inputs for fields where numbers are expected.
   * Ensures that the update method correctly parses the input strings to numbers when possible,
   * and verifies the updated state in the database.
   */
  test("works: update with string inputs", async function () {
    let company = await Company.update("c1", {
      name: "New",
      description: "New Description",
      numEmployees: "10",
      logoUrl: "http://new.img",
    });
    expect(company).toEqual({
      handle: "c1",
      name: "New",
      description: "New Description",
      numEmployees: 10,
      logoUrl: "http://new.img",
    });

    const result = await db.query(
      `SELECT handle, name, description, num_employees, logo_url
       FROM companies
       WHERE handle = 'c1'`);
    expect(result.rows).toEqual([{
      handle: "c1",
      name: "New",
      description: "New Description",
      num_employees: 10,
      logo_url: "http://new.img",
    }]);
  });

});

/** Tests for removing a company from the database. */
describe("remove", function () {
  /** Ensures the removal of an existing company works correctly. */
  test("works", async function () {
    await Company.remove("c1");
    const res = await db.query(
        "SELECT handle FROM companies WHERE handle='c1'");
    expect(res.rows.length).toEqual(0);
  });

  /** Throws a NotFoundError if no company is found to remove. */
  test("not found if no such company", async function () {
    try {
      await Company.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
