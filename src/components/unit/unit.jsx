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
        FETCH ACTIVE UNITS ONLY
  ============================================================ */
  const fetchUnits = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/units");
      setUnits(res.data?.data || []);
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
      alert("Create failed");
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
      alert("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  /* ============================================================
        SOFT DELETE → PINDAH KE DELETED LIST
  ============================================================ */
  const deleteUnit = async (id) => {
    if (!window.confirm("Hapus unit ini? (Soft Delete)")) return;

    try {
      setActionLoading(true);
      await api.patch(`/units/${id}`);

      const deleted = units.find((u) => u.id === id);

      setUnits((prev) => prev.filter((u) => u.id !== id));
      setDeletedUnits((prev) =>
        deleted ? [...prev, deleted] : prev
      );
    } catch (err) {
      alert("Delete failed");
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

      const restored = deletedUnits.find((u) => u.id === id);

      setDeletedUnits((prev) => prev.filter((u) => u.id !== id));
      setUnits((prev) =>
        restored ? [...prev, restored] : prev
      );
    } catch (err) {
      alert("Restore failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ============================================================
        HARD DELETE (PERMANENT)
  ============================================================ */
  const hardDeleteUnit = async (id) => {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus data ini secara permanen?"
    );
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      await api.delete(`/units/${id}/permanent`);
      setDeletedUnits((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert("Hard delete failed");
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

          <header className="mb-8">
            <h1 className="text-3xl font-bold">Unit Management</h1>
            <p className="text-sm text-slate-500">
              Create, edit, delete, and restore units
            </p>
          </header>

          {/* CREATE */}
          <form
            onSubmit={createUnit}
            className="bg-white p-6 rounded-xl border mb-8"
          >
            <div className="flex gap-3">
              <input
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="New unit name"
                className="flex-1 border px-4 py-2 rounded-md"
              />
              <button
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Create
              </button>
            </div>
          </form>

          {/* ACTIVE */}
          <section>
            <h3 className="font-medium mb-3">Active Units</h3>

            <div className="bg-white border rounded-lg">
              {loading ? (
                <div className="p-6 text-center">Loading...</div>
              ) : units.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No units found
                </div>
              ) : (
                units.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex justify-between items-center px-6 py-4 border-b"
                  >
                    {editingId === unit.id ? (
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="border px-3 py-2 rounded-md"
                      />
                    ) : (
                      <span>{unit.name}</span>
                    )}

                    <div className="flex gap-3">
                      {editingId === unit.id ? (
                        <>
                          <button onClick={() => saveEdit(unit.id)}>Save</button>
                          <button onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(unit)}>
                            <FontAwesomeIcon icon={faPenToSquare} />
                          </button>
                          <button onClick={() => deleteUnit(unit.id)}>
                            <FontAwesomeIcon icon={faTrashCan} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* SOFT DELETED – ONLY APPEARS AFTER DELETE */}
          {deletedUnits.length > 0 && (
            <section className="mt-10">
              <h3 className="font-medium mb-3 text-red-600">
                Soft Deleted Units
              </h3>

              <div className="bg-white border rounded-lg">
                {deletedUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex justify-between items-center px-6 py-4 border-b"
                  >
                    <span>{unit.name}</span>

                    <div className="flex gap-4">
                      <button onClick={() => restoreUnit(unit.id)}>
                        <FontAwesomeIcon icon={faRotateLeft} />
                      </button>
                      <button onClick={() => hardDeleteUnit(unit.id)}>
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
