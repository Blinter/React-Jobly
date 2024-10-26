import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col, Card, CardBody, CardTitle, CardHeader, CardFooter, Button } from "reactstrap";

function Home() {
  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Welcome to Jobly</h2>
            </CardHeader>
            <CardBody className="text-center">
              <CardTitle>
                <h3 className="font-weight-bold">Authentication Demo</h3>
              </CardTitle>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;