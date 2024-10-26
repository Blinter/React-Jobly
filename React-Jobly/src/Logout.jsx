import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { Container, Row, Col, Card, CardBody, CardHeader, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';
import PropTypes from "prop-types";

function Logout({ redirectPage }) {
  const joblyApi = useJoblyApi();
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await joblyApi.logout();
        navigate(redirectPage, { replace: true });
      } catch (error) {
        console.error("Logout error:", error);
        // Optionally, you could show an error message to the user here
      }
    };
    handleLogout();
  }, [joblyApi, navigate, redirectPage]);

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Logged Out</h2>
            </CardHeader>
            <CardBody>
              You are logged out!
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

Logout.propTypes = {
  redirectPage: PropTypes.string
};


export default Logout;