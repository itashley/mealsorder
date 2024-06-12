import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "../utils/axios"; // Adjust this import as per your file structure
import { setUserSession } from "../utils/Common"; // Adjust this import as per your file structure
import Swal from "sweetalert2";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const cardStyle = {
    width: "24rem",
    maxWidth: "100%",
    color: "#fff",
    fontSize: "11px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    border: "none",
  };

  const inputStyle = {
    fontSize: "11px",
  };

  const backgroundStyle = {
    background: "linear-gradient(135deg, #40403e, #646463)",
    height: "100vh",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/auth", { email, password });
      console.log("response data: ", response.data);

      if (response.status === 200) {
        setUserSession(response.data.token, response.data.user);
        history.push("/dashboard");
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      Swal.fire({
        icon: "error",
        title: "Authorization Failed",
        text:
          err.response && err.response.data && err.response.data.message
            ? err.response.data.message
            : err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={backgroundStyle}
      className="d-flex justify-content-center align-items-center"
    >
      <div className="card p-4" style={cardStyle}>
        <div className="card-body">
          <h5 className="card-title text-center mb-4">Login</h5>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                style={inputStyle}
                className="form-control"
                id="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                style={inputStyle}
                className="form-control"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
