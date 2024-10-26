/**
 * @fileoverview Test suite for user-related operations.
 * This module provides tests for creating, reading, updating, and deleting user information.
 * It includes functionality for testing user authentication and authorization.
 * 
 * @module usersTest
 * @requires supertest
 * @requires ../app
 * @requires ../models/user
 * @requires ./_testCommon
 */

"use strict";

const request = require("supertest");
const app = require("../app");
const User = require("../models/user");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**
 * Test suite for user creation via POST /users
 */
describe("POST /users", function () {
  /**
   * Test creating a non-admin user by an admin
   */
  test("works for admins: create non-admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: false,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      },
      token: expect.any(String),
    });
  });

  /**
   * Test creating an admin user by an admin
   */
  test("works for admins: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      },
      token: expect.any(String),
    });
  });

  /**
   * Test that non-admin users cannot create users
   */
  test("not allowed to create for non-admin users", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: false,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that non-admin users cannot create admin users
   */
  test("does not work for users: create admin", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).not.toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  /**
   * Test that anonymous users cannot create users
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that a bad request is returned if data is missing
   */
  test("bad request if missing data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test that a bad request is returned if data is invalid
   */
  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "not-an-email",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test that admin cannot create user with invalid data
   */
  test("fails: admin can't create user with invalid data", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "not-an-email",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test that non-admin cannot create admin user
   */
  test("fails: non-admin can't create admin user", async function () {
    const resp = await request(app)
      .post("/users")
      .send({
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        password: "password-new",
        email: "new@email.com",
        isAdmin: true,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/**
 * Test suite for GET /users
 */
describe("GET /users", function () {

  /**
   * Test that admin can get all users
   */
  test("works for admin", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      users: [
        {
          username: "a1",
          firstName: "a1F",
          lastName: "a1L",
          email: "admin1@user.com",
          isAdmin: true,
        },
        {
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        }
      ],
    });
  });

  /**
   * Test that anonymous users cannot get all users
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .get("/users");
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that error handler works with route
   */
  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    jest.spyOn(User, 'findAll').mockImplementation(() => {
      throw new Error('Test error');
    });


    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(500);
    // Restore the original table name
    User.findAll.mockRestore();
  });

  /**
   * Test that non-admin cannot get all users
   */
  test("fails: non-admin can't get all users", async function () {
    const resp = await request(app)
      .get("/users")
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/**
 * Test suite for GET /users/:username
 */
describe("GET /users/:username", function () {

  /**
   * Test that user can get their own information
   */
  test("works for own user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: expect.any(Array),
      },
    });
  });

  /**
   * Test that anonymous users cannot get user information
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that non-admin cannot access any other user's info
   */
  test("not allowed if user not admin or self", async function () {
    const resp = await request(app)
      .get(`/users/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that non-admin cannot access actual other user's info
   */
  test("fails: user can't access other user's info", async function () {
    const resp = await request(app)
      .get(`/users/u2`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that admin can access other user's info
   */
  test("works for admin accessing other user", async function () {
    const resp = await request(app)
      .get(`/users/u1`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
        jobs: expect.any(Array),
      },
    });
  });
});

/**
 * Test suite for PATCH /users/:username
 */
describe("PATCH /users/:username", () => {
  /**
   * Test that user can update their own data
   */
  test("works for users", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  /**
   * Test that un-authenticated user cannot update another user's info
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New",
      });
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that an authenticated non-admin user cannot update any other user's information
   */
  test("not allowed if not user", async function () {
    const resp = await request(app)
      .patch(`/users/nope`)
      .send({
        firstName: "Nope",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that user cannot update their profile with invalid data
   */
  test("bad request if invalid data", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: 42,
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  /**
   * Test that user can update their password
   */
  test("works: set new password", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        password: "new-password",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
    const isSuccessful = await User.authenticate("u1", "new-password");
    expect(isSuccessful).toBeTruthy();
  });

  /**
   * Test that admin can update another user
   */
  test("works for admin updating other user", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        firstName: "New-admin-set",
      })
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({
      user: {
        username: "u1",
        firstName: "New-admin-set",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  /**
   * Test that non-admin cannot update other user's data
   */
  test("fails: user can't update other user's info", async function () {
    const resp = await request(app)
      .patch(`/users/u2`)
      .send({
        firstName: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that non-admin cannot update their own data with invalid info
   */
  test("fails: invalid update fields", async function () {
    const resp = await request(app)
      .patch(`/users/u1`)
      .send({
        invalidField: "New",
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});


/**
 * Test suite for DELETE /users/:username
 */
describe("DELETE /users/:username", function () {
  /**
   * Test authenticated user can delete their own account
   */
  test("works for user deleting their own account", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });
  /**
   * Test that an authenticated user can delete their own account
   */
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  /**
   * Test that anonymous users cannot delete users
   */
  test("unauth for anon", async function () {
    const resp = await request(app)
      .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that users are not authorized if they try to delete a non-existent user
   */
  test("unauthorized if incorrect user", async function () {
    const resp = await request(app)
      .delete(`/users/nope`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that admin can delete other users
   */
  test("works for admin deleting other user", async function () {
    const resp = await request(app)
      .delete(`/users/u1`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
  });

  /**
   * Test that a non-admin user cannot delete other users' accounts.
   */
  test("fails: user can't delete other user", async function () {
    const resp = await request(app)
      .delete(`/users/u2`)
      .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  /**
   * Test that a request to delete a non-existent user fails with a 404 status code
   */
  test("fails: invalid username", async function () {
    const resp = await request(app)
      .delete(`/users/nonexistent`)
      .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

});
