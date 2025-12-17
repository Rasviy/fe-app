// src/components/Layout.jsx
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div>
      {/* Sidebar fixed */}
      <Sidebar />

      {/* Main Content */}
      <main className="ml-60 bg-gray-50 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
