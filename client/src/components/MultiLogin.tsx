import { useEffect, useState } from "react";

type User = {
  name: string;
  email: string;
  provider?: string;
};

const Login = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleMicrosoft = () => {
    window.location.href = "http://localhost:3000/auth/outlook";
  };

  const handleSlack = () => {
    window.location.href = "http://localhost:3000/auth/slack";
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/me", {
          // "https://foreknowingly-dedicational-shonta.ngrok-free.dev/me" -> for slack
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log(data, "dataaa");
          setUser(data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  // 🔄 Not logged in → show BOTH buttons
  if (!user) {
    return (
      <div>
        <button onClick={handleMicrosoft}>🔐 Authenticate with Outlook</button>

        <br />
        <br />

        <button onClick={handleSlack}>🔐 Authenticate with Slack</button>
      </div>
    );
  }

  // ✅ Logged in → show user + provider
  return (
    <div style={{ color: "black" }}>
      <h2>Welcome {user.name}</h2>
      <p>{user.email}</p>
      <p>
        Logged in via: <b>{user.provider || "Unknown"}</b>
      </p>
    </div>
  );
};

export default Login;
