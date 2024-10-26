/**
 * @fileoverview Test suite for the jobs-related endpoints in the Express application.
 * This module contains test cases for creating, reading, updating, and deleting job postings.
 * It verifies various scenarios including successful operations, unauthorized access, invalid data,
 * and non-existent resources.
 * 
 * @module jobsTest
 * @requires supertest
 * @requires ../db
 * @requires ../app
 * @requires ./_testCommon
 */

"use strict";

const request = require("supertest");
const db = require("../db");
const app = require("../app");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    a1Token,
} = require("./_testCommon");
beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/**
 * Test suite for the POST /jobs endpoint.
 * This block contains test cases for creating new job postings.
 * It verifies successful creation by an admin user and handles
 * invalid scenarios like unauthorized access, missing data fields,
 * invalid data types, and nonexistent company references.
 */
describe("POST /jobs", function () {
    /**
     * New Job Data containing example data points to be used in these tests
     */
    const newJob = {
        title: "New",
        salary: 100000,
        equity: "0.1",
        companyHandle: "c1",
    };

    /**
     * Test case for successfully creating a new job by an admin.
     * Expects a 201 status code and the job object in the response.
     */
    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("Authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "New",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    /**
     * Test case for unauthorized job creation by a non-admin user.
     * Expects a 401 status code.
     */
    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    /**
     * Test case for creating a job with missing data fields.
     * Expects a 400 status code due to bad request.
     */
    test("bad request with missing data", async function () {
        // Attempt to create a job with missing Company Handle requirement.
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New",
                salary: 100000,
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for creating a job with invalid data types.
     * Specifically tests invalid salary value.
     * Expects a 400 status code due to bad request.
     */
    test("bad request with invalid data", async function () {
        // Attempt to create a job with an invalid salary value.
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for creating a job with invalid equity value.
     * Expects a 400 status code due to bad request.
     */
    test("bad request with invalid equity", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                equity: "1.5", // Invalid equity value
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for handling invalid equity during job creation with descriptive failure message.
     * Expects a 400 status code.
     */
    test("fails: test with invalid equity", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 100000,
                equity: "1.5", // Invalid equity
                companyHandle: "c1",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for job creation with a non-existent company handle.
     * Expects a 400 status code due to bad request.
     */
    test("fails: test with non-existent company", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "New Job",
                salary: 100000,
                equity: "0.1",
                companyHandle: "nope",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/**
 * Test suite for the GET /jobs endpoint.
 * This block contains test cases to ensure the retrieval of job listings
 * can be performed with or without filters. The tests verify that
 * all jobs are returned for anonymous access and apply various filters like
 * minimum salary, equity, and title to confirm the correct subset
 * of jobs is returned. It checks for proper handling of invalid filters,
 * ensuring appropriate error responses.
 */
describe("GET /jobs", function () {
    /**
     * Test case for fetching jobs without authentication.
     * Expects a list of all jobs in the response body.
     */
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: [
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
                {
                    id: expect.any(Number),
                    title: "j4",
                    salary: null,
                    equity: null,
                    companyHandle: "c1",
                },
                {
                    id: expect.any(Number),
                    title: "j5",
                    salary: 400000,
                    equity: null,
                    companyHandle: "c2",
                },
                {
                    id: expect.any(Number),
                    title: "j6",
                    salary: null,
                    equity: "0.2",
                    companyHandle: "c3",
                },
                {
                    id: expect.any(Number),
                    title: "j7",
                    salary: null,
                    equity: "1.0",
                    companyHandle: "c1",
                },
            ],
        });
    });

    /**
     * Test case for fetching jobs with salary filtering.
     * Expects a list of jobs where the salary is above the specified minimum.
     */
    test("works: filtering", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 250000 });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 300000,
                    equity: "0",
                    companyHandle: "c3",
                },
                {
                    id: expect.any(Number),
                    title: "j5",
                    salary: 400000,
                    equity: null,
                    companyHandle: "c2",
                },
            ],
        });
    });

    /**
     * Test case for fetching jobs based on multiple filters:
     * minSalary, hasEquity, and title.
     * Expects a specific job that satisfies all criteria.
     */
    test("works: filtering on all filters", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 150000, hasEquity: true, title: "j2" });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 200000,
                    equity: "0.2",
                    companyHandle: "c2",
                },
            ],
        });
    });

    /**
     * Test case for filtering with an invalid filter key.
     * Expects a 400 status code indicating a bad request.
     */
    test("bad request if invalid filter key", async function () {
        // Combines a valid filter key and value with a filter Key:Value pair that is not accepted.
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 2, nope: "nope" });
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for filtering jobs by title using a 'titleLike' parameter.
     * Expects a list of jobs with titles that match the pattern.
     */
    test("works: filter by titleLike", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ titleLike: "J" });
        expect(resp.body).toEqual({
            jobs: [
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
                {
                    id: expect.any(Number),
                    title: "j4",
                    salary: null,
                    equity: null,
                    companyHandle: "c1",
                },
                {
                    id: expect.any(Number),
                    title: "j5",
                    salary: 400000,
                    equity: null,
                    companyHandle: "c2",
                },
                {
                    id: expect.any(Number),
                    title: "j6",
                    salary: null,
                    equity: "0.2",
                    companyHandle: "c3",
                },
                {
                    id: expect.any(Number),
                    title: "j7",
                    salary: null,
                    equity: "1.0",
                    companyHandle: "c1",
                },
            ],
        });
    });

    /**
     * Test case for filtering jobs where hasEquity parameter is true.
     * Expects all returned jobs to have an equity greater than 0.
     */
    test("works: filtering with hasEquity true", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ hasEquity: true });
        expect(resp.body.jobs.every(j => j.equity > 0)).toBe(true);
        expect(resp.body.jobs.length).toBeGreaterThan(0);
    });

    /**
     * Test case for filtering jobs where hasEquity parameter is false.
     * Expects returned jobs to either have no equity or an equity of "0".
     */
    test("works: filtering with hasEquity false", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ hasEquity: false });
        expect(resp.body.jobs.some(j => j.equity === null || j.equity === "0")).toBe(true);
    });

    /**
     * Test case for filtering jobs using multiple parameters:
     * minSalary, hasEquity, and titleLike.
     * Expects all returned jobs to match given criteria and non-empty response.
     */
    test("works: filtering with multiple parameters", async function () {
        const resp = await request(app)
            .get("/jobs")
            .query({ minSalary: 150000, hasEquity: true, titleLike: "j" });
        expect(resp.body.jobs.every(j => j.salary >= 150000 && j.equity > 0 && j.title.toLowerCase().includes('j'))).toBe(true);
        expect(resp.body.jobs.length).toBeGreaterThan(0);
    });
});

/**
 * Test suite for the GET /jobs/:id endpoint.
 * This block contains test cases to ensure the retrieval of job details
 * can be performed by any user, returning the correct job details based on the ID.
 * It also includes test scenarios for non-existent job IDs and invalid ID formats,
 * verifying the expected error responses (404 for not found and 400 for bad request).
 */
describe("GET /jobs/:id", function () {
    /**
     * Test the retrieval of a job by its ID for an anonymous user.
     * Expects the correct job details to be returned in the response.
     */
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
            job: {
                id: "1",
                title: "j1",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    /**
     * Test the retrieval of a job with an ID that doesn't exist.
     * Expects a 404 status code indicating not found.
     */
    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });

    /**
     * Test the handling of an invalid job ID format.
     * Expects a 400 status code indicating a bad request.
     */
    test("bad request for invalid job ID", async function () {
        const resp = await request(app).get(`/jobs/invalid`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test the retrieval of a job with an ID that doesn't exist in the system.
     * Expects a 404 status code indicating not found.
     */
    test("not found for job doesn't exist", async function () {
        const resp = await request(app).get(`/jobs/99999`);
        expect(resp.statusCode).toEqual(404);
    });
});

/**
 * Test suite for the PATCH /jobs/:id endpoint.
 * This block contains test cases to verify that job updates can be
 * successfully made by an admin, while unauthorized users are blocked.
 * It also includes test scenarios such as updating nonexistent jobs,
 * handling invalid input data, and ensuring the correct job details
 * are returned after a successful update.
 */
describe("PATCH /jobs/:id", function () {

    /**
     * Test case for updating a job's title by an admin user.
     * Expects the job's title to be updated and the correct job object in the response.
     */
    test("works for admin", async function () {
        // Update a job by using an Administrator's token and verify that the job's data has been updated
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "J1-new",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "J1-new",
                salary: 100000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    /**
     * Test case for updating a job by a non-admin user.
     * Expects a 401 status code indicating unauthorized access.
     */
    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "J1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    /**
     * Test case for updating a non-existent job.
     * Expects a 404 status code indicating the job was not found.
     */
    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    /**
     * Test case for updating a job with invalid data.
     * Expects a 400 status code due to invalid data being sent.
     */
    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "not-a-number",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for updating a job without providing data.
     * Expects a 400 status code indicating a bad request due to no data.
     */
    test("bad request with no data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({})
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for successfully updating a job's salary.
     * Expects the job's salary to be updated and the correct job object in the response.
     */
    test("works: can update salary", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: 150000,
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "j1",
                salary: 150000,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    /**
     * Test case for successfully updating a job's equity.
     * Expects the job's equity to be updated and the correct job object in the response.
     */
    test("works: can update equity", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                equity: "0.2",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "j1",
                salary: 100000,
                equity: "0.2",
                companyHandle: "c1",
            },
        });
    });

    /**
     * Test case for attempting to update a job's equity to an invalid value.
     * Expects a 400 status code due to invalid equity value.
     */
    test("fails: invalid equity update", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                equity: "1.5",
            })
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/**
 * Test suite for the DELETE /jobs/:id endpoint.
 * This block contains test cases to ensure that the deletion of a job
 * can be performed successfully by an admin, while unauthorized users are blocked,
 * and handles edge cases like non-existent jobs or invalid job IDs.
 */
describe("DELETE /jobs/:id", function () {
    /**
     * Test case for successfully deleting a job by an admin.
     * Expects a response indicating the job was deleted.
     */
    test("works for admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.body).toEqual({ deleted: "1" });
    });

    /**
     * Test case for unauthorized deletion attempt by a non-admin user.
     * Expects a 401 status code indicating unauthorized access.
     */
    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    /**
     * Test case for attempting to delete a non-existent job.
     * Expects a 404 status code indicating not found.
     */
    test("not found for no such job", async function () {
        await db.query("DELETE FROM jobs");

        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    /**
     * Test case for attempting to delete a job with an invalid ID format.
     * Expects a 400 status code indicating a bad request.
     */
    test("bad request for invalid job ID", async function () {
        const resp = await request(app)
            .delete(`/jobs/invalid`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    /**
     * Test case for attempt to delete a job that does not exist.
     * Expects a 404 status code indicating not found.
     */
    test("fails: test non-existent job", async function () {
        const resp = await request(app)
            .delete(`/jobs/99999`)
            .set("authorization", `Bearer ${a1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
