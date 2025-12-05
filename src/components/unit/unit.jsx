// src/pages/UnitManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

// Layout (agar sidebar tampil)
import Layout from "../../pages/layout";

// Font Awesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrashCan } from "@fortawesome/free-solid-svg-icons";

export default function UnitManagement() {
  const api = axios.create({ baseURL: "http://localhost:3000" });

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newUnitName, setNewUnitName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // FETCH UNITS
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/units");

      const arrayData = Array.isArray(res.data?.data) ? res.data.data : [];
      setUnits(arrayData);
    } catch (err) {
      setError(err.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // CREATE UNIT
  const createUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    try {
      const payload = { name: newUnitName.trim() };
      const res = await api.post("/units", payload);

      if (res?.data) setUnits((prev) => [res.data, ...prev]);
      else fetchUnits();

      setNewUnitName("");
    } catch (err) {
      alert("Create failed: " + (err.response?.data?.message || err.message));
    }
  };

  // EDIT UNIT
  const startEdit = (unit) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;

    try {
      const payload = { name: editingName.trim() };
      const res = await api.put(`/units/${id}`, payload);

      setUnits((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      cancelEdit();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  // DELETE UNIT
  const deleteUnit = async (id) => {
    const ok = window.confirm("Hapus unit ini?");
    if (!ok) return;

    try {
      await api.delete(`/units/${id}`);
      setUnits((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Unit Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, edit, and delete measurement units.
            </p>
          </header>

          {/* CREATE FORM */}
          <form
            onSubmit={createUnit}
            className="bg-white rounded-xl shadow-sm p-6 mb-8 border"
          >
            <h2 className="font-semibold mb-3">Create a New Unit</h2>
            <label className="block text-sm text-slate-600 mb-2">
              Unit Name
            </label>

            <div className="flex gap-3 items-center">
              <input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="type new unit here"
                className="flex-1 border rounded-md px-4 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
              >
                Create Unit
              </button>
            </div>
          </form>

          {/* TABLE */}
          <section>
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Existing Units
            </h3>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-6 py-3 text-xs text-slate-500 bg-slate-50 border-b">
                <div className="col-span-10">UNIT NAME</div>
                <div className="col-span-2 text-right">ACTIONS</div>
              </div>

              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading...</div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : units.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No units yet — create one above.
                </div>
              ) : (
                <div>
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="grid grid-cols-12 items-center gap-2 px-6 py-4 border-b last:border-b-0"
                    >
                      <div className="col-span-10">
                        {editingId === unit.id ? (
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full border rounded-md px-3 py-2 text-sm"
                          />
                        ) : (
                          <div className="text-sm text-slate-700">
                            {unit.name}
                          </div>
                        )}
                      </div>

                      <div className="col-span-2 text-right flex items-center justify-end gap-3">
                        {editingId === unit.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(unit.id)}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1.5 text-sm bg-gray-200 rounded-md"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(unit)}
                              className="p-2 rounded-md hover:bg-gray-100"
                            >
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                style={{ color: "#FFD43B" }}
                                size="lg"
                              />
                            </button>

                            <button
                              onClick={() => deleteUnit(unit.id)}
                              className="p-2 rounded-md hover:bg-gray-100"
                            >
                              <FontAwesomeIcon
                                icon={faTrashCan}
                                style={{ color: "#ff0000" }}
                                size="lg"
                              />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
