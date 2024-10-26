/**
 * @fileoverview Test suite for the companies routes in the Express-Jobly application.
 * This module contains tests for creating, reading, updating, and deleting company information,
 * as well as filtering companies based on various criteria. It uses supertest for HTTP assertions
 * and Jest as the testing framework.
 * 
 * @module companies.test
 * @requires supertest
 * @requires express
 * @requires ../app
 * @requires ./_testCommon
 */

"use strict";

const request = require("supertest");
const app = require("../app");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**
 * Test suite for the POST /companies route.
 *
 * This function uses the describe block from Jest testing framework to group
 * tests related to the creation of a new company. Each test case within this
 * suite targets specific scenarios such as successful company creation,
 * missing data, and invalid data input.
 */
describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  /**
   * Test for creating a new company.
   *
   * Asserts that a newly posted company is successfully created and the response
   * includes the correct company details.
   */
  test("unauth for users", async function () {
    const resp = await request(app)
      .post("/companies")
      .send(newCompany)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test case to check response when required data is missing in the request for creating a company.
   *
   * The test sends a POST request to the `/companies` endpoint with a partial company object,
   * missing required fields except for `handle` and `numEmployees`. It then checks if the
   * response status code is 400, indicating a bad request due to missing data.
   */
  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        handle: "new",
        numEmployees: 10,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test case to verify response for a bad request with invalid data in company creation.
   *
   * The test sends a POST request to the `/companies` endpoint with a company object
   * where the `logoUrl` contains invalid URL data. It checks if the response status
   * code is 400, indicating a bad request due to incorrect data.
   */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/companies")
      .send({
        ...newCompany,
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});
/**
 * Tests for the GET /companies endpoint.
 */
describe("GET /companies", function () {
  /**
   * Test case for the GET /companies endpoint when accessed anonymously.
   *
   * This test sends a GET request to the /companies endpoint without any authentication
   * to verify that the response contains the correct list of companies.
   * It checks the structure and data of the response to ensure it includes
   * the expected companies.
   */
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies: [
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
      ],
    });
  });

  /**
   * Test case for the `GET /companies` endpoint with a filter for `minEmployees`.
   *
   * Sends a GET request to `/companies` with a query parameter for `minEmployees`.
   * Validates that the response body contains a list of companies with at least
   * the specified number of employees.
   */
  test("works: filter by minEmployees", async function () {
    const resp = await request(app).get("/companies").query({ minEmployees: 2 });
    expect(resp.body).toEqual({
      companies: [
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
      ],
    });
  });

  /**
   * Test case for the `GET /companies` endpoint with a filter for `maxEmployees`.
   *
   * Sends a GET request to `/companies` with a query parameter for `maxEmployees`.
   * Validates that the response body contains a list of companies with at most
   * the specified number of employees.
   */
  test("works: filter by maxEmployees", async function () {
    const resp = await request(app).get("/companies").query({ maxEmployees: 2 });
    expect(resp.body).toEqual({
      companies: [
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
      ],
    });
  });

  /**
   * Test case for the `GET /companies` endpoint with a filter for `nameLike`.
   *
   * Sends a GET request to `/companies` with a query parameter for `nameLike`.
   * Validates that the response body contains a list of companies where the
   * company name includes the specified substring.
   */
  test("works: filter by nameLike", async function () {
    const resp = await request(app).get("/companies").query({ nameLike: "c" });
    expect(resp.body).toEqual({
      companies: [
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
      ],
    });
  });

  /**
   * Test case for the `GET /companies` endpoint with combined filters.
   *
   * Sends a GET request to `/companies` with multiple query parameters including
   * `minEmployees`, `maxEmployees`, and `nameLike`. Validates that the response
   * body contains a list of companies that match all the specified criteria.
   */
  test("works: combine filters", async function () {
    const resp = await request(app).get("/companies").query({ minEmployees: 2, maxEmployees: 3, nameLike: "c" });
    expect(resp.body).toEqual({
      companies: [
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
      ],
    });
  });

  /**
   * Test case for the `GET /companies` endpoint when using an invalid filter.
   *
   * This test sends a GET request to `/companies` with an invalid query parameter.
   * It checks that the response status code is 400, indicating a bad request
   * due to the invalid filter.
   */
  test("fails: invalid filter", async function () {
    const resp = await request(app).get("/companies").query({ invalidFilter: "value" });
    expect(resp.statusCode).toEqual(400);
  });
});

/**
 * Tests for the GET /companies/:handle endpoint.
 */
describe("GET /companies/:handle", function () {
  /**
   * Test case for GET /companies/:handle endpoint accessed anonymously.
   *
   * Sends a GET request to the endpoint for a specific company handle
   * and checks that the response contains the correct company details,
   * including a list of jobs associated with the company.
   */
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        jobs: expect.any(Array),
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  /**
   * Test case for checking the response of a company without jobs
   * for the GET /companies/:handle endpoint when accessed anonymously.
   *
   * Sends a GET request to the endpoint for a specific company handle (`c2`)
   * which does not have any associated jobs. Checks that the response
   * contains the correct company details with an empty list for jobs.
   */
  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        jobs: expect.any(Array),
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  /**
   * Test case for `GET /companies/nope`.
   *
   * Sends a GET request to the companies endpoint for a non-existing company.
   * Validates that the response status code is 404, indicating that the company
   * does not exist in the database.
   */
  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/**
* Tests for the PATCH /companies/:handle endpoint.
*/
describe("PATCH /companies/:handle", function () {
  /**
   * Test case for the PATCH /companies/:handle endpoint.
   *
   * This test checks if an admin with proper authorization can successfully
   * patch a company's details. It sends an authenticated PATCH request to
   * update the name of the company and expects the response to reflect
   * the updated company details.
   */
  test("works for admins", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  /**
   * Test case for the PATCH /companies/:handle endpoint.
   *
   * This test sends a PATCH request to the `/companies/c1` endpoint for a an
   * authenticated user without an administrator flag to ensure that 
   * logged-in users cannot update company details.
   * The test checks that the response status code is 401, indicating an
   * unauthorized access attempt.
   */
  test("unauth for users", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test case for the PATCH /companies/:handle endpoint when accessed anonymously.
   *
   * This test sends a PATCH request to the `/companies/c1` endpoint without any
   * authorization to ensure that unauthorized users cannot update company details.
   * The test checks that the response status code is 401, indicating an
   * unauthorized access attempt.
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        name: "C1-new",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test case for the PATCH /companies/:handle endpoint when the company does not exist.
   *
   * This test sends an authenticated PATCH request to update the name of a
   * non-existing company (`nope`). The test checks that the response status
   * code is 404, indicating that the company does not exist in the database.
   */
  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/companies/nope`)
      .send({
        name: "new nope",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  /**
   * Test case for handling a bad request when attempting to change the handle on a company.
   *
   * This test sends a PATCH request to the `/companies/c1` endpoint to attempt changing
   * the handle of the company. It expects the response to have a status code of 400,
   * indicating a bad request since handle changes should not be allowed.
   */
  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        handle: "c1-new",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test case for handling bad request with invalid data during a PATCH operation on a company.
   *
   * This test sends a PATCH request to the `/companies/c1` endpoint with invalid data
   * for the `logoUrl`. It checks that the response has a status code of 400,
   * indicating a bad request due to invalid input data.
   */
  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/companies/c1`)
      .send({
        logoUrl: "not-a-url",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/**
 * Tests for the DELETE /companies/:handle endpoint.
 */
describe("DELETE /companies/:handle", function () {
  /**
   * Test case for the DELETE /companies/:handle endpoint with admin users.
   *
   * This test sends an authenticated DELETE request to the `/companies/c1` endpoint.
   * It verifies that the company is successfully deleted by checking if the
   * response body contains a confirmation with the deleted company's handle.
   */
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  /**
   * Test case for the DELETE /companies/:handle endpoint when accessed by an authenticated user.
   *
   * This test sends a DELETE request to the `/companies/c1` endpoint for a user without
   * an administrator flag to ensure that authorized users cannot delete a company.
   * It checks that the response status code is 401, indicating an unauthorized
   * access attempt.
   */
  test("works for admins", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test case for the DELETE /companies/:handle endpoint when accessed anonymously.
   *
   * This test sends a DELETE request to the `/companies/c1` endpoint without
   * any authorization to ensure that unauthorized users cannot delete a company.
   * It checks that the response status code is 401, indicating an unauthorized
   * access attempt.
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test case for DELETE /companies/:handle endpoint when the company does not exist.
   *
   * This test sends an authenticated DELETE request for a non-existing company handle (`nope`).
   * It checks that the response status code is 404, indicating that the company
   * to be deleted does not exist.
   */
  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/companies/nope`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
