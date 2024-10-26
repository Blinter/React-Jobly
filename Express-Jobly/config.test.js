/**
 * @fileoverview Test suite for configuration module behavior with environment variables.
 * This module contains tests to verify that the configuration settings are correctly
 * read from environment variables and that the database URI is properly set based on
 * the current environment.
 * 
 * @module config.test
 * @requires config
 */

"use strict";

/**
 * Suite to test configuration behavior with environment variables.
 */
describe("config can come from env", function () {
  /**
   * Test case to verify configuration settings based on environment variables.
   *
   * This test checks the behavior of the configuration module when specific
   * environment variables are set. It verifies that the config object correctly
   * maps the expected values from the environment variables and that the
   * `getDatabaseUri` function returns the appropriate database URI for different
   * environments.
   */
  test("works", function () {
    process.env.SECRET_KEY = "abc";
    process.env.PORT = "5000";
    process.env.DATABASE_URL = "other";
    process.env.NODE_ENV = "other";

    const config = require("./config");

    // Check if the secret key is set correctly from environment variables
    expect(config.SECRET_KEY).toEqual("abc");

    // Check if the port is set correctly from environment variables
    expect(config.PORT).toEqual(5000);

    // Verify that the database URI is set correctly based on the environment variable
    expect(config.getDatabaseUri()).toEqual("other");

    // Verify the default bcrypt work factor
    expect(config.BCRYPT_WORK_FACTOR).toEqual(12);

    delete process.env.SECRET_KEY;
    delete process.env.PORT;
    delete process.env.BCRYPT_WORK_FACTOR;
    delete process.env.DATABASE_URL;

    // After deleting environment variables, check the default database URI
    expect(config.getDatabaseUri()).toEqual("postgresql:///jobly");

    process.env.NODE_ENV = "test";

    // Verify the database URI changes to the test database when NODE_ENV is 'test'
    expect(config.getDatabaseUri()).toEqual("postgresql:///jobly_test");
  });
})