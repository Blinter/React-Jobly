import React from "react";
import PropTypes from "prop-types";
import { ListGroupItem, Button } from "reactstrap";
import { v4 as uuidv4 } from 'uuid';
import { Link } from "react-router-dom";


function CompanyCard({ company }) {
  return (
    <ListGroupItem key={uuidv4()}>
      <h4>{company.name}</h4>
      <p>{company.description || "None"}</p>
      <p><strong>Employees:</strong> {company.numEmployees || "None"}</p>
      <p>
        <Link to={`/companies/${company.handle}`}>
          <Button variant="primary">Go</Button>
        </Link>
      </p>
    </ListGroupItem>
  );
}

CompanyCard.propTypes = {
  company: PropTypes.object.isRequired,
};

export default CompanyCard;