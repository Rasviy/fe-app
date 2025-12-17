import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Unit from "./components/unit/unit.jsx";
import Category from "./components/category/category.jsx";
import Item from "./components/item/item.jsx";
import Warehouse from "./components/warehouse/warehouse.jsx";
import Sku from "./components/sku/sku.jsx";
import ScanQr from "./components/scan-qr/scan-qr.jsx";
import Loans from "./components/loans/loans.jsx";
import ItemMovement from "./components/item-movement/item-movement.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/unit" element={<Unit />} />
      <Route path="/category" element={<Category />} />
      <Route path="/item" element={<Item />} />
      <Route path="/warehouse" element={<Warehouse />} />
      <Route path="/sku" element={<Sku />} />
      <Route path="/scan-qr" element={<ScanQr />} />
      <Route path="/loans" element={<Loans />} />
      <Route path="/item-movement" element={<ItemMovement />} />
    </Routes>
  </BrowserRouter>
);
