import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.location.href = "/dashboard";
    } catch (err) {
      setError("Server tidak merespon!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>

      {/* LEFT */}
      <div style={styles.left}>
        <div style={styles.overlay} />

        <div style={styles.leftContent}>
          <div style={styles.dot}></div>

          <h2 style={styles.leftTitle}>Inventory</h2>
          <h3 style={styles.leftSubtitle}>Optimalkan Operasional Anda</h3>

          <p style={styles.leftDesc}>
            Kelola, lacak, dan optimalkan seluruh stok Anda dengan sistem inventaris yang intuitif.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div style={styles.right}>
        <div style={styles.box}>
          <h1 style={styles.welcome}>Selamat Datang</h1>
          <p style={styles.smallText}>
            Masuk ke akun Anda untuk mengelola inventaris
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <label style={styles.label}>Nama Pengguna</label>
            <input
              style={styles.input}
              placeholder="Masukkan nama pengguna"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label style={styles.label}>Kata Sandi</label>
            <input
              type="password"
              style={styles.input}
              placeholder="Masukkan kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <a style={styles.forgot} href="#">
              Lupa kata sandi?
            </a>

            {error && <p style={styles.error}>{error}</p>}

            <button style={styles.button} disabled={loading}>
              {loading ? "Memuat..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    width: "100%",
    height: "100vh",
    margin: 0,
    padding: 0,
    overflow: "hidden",
    fontFamily: "Poppins, sans-serif",
  },
  

  /* LEFT SIDE */
  left: {
    flex: 1,
    backgroundImage:
      "url('https://images.unsplash.com/photo-1581091870622-df7a95d45a3f?auto=format&fit=crop&w=1600&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
  },
  leftContent: {
    position: "absolute",
    bottom: 40,
    left: 45,
    color: "white",
    maxWidth: "70%",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: "50%",
    background: "#266BFF",
    marginBottom: 10,
  },
  leftTitle: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
  },
  leftSubtitle: {
    fontSize: 16,
    fontWeight: 600,
    marginTop: 4,
  },
  leftDesc: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.85,
    lineHeight: "22px",
  },

  /* RIGHT SIDE */
  right: {
    flex: 1,
    background: "#F1F1F1",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "75%",
    maxWidth: 380,
    textAlign: "center",
  },
  welcome: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111",
    marginBottom: 6,
  },
  smallText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 30,
  },

  form: {
    textAlign: "left",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 8,
    border: "1px solid #d7d7d7",
    background: "#EAEAEA",
    marginBottom: 18,
    outline: "none",
    fontSize: 14,
  },
  forgot: {
    fontSize: 12,
    color: "#266BFF",
    float: "right",
    marginBottom: 18,
    textDecoration: "none",
  },
  error: {
    color: "red",
    marginBottom: 15,
    fontSize: 13,
  },
  button: {
    width: "100%",
    padding: 13,
    background: "#0050FF",
    border: "none",
    fontSize: 15,
    color: "white",
    fontWeight: 600,
    borderRadius: 8,
    cursor: "pointer",
  },
  body: {
  width: "100%",
  minHeight: "100vh",
  overflow: "hidden !important",
},

};
