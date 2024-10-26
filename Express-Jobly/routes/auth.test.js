/**
 * @fileoverview Test suite for authentication routes.
 * This module tests the authentication endpoints for token generation and user registration.
 * It includes tests for successful operations as well as various failure scenarios.
 * 
 * @module authTest
 * @requires supertest
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
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**
 * Test suite for POST /auth/token endpoint
 */
describe("POST /auth/token", function () {
  /**
   * Tests successful token authentication
   * Should return a token when provided with valid credentials
   */
  test("works", async function () {
    const resp = await request(app)
      .post("/auth/token")
      .send({
        username: "u1",
        password: "password1",
      });
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  /**
   * Tests authentication failure for non-existent user
   * Should return 401 status when the user does not exist
   */
  test("unauth with non-existent user", async function () {
    const resp = await request(app)
      .post("/auth/token")
      .send({
        username: "no-such-user",
        password: "password1",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Tests authentication failure with wrong password
   * Should return 401 status when a wrong password is used
   */
  test("unauth with wrong password", async function () {
    const resp = await request(app)
      .post("/auth/token")
      .send({
        username: "u1",
        password: "nope",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Tests bad request response for no data
   * Should return 400 status when required data fields are missing
   */
  test("bad request with no data", async function () {
    const resp = await request(app)
      .post("/auth/token");
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Tests bad request response for missing data
   * Should return 400 status when required data fields are missing
   */
  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/auth/token")
      .send({
        username: "u1",
      });
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Tests bad request response for invalid data
   * Should return 400 status when provided data is not valid
   */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/auth/token")
      .send({
        username: 42,
        password: "above-is-a-number",
      });
    expect(resp.statusCode).toEqual(400);
  });
});


/**
 * Tests for the POST /auth/register endpoint.
 */
describe("POST /auth/register", function () {
  /**
   * Tests successful user registration for anonymous requests
   * Should return a token when registration is successful
   */
  test("works for anon", async function () {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "new",
        firstName: "first",
        lastName: "last",
        password: "password",
        email: "new@email.com",
      });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  /**
   * Tests bad request response for missing fields
   * Should return 400 status when mandatory fields are not provided
   */
  test("bad request with missing fields", async function () {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "new",
      });
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Tests bad request response for invalid email
   * Should return 400 status when the provided email format is invalid
   */
  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "new",
        firstName: "first",
        lastName: "last",
        password: "password",
        email: "not-an-email",
      });
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Tests bad request response for duplicate username
   * Should return 400 status when trying to register with an existing username
   */
  test("bad request with duplicate username", async function () {
    const resp = await request(app)
      .post("/auth/register")
      .send({
        username: "u1",
        firstName: "first",
        lastName: "last",
        password: "password",
        email: "new@email.com",
      });
    expect(resp.statusCode).toEqual(400);
  });
});
