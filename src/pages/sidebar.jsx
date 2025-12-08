// src/components/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  faUser,
  faGauge,
  faBoxes,
  faRightLeft,
  faBarcode,
  faRepeat,
  faArrowRightFromBracket,
  faHouse,
  faWarehouse,
  faSuitcase,
  faLayerGroup
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");

  const menu = [
    { name: "Dashboard", icon: faHouse, path: "/dashboard" },
    { name: "Unit", icon: faSuitcase, path: "/unit" },
    { name: "Category", icon: faLayerGroup, path: "/category" },
    { name: "Item", icon: faBoxes, path: "/item" },
    { name: "Gudang", icon: faWarehouse, path: "/transaction" },
    { name: "Transaction", icon: faRepeat, path: "/transaction" },
  ];

  // Ambil username dari localStorage saat mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.username) {
      setUsername(user.username);
    }
  }, []);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="h-screen w-60 bg-white border-r flex flex-col justify-between p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-blue-600 mb-6">Inventaris</h1>

        {/* Profile */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <FontAwesomeIcon icon={faUser} className="text-gray-700" />
          </div>
          <div>
            <p className="font-semibold text-sm">{username}</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-2">
          {menu.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
                ${isActive ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"}`
              }
            >
              <FontAwesomeIcon icon={item.icon} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-700 hover:text-red-500 text-sm"
        >
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
          Keluar
        </button>
      </div>
    </div>
  );
}
