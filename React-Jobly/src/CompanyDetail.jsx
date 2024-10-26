import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useParams, useNavigate } from "react-router-dom";
import JoblyApi from './JoblyApi';
import { Container, Row, Col, Card, CardBody, CardTitle, CardHeader, CardFooter, Button, ListGroup } from "reactstrap";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

import CompanyJob from './CompanyJob';

function CompanyDetail({ redirectPage, cantFind }) {
  const { id } = useParams();
  const validRequest = id.length;

  const joblyApi = useJoblyApi();
  const user = useJoblyApiState('user');
  const [localUser, setLocalUser] = useState(user);
  const [currentCompany, setCompany] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const observer = (newUser) => setLocalUser(newUser);
    joblyApi.subscribe('user', observer);
    return () => {
      joblyApi.unsubscribe('user', observer);
    };
  }, [joblyApi, setLocalUser]);

  useEffect(() => {
    if (!validRequest)
      navigate(cantFind, { replace: true });

    const fetchCompany = async () => {
      try {
        const response = await JoblyApi.getCompany(id);
        if (!response || !response.company) {
          setCompany([]);
          return;
        }
        setCompany(response.company);
      } catch (error) {
        console.error("Company not found! ", error);
      }
    };
    fetchCompany();
  }, [validRequest, cantFind, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!localUser) {
        try {
          const newUser = await joblyApi.getUser();
          if (!newUser)
            navigate(redirectPage, { replace: true });

          setLocalUser(newUser);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
    }
    fetchData();
  }, [localUser, navigate, redirectPage]);

  const getJobs = () => {
    if (!currentCompany.jobs || !currentCompany.jobs.length)
      return;

    return (
      <>
        <CardBody>
          <Row className="text-bold border-bottom mb-2">
            <Col xs="4">Title</Col>
            <Col xs="3">Salary</Col>
            <Col xs="3">Equity</Col>
            <Col xs="2">Apply</Col>
          </Row>
        </CardBody>
        {currentCompany.jobs.map(job => (
          <CompanyJob key={job.id} job={job} />
        ))}
      </>
    );
  }

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>{currentCompany.name}</h2>
            </CardHeader>
            <CardBody>
              <ListGroup>
                <p>{currentCompany.description}</p>
                <p><strong>Employees:</strong> {currentCompany.numEmployees}</p>
              </ListGroup>
            </CardBody>
          </Card><Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Jobs</h2>
            </CardHeader>
            {getJobs()}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

CompanyDetail.propTypes = {
  redirectPage: PropTypes.string,
  cantFind: PropTypes.string.isRequired,
};

export default CompanyDetail;