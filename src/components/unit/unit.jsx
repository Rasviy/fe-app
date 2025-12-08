// src/pages/UnitManagement.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

import Layout from "../../pages/layout";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faTrashCan,
  faRotateLeft,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

export default function UnitManagement() {
  const api = axios.create({ baseURL: "http://localhost:3000" });

  const [units, setUnits] = useState([]);
  const [deletedUnits, setDeletedUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newUnitName, setNewUnitName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  /* ============================
      FETCH ALL ACTIVE DELETED
     ============================ */
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);
    try {
      // ACTIVE
      const resActive = await api.get("/units");
      const activeData = resActive.data?.data || resActive.data || [];
      setUnits(Array.isArray(activeData) ? activeData : []);

      // DELETED
      const resDeleted = await api.get("/units?deleted=true");
      const deletedData = resDeleted.data?.data || resDeleted.data || [];
      setDeletedUnits(Array.isArray(deletedData) ? deletedData : []);
    } catch (err) {
      setError(err.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  /* ============================
      CREATE UNIT
     ============================ */
  const createUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    try {
      await api.post("/units", { name: newUnitName.trim() });
      setNewUnitName("");
      fetchUnits();
    } catch (err) {
      alert("Create failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ============================
      UPDATE UNIT
     ============================ */

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
      await api.put(`/units/${id}`, { name: editingName.trim() });
      cancelEdit();
      fetchUnits();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ============================
      SOFT DELETE
     ============================ */
  const deleteUnit = async (id) => {
    if (!window.confirm("Hapus unit ini? (Soft Delete)")) return;

    try {
      await api.delete(`/units/${id}`);
      fetchUnits();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ============================
      RESTORE
     ============================ */
  const restoreUnit = async (id) => {
    try {
      await api.put(`/units/${id}/restore`);
      fetchUnits();
    } catch (err) {
      alert("Restore failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ============================
      HARD DELETE
     ============================ */
  const hardDeleteUnit = async (id) => {
    if (!window.confirm("Hapus permanen data ini?")) return;

    try {
      await api.delete(`/units/${id}/permanent`);
      fetchUnits();
    } catch (err) {
      alert(
        "Hard delete failed: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  /* ============================
      UI
     ============================ */
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans text-gray-800">
        <div className="max-w-5xl mx-auto">
          
          {/* HEADER */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Unit Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, edit, delete, and restore measurement units.
            </p>
          </header>

          {/* CREATE FORM */}
          <form
            onSubmit={createUnit}
            className="bg-white rounded-xl shadow-sm p-6 mb-8 border"
          >
            <h2 className="font-semibold mb-3">Create a New Unit</h2>

            <label className="block text-sm text-slate-600 mb-2">Unit Name</label>

            <div className="flex gap-3 items-center">
              <input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="type new unit here"
                className="flex-1 border rounded-md px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-300"
              />

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Create Unit
              </button>
            </div>
          </form>

          {/* ACTIVE UNITS */}
          <section>
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Existing Units
            </h3>

            <div className="bg-white border rounded-lg overflow-hidden">

              <div className="grid grid-cols-12 px-6 py-3 text-xs text-slate-500 bg-slate-50 border-b">
                <div className="col-span-10">UNIT NAME</div>
                <div className="col-span-2 text-right">ACTIONS</div>
              </div>

              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading...</div>
              ) : units.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No units yet — create one above.
                </div>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b"
                  >
                    <div className="col-span-10">
                      {editingId === unit.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                      ) : (
                        <div className="text-sm text-slate-700">{unit.name}</div>
                      )}
                    </div>

                    <div className="col-span-2 flex justify-end gap-3">
                      {editingId === unit.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(unit.id)}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md"
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
                            className="p-2 hover:bg-gray-100 rounded-md"
                          >
                            <FontAwesomeIcon
                              icon={faPenToSquare}
                              style={{ color: "#FFD43B" }}
                              size="lg"
                            />
                          </button>

                          <button
                            onClick={() => deleteUnit(unit.id)}
                            className="p-2 hover:bg-gray-100 rounded-md"
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
                ))
              )}
            </div>
          </section>

          {/* SOFT DELETED UNITS */}
          <section className="mt-12">
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Soft Deleted Units
            </h3>

            <div className="bg-white border rounded-lg overflow-hidden">

              <div className="grid grid-cols-12 px-6 py-3 text-xs text-slate-500 bg-slate-50 border-b">
                <div className="col-span-8">UNIT NAME</div>
                <div className="col-span-4 text-right">ACTIONS</div>
              </div>

              {deletedUnits.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No soft deleted units.
                </div>
              ) : (
                deletedUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b"
                  >
                    <div className="col-span-8 text-sm">{unit.name}</div>

                    <div className="col-span-4 flex justify-end gap-4">
                      <button
                        onClick={() => restoreUnit(unit.id)}
                        className="p-2 hover:bg-gray-100 rounded-md"
                      >
                        <FontAwesomeIcon
                          icon={faRotateLeft}
                          size="lg"
                          style={{ color: "#3b82f6" }}
                        />
                      </button>

                      <button
                        onClick={() => hardDeleteUnit(unit.id)}
                        className="p-2 hover:bg-gray-100 rounded-md"
                      >
                        <FontAwesomeIcon
                          icon={faTrash}
                          size="lg"
                          style={{ color: "#dc2626" }}
                        />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
