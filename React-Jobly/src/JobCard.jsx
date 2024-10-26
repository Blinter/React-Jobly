import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { ListGroupItem, Button, CardBody, Row, Col } from "reactstrap";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function JobCard({ job }) {
  const joblyApi = useJoblyApi();
  const jobs = useJoblyApiState('jobs');
  const [localJobs, setLocalJobs] = useState(jobs);
  const [isApplied, setIsApplied] = useState(joblyApi.jobApplied(job.id));
  useEffect(() => {
    const observer = (currentJobs) => setLocalJobs(currentJobs);
    joblyApi.subscribe('jobs', observer);
    return () => {
      joblyApi.unsubscribe('jobs', observer);
    };
  }, [joblyApi, localJobs]);

  const handleClick = async () => {
    if (isApplied)
      return;
    try {
      setIsApplied(true);
      const result = await joblyApi.applyJob({ jobId: job.id });
      if (result)
        setLocalJobs(result);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <CardBody key={job.id} className="border-bottom py-2">
      <Row className="align-items-center">
        <Col xs="4"><h5>{job.title}</h5></Col>
        <Col xs="3">{job.salary || "None"}</Col>
        <Col xs="3">{job.equity || "None"}</Col>
        <Col xs="2">
          {isApplied || (job.id && joblyApi.jobApplied(job.id)) ?
            <p style={{ color: 'gray', fontSize: '14px' }}
              className="sm">Applied
            </p>
            : <Button
              type="submit"
              color="primary"
              className="me-2"
              onClick={handleClick}>Apply
            </Button>
          }
        </Col>
      </Row>
    </CardBody>
  );
}

JobCard.propTypes = {
  job: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ]).isRequired,
    title: PropTypes.string.isRequired,
    salary: PropTypes.number,
    equity: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number
    ])
  }),
};

export default JobCard;