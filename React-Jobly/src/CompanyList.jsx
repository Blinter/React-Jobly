import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Container, Row, Col, Card, CardBody, CardTitle, CardHeader, ListGroup, ListGroupItem, Form, FormGroup, Input, Button } from "reactstrap";
import JoblyApi from './JoblyApi';
import CompanyCard from './CompanyCard';
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function CompanyList({ redirectPage }) {
  const [currentSearch, setCurrentSearch] = useState("");
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [currentCompanies, setCompanies] = useState([]);
  const joblyApi = useJoblyApi();

  const token = useJoblyApiState('token');
  const [localToken, setLocalToken] = useState(token);

  const navigate = useNavigate();
  useEffect(() => {
    const observer = (newToken) => setLocalToken(newToken);
    joblyApi.subscribe('token', observer);
    return () => {
      joblyApi.unsubscribe('token', observer);
    };
  }, [joblyApi, setLocalToken]);

  useEffect(() => {
    if (!localToken)
      navigate(redirectPage, { replace: true });
  }, [localToken, navigate, redirectPage]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await JoblyApi.getCompanies(currentSearch);
        if (!response || !response.companies) {
          setCompanies([]);
          return;
        }
        setCompanies(response.companies);
      } catch (error) {
        console.error("Error fetching companies: ", error);
      }
    };
    fetchCompanies();
  }, [searchTrigger]);

  const handleSearch = e => {
    e.preventDefault();
    setSearchTrigger(prev => prev + 1);
  }

  const handleChange = e => {
    setCurrentSearch(e.target.value);
  }

  return (
    <Container>
      <Row className="justify-content-center mb-4">
        <Col md="8">
          <Form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              alignItems: 'center'
            }}>
            <Input
              type="text"
              value={currentSearch}
              onChange={handleChange}
              placeholder="Search companies..."
              style={{ flexGrow: 1 }}
            />
            <Button color="primary" type="submit" style={{ marginLeft: '10px' }}>Search</Button>
          </Form>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col md="8">
          <Card className="my-4">
            <CardHeader className="bg-primary text-white text-center">
              <h2>Companies</h2>
            </CardHeader>
            <CardBody>
              <ListGroup>
                {currentCompanies.map(company => (
                  <CompanyCard
                    key={company.handle}
                    company={company}
                  />
                ))}
              </ListGroup>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

CompanyList.propTypes = {
  redirectPage: PropTypes.string
};

export default CompanyList;