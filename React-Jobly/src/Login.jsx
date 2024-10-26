import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';
import PropTypes from "prop-types";

function Login({ redirectPage }) {
  const joblyApi = useJoblyApi();
  const token = useJoblyApiState('token');
  const [localToken, setLocalToken] = useState(token);

  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validate: values => {
      const errors = {};
      if (!values.username)
        errors.username = 'Required';
      else if (values.username.length < 3)
        errors.username = 'Must be 3 characters or more';
      if (!values.password)
        errors.password = 'Required';
      else if (values.password.length < 3)
        errors.password = 'Must be 3 characters or more';
      return errors;
    },
    onSubmit: async (values) => {
      try {
        const newToken = await joblyApi.login(values);
        if (!newToken)
          throw new Error("Undefined result");

        joblyApi.setState({ token: newToken });
        navigate(redirectPage, { replace: true });
      } catch (e) {
        console.debug("There was an error logging in using the JoblyApi");
        console.error(e);
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
    if (token)
      navigate(redirectPage, { replace: true });
  }, [token, navigate, redirectPage]);


  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Login</h2>
            </CardHeader>
            <CardBody>
              <Form onSubmit={formik.handleSubmit}>
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
                  {formik.errors.username ?
                    <div>{formik.errors.username}</div> :
                    null}
                </FormGroup>
                <FormGroup>
                  <Label for="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    onChange={formik.handleChange}
                    value={formik.values.password}
                    autoComplete="current-password"
                  />
                  {formik.errors.password ?
                    <div>{formik.errors.password}</div> :
                    null}
                </FormGroup>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                  <Button type="submit" color="primary">Login</Button>
                  <Link to="/signup" className="btn btn-secondary">Not registered?</Link>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

Login.propTypes = {
  redirectPage: PropTypes.string
};


export default Login;