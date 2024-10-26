import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import PropTypes from "prop-types";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function Profile({ redirectPage }) {
  const joblyApi = useJoblyApi();
  const token = useJoblyApiState('token');
  const user = useJoblyApiState('user');
  const username = useJoblyApiState('username');


  const [localToken, setLocalToken] = useState(token);
  const [localUser, setLocalUser] = useState(user);
  const [localUsername, setLocalUsername] = useState(username);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(!joblyApi.isUserDataReady());

  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      firstName: (localUser && localUser.firstName) || '',
      lastName: (localUser && localUser.lastName) || '',
      email: (localUser && localUser.email) || '',
      password: '',
      confirmPassword: ''
    },
    validate: values => {
      const errors = {};

      // First Name validation
      if (!values.firstName) {
        errors.firstName = 'Required';
      } else if (values.firstName.length > 30) {
        errors.firstName = 'Must be 30 characters or less';
      } else if (!/^[a-zA-Z'-]+$/.test(values.firstName)) {
        errors.firstName = 'Only letters, apostrophes, and hyphens allowed';
      }

      // Last Name validation
      if (!values.lastName) {
        errors.lastName = 'Required';
      } else if (values.lastName.length > 30) {
        errors.lastName = 'Must be 30 characters or less';
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
      } else if (values.password.length < 5 || values.password.length > 20) {
        errors.password = 'Must be between 5 and 20 characters';
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
        const newUser = await joblyApi.update(values);
        if (!newUser)
          throw new Error("newUser is undefined or null!");
        setIsSubmitted(true);
        setTimeout(() => setIsSubmitted(false), 3000);
      } catch (e) {
        console.error(e);
      }
    },
  });

  useEffect(() => {
    const observer = (newToken) => setLocalToken(newToken);
    const observer2 = (newUser) => setLocalUser(newUser);
    const observer3 = (newUsername) => setLocalUsername(newUsername);
    joblyApi.subscribe('token', observer);
    joblyApi.subscribe('user', observer2);
    joblyApi.subscribe('username', observer3);

    return () => {
      joblyApi.unsubscribe('token', observer);
      joblyApi.unsubscribe('user', observer2);
      joblyApi.unsubscribe('username', observer3);
    };
  }, [joblyApi, setLocalUser, setLocalToken, setLocalUsername]);

  useEffect(() => {
    if (!localToken) {
      navigate(redirectPage, { replace: true });
    } else if (!localUser) {
      const fetchUser = async () => {
        try {
          await joblyApi.getUser();
        } catch (err) {
          console.error("Error fetching user:", err);
          setIsLoading(false);
        }
      };

      fetchUser();

      // Set a timeout to prevent indefinite loading
      const timer = setTimeout(() => {
        if (isLoading) {
          console.warn("Taking too long to load...");
          setIsLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [localToken, localUser, navigate, redirectPage, joblyApi]);

  useEffect(() => {
    async function fetchData() {
      if (!localToken)
        return;
      if (!localUser) {
        try {
          const newUser = await joblyApi.getUser();
          formik.setValues({
            firstName: newUser.firstName || '',
            lastName: newUser.lastName || '',
            email: newUser.email || '',
            password: '',
            confirmPassword: ''
          });
          setIsLoading(false);
          setLocalUser(newUser);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    }
    fetchData();
  }, [localToken, user, joblyApi]);


  useEffect(() => {
    if (localUser) {
      formik.setValues({
        firstName: localUser.firstName || '',
        lastName: localUser.lastName || '',
        email: localUser.email || '',
        password: '',
        confirmPassword: ''
      });
    }
  }, [localUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Edit: {localUsername ? localUsername : 'Profile'}</h2>
            </CardHeader>
            <CardBody className="text-center">
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
                  <Label for="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    onChange={formik.handleChange}
                    value={formik.values.email}
                    autoComplete="email"
                  />
                  {formik.errors.email ? <div>{formik.errors.email}</div> : null}
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
                  {formik.errors.password ? <div>{formik.errors.password}</div> : null}
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
                  {formik.errors.confirmPassword ?
                    <div>{formik.errors.confirmPassword}</div> :
                    null}
                </FormGroup>
                <Button type="submit" color={!isSubmitted ? "primary" : "success"} className="me-2" style={{ fontSize: 'larger' }}>
                  {isSubmitted ? "Success!" : "Submit"}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

Profile.propTypes = {
  redirectPage: PropTypes.string
};

export default Profile;