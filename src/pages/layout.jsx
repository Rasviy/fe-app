// src/components/Layout.jsx
import Sidebar from "./sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 bg-gray-50 p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
