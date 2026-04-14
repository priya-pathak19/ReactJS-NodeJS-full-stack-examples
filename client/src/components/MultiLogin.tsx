import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  provider?: string;
};

const Login = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:3000";

  const login = (provider: string) => {
    window.location.href = `${BACKEND_URL}/auth/${provider}`;
  };

  const fetchUser = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      // ⚠️ IMPORTANT FIX (you missed this)
      setUser(data);
    } catch (err) {
      console.error(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ⏳ Loading state (important for OAuth redirect flow)
  if (loading) {
    return <div>Loading...</div>;
  }

  // 🔐 Not logged in
  if (!user) {
    return (
      <div>
        <h2>Login</h2>

        <button onClick={() => login("microsoft")}>
          🔐 Login with Microsoft
        </button>

        <br />
        <br />

        <button onClick={() => login("slack")}>🔐 Login with Slack</button>
      </div>
    );
  }

  // ✅ Logged in
  return (
    <div style={{ color: "black" }}>
      <h2>Welcome {user.name}</h2>
      <p>{user.email}</p>
      <p>
        Logged in via: <b>{user.provider || "Unknown"}</b>
      </p>

      <br />

      <button
        onClick={async () => {
          await fetch(`${BACKEND_URL}/logout`, {
            credentials: "include",
          });
          setUser(null);
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default Login;
