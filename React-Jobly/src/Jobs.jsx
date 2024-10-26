import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Card, CardBody, CardTitle, CardHeader, CardFooter, Button } from "reactstrap";

function Jobs() {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Jobs</h2>
            </CardHeader>
            <CardBody className="text-center">
              <CardTitle>
                <h3 className="font-weight-bold">Test</h3>
              </CardTitle>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Jobs;