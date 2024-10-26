import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Home";
import CompanyList from "./CompanyList";
import CompanyDetail from "./CompanyDetail";
import JobList from "./JobList";
import Login from "./Login";
import Signup from "./Signup";
import Profile from "./Profile";
import Logout from './Logout';
import NavBar from "./NavBar";
import { JoblyApiProvider } from './JoblyApiContext';


import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  return (
    <JoblyApiProvider>
      <div className="App">
        <BrowserRouter>
          <NavBar />
          <main>
            <Routes>
              <Route
                path="/"
                element={<Home />}
              />
              <Route
                path="/companies"
                element={<CompanyList 
                  redirectPage="/login" 
                  title="Companies" />}
              />
              <Route
                path="/companies/:id"
                element={<CompanyDetail 
                  redirectPage="/login" 
                  cantFind="/companies" />}
              />
              <Route
                path="/jobs"
                element={<JobList redirectPage="/login" />}
              />
              <Route
                path="/login"
                element={<Login redirectPage="/profile" />}
              />
              <Route
                path="/signup"
                element={<Signup redirectPage="/profile" />}
              />
              <Route
                path="/profile"
                element={<Profile redirectPage="/login" />}
              />
              <Route
                path="/logout"
                element={<Logout redirectPage="/" />}
              />
              <Route
                path="*"
                element={<p>Not Found!</p>}
              />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </JoblyApiProvider>
  );
}

export default App;