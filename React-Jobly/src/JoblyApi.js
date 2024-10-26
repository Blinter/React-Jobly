import axios from "axios";
import { jwtDecode } from "jwt-decode";


const BASE_URL = "http://localhost:3001";

/** API Class.
 *
 * Static class tying together methods used to get/send to to the API.
 * There shouldn't be any frontend-specific stuff here, and there shouldn't
 * be any API-aware stuff elsewhere in the frontend.
 *
 */

class JoblyApi {
  static instance;

  constructor() {
    if (!JoblyApi.instance) {
      JoblyApi.instance = this;
      this.state = {
        token: null,
        username: null,
        user: null,
        isAdmin: null,
        jobs: [],
      };
      this.observers = {};
      this.loadToken();

    }
    return JoblyApi.instance;
  }

  async loadToken() {
    const token = localStorage.getItem('joblyToken');
    if (token) {
      this.setState({ token });
      await this.decodeToken();
      return true;
    }
    return false;
  }

  async decodeToken() {
    if (this.state.token) {
      try {
        const decoded = jwtDecode(this.state.token);
        this.setState({
          username: decoded.username,
          isAdmin: decoded.isAdmin
        });
        await this.getUser();
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }

  saveToken(token) {
    localStorage.setItem('joblyToken', token);
    this.setState({ token });
    this.decodeToken();
  }

  removeToken() {
    localStorage.removeItem('joblyToken');
    this.setState({ token: null, username: null, isAdmin: null, jobs: null });
  }

  subscribe(eventType, observer) {
    if (!this.observers[eventType]) {
      this.observers[eventType] = [];
    }
    this.observers[eventType].push(observer);
  }

  unsubscribe(eventType, observer) {
    if (this.observers[eventType]) {
      const index = this.observers[eventType].indexOf(observer);
      if (index > -1) {
        this.observers[eventType].splice(index, 1);
      }
    }
  }

  notify(eventType, newValue) {
    if (this.observers[eventType]) {
      const valueToNotify = newValue === null ? this.state[eventType] : newValue;
      this.observers[eventType].forEach(observer => observer(valueToNotify));
    }
  }

  setState(newState) {
    Object.assign(this.state, newState);
    Object.keys(newState).forEach(key => this.notify(key, newState[key]));
  }

  isUserDataReady = () =>
    Boolean(this.state.token && this.state.user);


  async request(endpoint, data = {}, method = "get") {
    // console.debug("API Call:", endpoint, data, method);

    const url = `${BASE_URL}/${endpoint}`;

    // if (this.state.token)
    //   console.log("Sending Token", this.state.token);
    const headers = { Authorization: `Bearer ${this.state.token}` };

    const params = (method === "get")
      ? data
      : {};

    try {
      return (await axios({ url, method, data, params, headers })).data;
    } catch (err) {
      console.error("API Error:", err.response);
      let message = err.response.data.error.message;
      throw Array.isArray(message) ? message : [message];
    }
  }

  async applyJob({ jobId }) {
    if (!jobId)
      throw new Error("Can't apply to job since job ID passed is null.");

    if (!this.state.token)
      throw new Error("Can't apply to job due to no token in state.");

    if (!this.state.username)
      throw new Error("Can't apply ot job since username is not in state.");

    const result = await this.request(
      `users/${this.state.username}/jobs/${jobId}`, {}, "post");
    if (!result || !result.applied) {
      console.error(result);
      console.log(result.error);
      throw new Error("Apply Failed");
    }
    this.setState({
      jobs: [...(this.state.jobs || []), jobId]
    });
    this.notify('jobs', this.state.jobs);
    return this.state.jobs;
  }

  jobApplied = id => {
    if (!this.state.token ||
      !this.state.user ||
      !Array.isArray(this.state.jobs))
      return false;

    const foundJobApplication = this.state.jobs.find(jobId =>
      jobId === id);

    return !!foundJobApplication;
  }

  async getUser() {
    if (!this.state.token)
      throw new Error("No valid token available");

    const userData = await this.request(`users/${this.state.username || ''}`);
    if (!userData.user)
      throw new Error("User not found!");
    const user = userData.user;
    const { username, email, firstName, lastName, isAdmin, jobs } = user;

    this.setState({
      username,
      user: {
        email,
        firstName,
        lastName,
      },
      isAdmin,
      jobs
    });
    this.notify('username', username);
    this.notify('user', this.state.user);
    this.notify('isAdmin', isAdmin);
    this.notify('jobs', jobs);

    return this.state.user;
  }

  async register({
    username,
    password,
    firstName,
    lastName,
    email
  }) {
    if (this.state.token)
      throw new Error("Valid token already stored. No need to register.");
    const result = await this.request(`auth/register`, {
      username,
      password,
      firstName,
      lastName,
      email
    }, "post");

    if (!result || !result.token) {
      console.error(result);
      console.log(result.error);
      throw new Error("Registration Failed");
    }

    this.setState({
      token: result.token,
      username: username
    });
    this.notify('token', result.token);

    this.saveToken(result.token);
    return this.state.token;
  }

  async login({ username, password }) {
    if (this.state.token)
      throw new Error("Valid token already stored. No need to auth.");
    const result = await this.request(`auth/token`, {
      username,
      password
    }, "post");
    if (!result) {
      console.error(result);
      console.log(result.error);
      throw new Error("Login Failed");
    }
    this.setState({
      token: result.token,
      username: username
    });
    this.notify('token', result.token);
    this.saveToken(result.token);
    return this.state.token;
  }

  async update({ firstName, lastName, email, password }) {
    if (!this.state.token)
      throw new Error("No token to update user.");

    if (!this.state.username)
      throw new Error("No username stored to update user.");

    const result = await this.request(`users/${this.state.username}`, {
      firstName,
      lastName,
      email,
      password
    }, "patch");

    if (!result) {
      console.error(result);
      console.log(result.error);
      throw new Error("Login Failed");
    }

    this.setState({
      user: {
        firstName,
        lastName,
        email
      },
    });
    this.notify('user', this.state.user);
    return this.state.user;
  }

  logout() {
    this.removeToken();
    this.setState({
      user: null
    });

    this.notify('token', null);
    this.notify('username', null);
    this.notify('user', null);
    this.notify('isAdmin', null);
    this.notify('jobs', null);
  }

  // Individual API routes
  static getInstance() {
    if (!JoblyApi.instance)
      JoblyApi.instance = new JoblyApi();
    return JoblyApi.instance;
  }

  static getCompany = async (handle) =>
    await this.getInstance().request(`companies/${handle}`);

  static getCompanies = async (nameLike = "") =>
    nameLike.length === 0 ?
      await this.getInstance().request(`companies`) :
      await this.getInstance().request(`companies`, { nameLike });

  static getJobs = async (nameLike = "") =>
    nameLike.length === 0 ?
      await this.getInstance().request(`jobs`) :
      await this.getInstance().request(`jobs`, { titleLike: nameLike });

  static getJob = async (id) =>
    await this.getInstance().request(`jobs`, { title: id });

}

// for now, put token ("testuser" / "password" on class)
// JoblyApi.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZ" +
//   "SI6InRlc3R1c2VyIiwiaXNBZG1pbiI6ZmFsc2UsImlhdCI6MTU5ODE1OTI1OX0." +
//   "FtrMwBQwe6Ue-glIFgz_Nf8XxRT2YecFCiSpYL0fCXc";

export default JoblyApi;