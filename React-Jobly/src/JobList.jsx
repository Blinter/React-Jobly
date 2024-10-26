import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Container, Row, Col, Card, CardBody, CardTitle, CardHeader, ListGroup, ListGroupItem, Form, FormGroup, Input, Button } from "reactstrap";
import JoblyApi from './JoblyApi';
import JobCard from './JobCard';
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function JobList({ redirectPage }) {
    const joblyApi = useJoblyApi();
    const user = useJoblyApiState('user');
    const [localUser, setLocalUser] = useState(user);

    const [currentSearch, setCurrentSearch] = useState("");
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [currentJobs, setJobs] = useState([]);

    const navigate = useNavigate();
    useEffect(() => {
        const observer = (newUser) => setLocalUser(newUser);
        joblyApi.subscribe('user', observer);
        return () => {
            joblyApi.unsubscribe('user', observer);
        };
    }, [joblyApi, setLocalUser]);

    useEffect(() => {
      if (!localUser)
        navigate(redirectPage, { replace: true });
    }, [localUser, navigate, redirectPage]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await JoblyApi.getJobs(currentSearch);
                if (!response || !response.jobs) {
                    setJobs([]);
                    return;
                }
                setJobs(response.jobs);
            } catch (error) {
                console.error("Error fetching jobs: ", error);
            }
        };
        fetchJobs();
    }, [searchTrigger]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchTrigger(prev => prev + 1);
    }

    const handleChange = (e) => {
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
                            placeholder="Search jobs..."
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
                            <h2>Jobs</h2>
                        </CardHeader>
                        <CardBody>
                            <Row className="text-bold border-bottom mb-2">
                                <Col xs="4">Title</Col>
                                <Col xs="3">Salary</Col>
                                <Col xs="3">Equity</Col>
                                <Col xs="2">Apply</Col>
                            </Row>
                        </CardBody>
                        <CardBody>
                            <ListGroup>
                                {currentJobs.map(job => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
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

JobList.propTypes = {
  redirectPage: PropTypes.string
};

export default JobList;