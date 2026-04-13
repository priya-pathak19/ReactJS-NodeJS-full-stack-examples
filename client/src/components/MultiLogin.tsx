import { useEffect, useState } from "react";

const Login = () => {
  const [user, setUser] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const handleLogin = () => {
    window.location.href = "http://localhost:3000/auth/outlook";
  };

  useEffect(() => {
    // check if user already logged in
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/me", {
          credentials: "include", // IMPORTANT for cookies
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

  // 🔄 If not logged in → show button
  if (!user) {
    return <button onClick={handleLogin}>Authenticate with Outlook</button>;
  }

  // ✅ If logged in → show user info
  return (
    <div style={{ color: "black" }}>
      <h2>Welcome {user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default Login;
