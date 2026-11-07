import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:8080/api/auth/login",
        {
          email: email,
          password: password,
        }
      );

        localStorage.setItem("token", response.data);

        setMessage("Login successful!");

        console.log("JWT Token:", response.data);

        navigate("/dashboard");

    } catch (error) {
    console.error("Login error:", error);
    setMessage(
        error.response?.data?.message || "Login failed"
    );
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-5">
          <div className="card shadow">
            <div className="card-body p-4">

              <h2 className="text-center mb-4">
                Inventory Management
              </h2>

              <h4 className="text-center mb-4">
                Login
              </h4>

              <form onSubmit={handleLogin}>

                <div className="mb-3">
                  <label className="form-label">
                    Email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Password
                  </label>

                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100"
                >
                  Login
                </button>

              </form>

              {message && (
                <div className="alert alert-info mt-3">
                  {message}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;