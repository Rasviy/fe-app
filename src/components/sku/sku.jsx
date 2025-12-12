import React, { useEffect, useState } from "react";
import Layout from "../../pages/layout";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrashCan,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

// ============================
// API HELPER (digabung di 1 file)
// ============================
const BASE = "http://localhost:3000";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) throw data;
  return data;
}

const fetchItems = () => apiFetch("/items");
const fetchWarehouses = () => apiFetch("/warehouse");
const fetchSkus = () => apiFetch("/sku");

const createSku = (body) =>
  apiFetch("/sku", { method: "POST", body: JSON.stringify(body) });

const updateSku = (id, body) =>
  apiFetch(`/sku/${id}`, { method: "PATCH", body: JSON.stringify(body) });

const softDeleteSku = (id) =>
  apiFetch(`/sku/${id}/soft-delete`, { method: "PATCH" });

const restoreSku = (id) => apiFetch(`/sku/${id}/restore`, { method: "PUT" });

const hardDeleteSku = (id) =>
  apiFetch(`/sku/${id}/hard-delete`, { method: "DELETE" });

// ============================
// BADGE STATUS
// ============================
function StatusBadge({ status }) {
  const base = "text-xs font-medium px-2 py-1 rounded-full";

  if (!status)
    return <span className={`${base} bg-gray-100 text-gray-700`}>Unknown</span>;

  const s = status.toLowerCase();

  if (s.includes("in"))
    return <span className={`${base} bg-green-100 text-green-800`}>In Stock</span>;

  if (s.includes("low"))
    return <span className={`${base} bg-yellow-100 text-yellow-800`}>Low Stock</span>;

  if (s.includes("out"))
    return <span className={`${base} bg-red-100 text-red-800`}>Out of Stock</span>;

  return <span className={`${base} bg-gray-100 text-gray-700`}>{status}</span>;
}

// ============================
// MAIN PAGE
// ============================
export default function SkuPage() {
  const [items, setItems] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [skus, setSkus] = useState([]);

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    item_id: "",
    warehouse_id: "",
    code: "",
    color: "",
    status: "",
  });

  // ============================
  // LOAD ALL DATA
  // ============================
  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, whRes, skuRes] = await Promise.all([
        fetchItems(),
        fetchWarehouses(),
        fetchSkus(),
      ]);

      setItems(itemsRes.data || itemsRes);
      setWarehouses(whRes.data || whRes);
      setSkus(skuRes.data || skuRes);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // ============================
  // HANDLE FORM
  // ============================
  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.item_id || !form.warehouse_id || !form.code)
      return setError("Item, Warehouse, dan Code wajib diisi.");

    try {
      if (editingId) {
        await updateSku(editingId, form);
      } else {
        await createSku(form);
      }

      setForm({
        item_id: "",
        warehouse_id: "",
        code: "",
        color: "",
        status: "",
      });
      setEditingId(null);

      loadData();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data");
    }
  }

  // ============================
  // EDIT
  // ============================
  function startEdit(sku) {
    setEditingId(sku.id);
    setForm({
      item_id: sku.item_id || sku.item?.id || "",
      warehouse_id: sku.warehouse_id || sku.warehouse?.id || "",
      code: sku.code || "",
      color: sku.color || "",
      status: sku.status || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============================
  // RENDER PAGE
  // ============================
  return (
    <Layout>
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">SKU Management</h1>

      {/* FORM */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="font-medium mb-4">
          {editingId ? "Edit SKU" : "New SKU"}
        </h2>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Item</label>
            <select
              name="item_id"
              value={form.item_id}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select an Item</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Warehouse</label>
            <select
              name="warehouse_id"
              value={form.warehouse_id}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Code</label>
            <input
              name="code"
              value={form.code}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="TSHIRT-BL-L"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Color</label>
            <input
              name="color"
              value={form.color}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Blue"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Status</label>
            <input
              name="status"
              value={form.status}
              onChange={onChange}
              className="w-full border rounded px-3 py-2"
              placeholder="In Stock"
            />
          </div>

          <div className="md:col-span-2 text-right">
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    item_id: "",
                    warehouse_id: "",
                    code: "",
                    color: "",
                    status: "",
                  });
                }}
                className="mr-3 px-4 py-2 border rounded"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editingId ? "Update SKU" : "Create SKU"}
            </button>
          </div>
        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="font-medium mb-4">Existing SKUs</h2>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-500 text-xs">
                <tr>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Item</th>
                  <th className="py-2 pr-4">Warehouse</th>
                  <th className="py-2 pr-4">Color</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skus.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-gray-500">
                      No SKU found
                    </td>
                  </tr>
                )}

                {skus.map((sku) => (
                  <tr
                    key={sku.id}
                    className={`border-t ${sku.deleted_at ? "opacity-50" : ""}`}
                  >
                    <td className="py-3 pr-4 font-medium">{sku.code}</td>
                    <td className="py-3 pr-4">{sku.item?.name || "-"}</td>
                    <td className="py-3 pr-4">{sku.warehouse?.name || "-"}</td>
                    <td className="py-3 pr-4">{sku.color || "-"}</td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={sku.status} />
                    </td>

                    <td className="py-3 pr-4">
                      {!sku.deleted_at ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(sku)}
                            className="px-2 py-1 border rounded"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Soft delete SKU?"))
                                softDeleteSku(sku.id).then(loadData);
                            }}
                            className="px-2 py-1 border rounded text-red-600"
                          >
                            🗑
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreSku(sku.id).then(loadData)}
                            className="px-2 py-1 border rounded text-green-600"
                          >
                            ♻️ Restore
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Hard delete permanently?"))
                                hardDeleteSku(sku.id).then(loadData);
                            }}
                            className="px-2 py-1 border rounded text-red-700"
                          >
                            🛑 Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </Layout>
  );
}
