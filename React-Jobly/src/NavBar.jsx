import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Navbar, Nav, NavItem } from "reactstrap";
import "./NavBar.css";
import { useJoblyApiState, useJoblyApi } from './JoblyApiContext';

function NavBar() {
  const joblyApi = useJoblyApi();
  const username = useJoblyApiState('username');
  const token = useJoblyApiState('token');
  const [localToken, setLocalToken] = useState(token);
  const [localUsername, setLocalUsername] = useState(username);
  const navigate = useNavigate();

  // First useEffect to handle initial load and token verification
  useEffect(() => {
    const initializeAuth = async () => {
      if (!localToken) {
        await joblyApi.loadToken();
      }
    };
    initializeAuth();
  }, []); // Run only once on component mount

  // Second useEffect to handle user data fetching
  useEffect(() => {
    if (localToken && !localUsername) {
      const fetchUser = async () => {
        try {
          await joblyApi.getUser();
        } catch (err) {
          console.error("Error fetching user:", err);
        }
      };
      fetchUser();
    }
  }, [localToken]); // Only depend on localToken changes

  // Third useEffect to handle subscriptions
  useEffect(() => {
    const tokenObserver = (newToken) => {
      setLocalToken(newToken);
    };
    const usernameObserver = (newUsername) => {
      setLocalUsername(newUsername);
    };

    joblyApi.subscribe('token', tokenObserver);
    joblyApi.subscribe('username', usernameObserver);

    return () => {
      joblyApi.unsubscribe('token', tokenObserver);
      joblyApi.unsubscribe('username', usernameObserver);
    };
  }, [joblyApi]);

  return (
    <div>
      <Navbar expand="md">
        <NavLink exact="true" to="/" className="navbar-brand">
          Jobly
        </NavLink>

        <Nav className="ml-auto" navbar>
          <NavItem>
            <NavLink to="/companies">Companies</NavLink>
          </NavItem>
          <NavItem>
            <NavLink to="/jobs">Jobs</NavLink>
          </NavItem>
          {!token ? (
            <>
              <NavItem>
                <NavLink to="/login">Login</NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/signup">Sign Up</NavLink>
              </NavItem>
            </>
          ) : (
            <>
              <NavItem>
                <NavLink to="/profile">
                  {username || localUsername || 'Loading...'}
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/logout">Log Out</NavLink>
              </NavItem>
            </>
          )}
        </Nav>
      </Navbar>
    </div>
  );
}

export default NavBar;