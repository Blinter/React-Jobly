/**
 * @fileoverview Express application setup and configuration.
 * This module sets up the main Express application, configures middleware,
 * defines routes, and sets up error handling for the Jobly API.
 * 
 * @module app
 * @requires express
 * @requires cors
 * @requires ./expressError
 * @requires ./middleware/auth
 * @requires ./routes/auth
 * @requires ./routes/companies
 * @requires ./routes/users
 * @requires ./routes/jobs
 * @requires morgan
 */

"use strict";

const express = require("express");
const cors = require("cors");
const { NotFoundError } = require("./expressError");
const { authenticateJWT } = require("./middleware/auth");
const authRoutes = require("./routes/auth");
const companiesRoutes = require("./routes/companies");
const usersRoutes = require("./routes/users");
const jobsRoutes = require("./routes/jobs");
const morgan = require("morgan");

/**
 * Express application instance.
 * @type {express.Application}
 */
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));
app.use(authenticateJWT);
app.use("/auth", authRoutes);
app.use("/companies", companiesRoutes);
app.use("/users", usersRoutes);
app.use("/jobs", jobsRoutes);

/**
 * Handles 404 errors for undefined routes.
 * This middleware matches everything not matched by previous routes.
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @throws {NotFoundError} Throws a NotFoundError for any unmatched route
 */
app.use(function (req, res, next) {
  return next(new NotFoundError());
});

/**
 * Generic error handler for the application.
 * Handles any errors that weren't caught by previous error handlers.
 * 
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {Object} JSON response with error details
 */
app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== "test")
    console.error(err.stack);
  const status = err.status || 500;
  const message = err.message;

  return res.status(status).json({
    error: { message, status },
  });
});

module.exports = app;
