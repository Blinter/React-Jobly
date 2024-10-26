import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function Signup({ redirectPage }) {
  const joblyApi = useJoblyApi();
  const token = useJoblyApiState('token');
  const [localToken, setLocalToken] = useState(token);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate: values => {
      const errors = {};

      // Username validation
      if (!values.username) {
        errors.username = 'Required';
      } else if (values.username.length < 1 || values.username.length > 30) {
        errors.username = 'Must be between 1 and 30 characters';
      }

      // First Name validation
      if (!values.firstName) {
        errors.firstName = 'Required';
      } else if (values.firstName.length < 1 || values.firstName.length > 30) {
        errors.firstName = 'Must be between 1 and 30 characters';
      } else if (!/^[a-zA-Z'-]+$/.test(values.firstName)) {
        errors.firstName = 'Only letters, apostrophes, and hyphens allowed';
      }

      // Last Name validation
      if (!values.lastName) {
        errors.lastName = 'Required';
      } else if (values.lastName.length < 1 || values.lastName.length > 30) {
        errors.lastName = 'Must be between 1 and 30 characters';
      } else if (!/^[a-zA-Z'-]+$/.test(values.lastName)) {
        errors.lastName = 'Only letters, apostrophes, and hyphens allowed';
      }

      // Email validation
      if (!values.email) {
        errors.email = 'Required';
      } else if (values.email.length < 6 || values.email.length > 60) {
        errors.email = 'Must be between 6 and 60 characters';
      } else if (!/^[a-z0-9._%+\-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i.test(values.email)) {
        errors.email = 'Invalid email address';
      }

      // Password validation
      if (!values.password) {
        errors.password = 'Required';
      } else if (values.password.length < 1 || values.password.length > 20) {
        errors.password = 'Must be between 1 and 20 characters';
      }

      // Confirm Password validation
      if (values.password !== values.confirmPassword) {
        errors.confirmPassword = 'Passwords must match';
      }

      return errors;
    },
    onSubmit: async (values) => {
      setIsSubmitted(false);
      try {
        const newToken = await joblyApi.register({
          username: values.username,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email
        });
        if (!newToken) {
          throw new Error("Registration failed");
        }
        setIsSubmitted(true);
        setTimeout(() => {
          setIsSubmitted(false);
          navigate(redirectPage, { replace: true });
        }, 2000);
      } catch (e) {
        console.error("Error during registration:", e);
      }
    },
  });

  useEffect(() => {
    const observer = (newToken) => setLocalToken(newToken);
    joblyApi.subscribe('token', observer);

    return () => {
      joblyApi.unsubscribe('token', observer);
    };
  }, [joblyApi, setLocalToken]);

  useEffect(() => {
    if (localToken) {
      navigate(redirectPage, { replace: true });
    }
  }, [localToken, navigate, redirectPage]);

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Signup</h2>
            </CardHeader>
            <CardBody>
              <Form onSubmit={formik.handleSubmit}>
                <FormGroup>
                  <Label for="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.firstName}
                    autoComplete="given-name"
                  />
                  {formik.errors.firstName && <div>{formik.errors.firstName}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.lastName}
                    autoComplete="family-name"
                  />
                  {formik.errors.lastName && <div>{formik.errors.lastName}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    onChange={formik.handleChange}
                    value={formik.values.username}
                    autoComplete="username"
                  />
                  {formik.errors.username && <div>{formik.errors.username}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                    autoComplete="email"
                  />
                  {formik.errors.email && <div>{formik.errors.email}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                    autoComplete="new-password"
                  />
                  {formik.errors.password && <div>{formik.errors.password}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    onChange={formik.handleChange}
                    value={formik.values.confirmPassword}
                    autoComplete="new-password"
                  />
                  {formik.errors.confirmPassword && <div>{formik.errors.confirmPassword}</div>}
                </FormGroup>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <Button type="submit" color="primary" className="me-2">
                    {isSubmitted ? "Success!" : "Submit"}
                  </Button>
                  <Link to="/login" className="btn btn-secondary">Already registered?</Link>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

Signup.propTypes = {
  redirectPage: PropTypes.string
};

export default Signup;