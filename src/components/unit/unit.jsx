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
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newUnitName, setNewUnitName] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  /* ============================================================
        FETCH UNITS (ACTIVE + DELETED)
  ============================================================ */
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);

    try {
      const active = await api.get("/units");
      const deleted = await api.get("/units?deleted=true");

      setUnits(active.data?.data || []);
      setDeletedUnits(deleted.data?.data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  /* ============================================================
        CREATE
  ============================================================ */
  const createUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    try {
      setActionLoading(true);
      await api.post("/units", { name: newUnitName });
      setNewUnitName("");
      fetchUnits();
    } catch (err) {
      alert("Create failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
        EDIT
  ============================================================ */
  const startEdit = (unit) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;

    try {
      setActionLoading(true);
      await api.put(`/units/${id}`, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      fetchUnits();
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  /* ============================================================
        SOFT DELETE
  ============================================================ */
  const deleteUnit = async (id) => {
    if (!window.confirm("Hapus unit ini? (Soft Delete)")) return;

    try {
      setActionLoading(true);
      await api.delete(`/units/${id}`);
      fetchUnits();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
        RESTORE
  ============================================================ */
  const restoreUnit = async (id) => {
    try {
      setActionLoading(true);
      await api.put(`/units/${id}/restore`);
      fetchUnits();
    } catch (err) {
      alert("Restore failed: " + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
        HARD DELETE (PERMANENT DELETE)
  ============================================================ */
  const hardDeleteUnit = async (id) => {
    console.log("HARD DELETE → ID:", id);
  
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus data ini secara permanen?\nTindakan ini tidak bisa dibatalkan."
    );
  
    if (!confirmDelete) return;
  
    try {
      setActionLoading(true);
  
      const response = await api.delete(`/units/${id}/permanent`);
      console.log("Hard delete response:", response.data);
  
      alert("Unit berhasil dihapus permanen!");
      fetchUnits(); // refresh data
    } catch (error) {
      console.error("Hard delete error:", error);
  
      alert(
        error.response?.data?.message ||
        "Gagal menghapus permanen. Pastikan data sudah di-soft delete dulu."
      );
    } finally {
      setActionLoading(false);
    }
  };  

  /* ============================================================
        UI
  ============================================================ */
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-800">
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

            <label className="block text-sm mb-2 text-slate-600">
              Unit Name
            </label>

            <div className="flex gap-3 items-center">
              <input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Type new unit here..."
                className="flex-1 border rounded-md px-4 py-3 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-300"
              />

              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300"
              >
                {actionLoading ? "Processing..." : "Create Unit"}
              </button>
            </div>
          </form>

          {/* ACTIVE UNITS */}
          <section>
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Existing Units
            </h3>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b text-xs text-slate-500">
                <div className="col-span-10">UNIT NAME</div>
                <div className="col-span-2 text-right">ACTIONS</div>
              </div>

              {loading ? (
                <div className="p-6 text-center text-slate-500">Loading...</div>
              ) : units.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No units found.
                </div>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="grid grid-cols-12 px-6 py-4 border-b items-center"
                  >
                    <div className="col-span-10">
                      {editingId === unit.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full border rounded-md px-3 py-2 text-sm"
                        />
                      ) : (
                        <span className="text-sm">{unit.name}</span>
                      )}
                    </div>

                    <div className="col-span-2 flex justify-end gap-3">
                      {editingId === unit.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(unit.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
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
                              size="lg"
                              style={{ color: "#FFD43B" }}
                            />
                          </button>

                          <button
                            onClick={() => deleteUnit(unit.id)}
                            className="p-2 hover:bg-gray-100 rounded-md"
                          >
                            <FontAwesomeIcon
                              icon={faTrashCan}
                              size="lg"
                              style={{ color: "#ff0000" }}
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

          {/* DELETED UNITS */}
          <section className="mt-10">
            <h3 className="text-lg font-medium text-slate-700 mb-3">
              Soft Deleted Units
            </h3>

            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b text-xs text-slate-500">
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
                    className="grid grid-cols-12 px-6 py-4 border-b items-center"
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
