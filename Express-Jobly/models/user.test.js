/**
 * @fileoverview Test suite for the User model.
 * This module contains unit tests for user-related operations, including authentication,
 * registration, retrieval, updating, and deletion of user information.
 * 
 * @module userTest
 * @requires ../expressError
 * @requires ../db.js
 * @requires ./user.js
 * @requires ./_testCommon
 */

"use strict";

const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");
const db = require("../db.js");
const User = require("./user.js");
const JobApplication = require("./jobApplication.js");
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

/**
 * Test suite for the `authenticate` function.
 */
describe("authenticate", function () {
  /**
   * Test successful user authentication.
   */
  test("works", async function () {
    const user = await User.authenticate("u1", "password1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
  });

  /**
   * Test failure due to non-existent user.
   */
  test("unauth if no such user", async function () {
    try {
      await User.authenticate("nope", "password");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  /**
   * Test failure due to incorrect password.
   */
  test("unauth if wrong password", async function () {
    try {
      await User.authenticate("c1", "wrong");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});

/**
 * Test suite for the `register` function.
 */
describe("register", function () {
  const newUser = {
    username: "new",
    firstName: "Test",
    lastName: "Tester",
    email: "test@test.com",
    isAdmin: false,
  };

  /**
   * Test successful user registration.
   */
  test("works", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
    });
    expect(user).toEqual(newUser);
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(false);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
   * Test successful registration with admin rights.
   */
  test("works: adds admin", async function () {
    let user = await User.register({
      ...newUser,
      password: "password",
      isAdmin: true,
    });
    expect(user).toEqual({ ...newUser, isAdmin: true });
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].is_admin).toEqual(true);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
   * Test failure due to duplicate registration data.
   */
  test("bad request with dup data", async function () {
    try {
      await User.register({
        ...newUser,
        password: "password",
      });
      await User.register({
        ...newUser,
        password: "password",
      });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/**
 * Test suite for finding all users.
 */
describe("findAll", function () {
  /**
   * Test that fetching all users works.
   */
  test("works", async function () {
    const users = await User.findAll();
    expect(users).toEqual(expect.arrayContaining([
      {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "u1@email.com",
        isAdmin: false,
      },
      {
        username: "u2",
        firstName: "U2F",
        lastName: "U2L",
        email: "u2@email.com",
        isAdmin: false,
      },
      {
        username: "a1",
        firstName: "A1F",
        lastName: "A1L",
        email: "a1@email.com",
        isAdmin: true,
      }
    ]));
  });
});

/**
 * Test suite for fetching a specific user.
 */
describe("get", function () {
  /**
   * Test successful retrieve of existing user.
   */
  test("works", async function () {
    let user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
      jobs: expect.any(Array),
    });
  });

  /**
   * Test failure when retrieving non-existent user.
   */
  test("not found if no such user", async function () {
    try {
      await User.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/**
 * Test suite for updating user details.
 */
describe("update", function () {
  const updateData = {
    firstName: "NewF",
    lastName: "NewF",
    email: "new@email.com",
    isAdmin: true,
  };

  /**
   * Test successful update of user information.
   */
  test("works", async function () {
    let job = await User.update("u1", updateData);
    expect(job).toEqual({
      username: "u1",
      ...updateData,
    });
  });

  /**
   * Test to update user password.
   */
  test("works: set password", async function () {
    let job = await User.update("u1", {
      password: "new",
    });
    expect(job).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
    });
    const found = await db.query("SELECT * FROM users WHERE username = 'u1'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  /**
   * Test failure when updating non-existent user.
   */
  test("not found if no such user", async function () {
    try {
      await User.update("nope", {
        firstName: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  /**
   * Test failure when no data is provided for update.
   */
  test("bad request if no data", async function () {
    expect.assertions(1);
    try {
      await User.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("works: returns updated user with jobs array", async function () {
    const testJobIds = getTestJobIds();
    const jobId1 = testJobIds[0];
    const jobId2 = testJobIds[1];
    expect(testJobIds).toBeDefined();
    expect(jobId1).toBeDefined();
    expect(jobId2).toBeDefined();

    // Apply for jobs
    await JobApplication.apply("u1", jobId1);
    await JobApplication.apply("u1", jobId2);

    const updateData = {
      firstName: "NewF",
      lastName: "NewL",
      email: "new@email.com",
    };

    const updatedUser = await User.update("u1", updateData);
    expect(updatedUser).toEqual({
      username: "u1",
      ...updateData,
      isAdmin: false,
      jobs: expect.arrayContaining([jobId1, jobId2]),
    });
  });

  test("works: returns updated user with no jobs array if no applications", async function () {
    const updateData = {
      firstName: "NewF",
      lastName: "NewL",
      email: "new@email.com",
    };

    const updatedUser = await User.update("u2", updateData);
    expect(updatedUser).toEqual({
      username: "u2",
      ...updateData,
      isAdmin: false
    });
  });

  test("works: doesn't change jobs when updating other fields", async function () {
    const testJobIds = getTestJobIds();
    const jobId1 = testJobIds[0];

    // Apply for a job
    await JobApplication.apply("u1", jobId1);

    const updateData = {
      firstName: "NewF",
      lastName: "NewL",
      email: "new@email.com",
    };

    const updatedUser = await User.update("u1", updateData);
    expect(updatedUser).toEqual({
      username: "u1",
      ...updateData,
      isAdmin: false,
      jobs: [jobId1],
    });
  });
});

/**
 * Test suite for removing a user.
 */
describe("remove", function () {
  /**
   * Test that user removal works.
   */
  test("works", async function () {
    await User.remove("u1");
    const res = await db.query(
      "SELECT * FROM users WHERE username='u1'");
    expect(res.rows.length).toEqual(0);
  });

  /**
   * Test failure when removing non-existent user.
   */
  test("not found if no such user", async function () {
    try {
      await User.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("User Model Tests for JobApplications.applyToJob", function () {
  test("works", async function () {
    const testJobIds = getTestJobIds();
    expect(testJobIds).toBeDefined();
    expect(testJobIds[0]).toBeDefined();

    const jobId = testJobIds[0];

    const result = await JobApplication.apply("u1", jobId);
    expect(result).toEqual({ applied: jobId });

    const found = await db.query(
      "SELECT * FROM applications WHERE username = $1 AND job_id = $2",
      ["u1", jobId]
    );
    expect(found.rows.length).toEqual(1);
  });

  test("not found if no such job", async function () {
    try {
      await JobApplication.apply("u1", 0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("not found if no such user", async function () {
    try {
      const testJobIds = getTestJobIds();
      expect(testJobIds).toBeDefined();
      expect(testJobIds[0]).toBeDefined();
      await JobApplication.apply("nope", testJobIds[0]);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

describe("User.get", function () {
  test("works: get user with job applications", async function () {
    const testJobIds = getTestJobIds();
    expect(testJobIds).toBeDefined();
    expect(testJobIds[0]).toBeDefined();
    expect(testJobIds[1]).toBeDefined();
    const jobId1 = testJobIds[0];
    const jobId2 = testJobIds[1];
    await JobApplication.apply("u1", jobId1);
    await JobApplication.apply("u1", jobId2);

    const user = await User.get("u1");
    expect(user).toEqual({
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "u1@email.com",
      isAdmin: false,
      jobs: [jobId1, jobId2],
    });
  });
});
