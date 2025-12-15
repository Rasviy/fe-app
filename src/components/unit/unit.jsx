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

  const [newUnitName, setNewUnitName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  /* ================= FETCH ACTIVE ================= */
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get("/units");
      setUnits(res.data?.data || []);
    } catch {
      alert("Failed load units");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  /* ================= CREATE ================= */
  const createUnit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim()) return;

    try {
      setActionLoading(true);
      await api.post("/units", { name: newUnitName });
      setNewUnitName("");
      fetchUnits();
    } catch {
      alert("Create failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const startEdit = (unit) => {
    setEditingId(unit.id);
    setEditingName(unit.name);
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;

    try {
      setActionLoading(true);
      await api.put(`/units/${id}`, { name: editingName });
      setEditingId(null);
      fetchUnits();
    } catch {
      alert("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= SOFT DELETE ================= */
  const deleteUnit = async (id) => {
    if (!window.confirm("Soft delete unit ini?")) return;

    try {
      setActionLoading(true);
      await api.patch(`/units/${id}`);

      const unit = units.find((u) => u.id === id);

      if (unit) {
        setDeletedUnits((prev) => [
          ...prev,
          {
            ...unit,
            deleted_at: new Date().toISOString(),
          },
        ]);
      }

      setUnits((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= RESTORE ================= */
  const restoreUnit = async (id) => {
    try {
      setActionLoading(true);
      await api.put(`/units/${id}/restore`);

      const restored = deletedUnits.find((u) => u.id === id);

      setDeletedUnits((prev) => prev.filter((u) => u.id !== id));
      if (restored) {
        const { deleted_at, ...cleanUnit } = restored;
        setUnits((prev) => [...prev, cleanUnit]);
      }
    } catch {
      alert("Restore failed");
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= HARD DELETE ================= */
  const hardDeleteUnit = async (id) => {
    if (!window.confirm("Hapus permanen?")) return;

    try {
      setActionLoading(true);
      await api.delete(`/units/${id}/permanent`);
      setDeletedUnits((prev) => prev.filter((u) => u.id !== id));
    } catch {
      alert("Hard delete failed");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* HEADER */}
          <header>
            <h1 className="text-3xl font-bold">Unit Management</h1>
            <p className="text-gray-500 text-sm">
              Manage active & deleted units
            </p>
          </header>

          {/* CREATE */}
          <form
            onSubmit={createUnit}
            className="bg-white border rounded-xl p-6 flex gap-3"
          >
            <input
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder="Unit name"
              className="flex-1 border px-4 py-2 rounded-md"
            />
            <button
              disabled={actionLoading}
              className="bg-blue-600 text-white px-6 rounded-md"
            >
              Create
            </button>
          </form>

          {/* ================= ACTIVE TABLE ================= */}
          <section className="bg-white border rounded-xl">
            <h3 className="px-6 py-4 font-semibold border-b">
              Existing Units
            </h3>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : units.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-6 text-center text-gray-400">
                      No units found
                    </td>
                  </tr>
                ) : (
                  units.map((unit) => (
                    <tr key={unit.id} className="border-t">
                      <td className="px-6 py-4">
                        {editingId === unit.id ? (
                          <input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="border px-3 py-1 rounded"
                          />
                        ) : (
                          unit.name
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        {editingId === unit.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(unit.id)}
                              className="text-blue-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-400"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(unit)}>
                              <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="text-yellow-400"
                              />
                            </button>
                            <button onClick={() => deleteUnit(unit.id)}>
                              <FontAwesomeIcon
                                icon={faTrashCan}
                                className="text-red-600"
                              />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* ================= SOFT DELETE TABLE ================= */}
          {deletedUnits.length > 0 && (
            <section className="bg-white border rounded-xl">
              <h3 className="px-6 py-4 font-semibold border-b text-red-600">
                Recycle Bin (Soft Deleted)
              </h3>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Deleted At</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedUnits.map((unit) => (
                    <tr key={unit.id} className="border-t">
                      <td className="px-6 py-4">{unit.name}</td>
                      <td className="px-6 py-4 text-gray-500">
                        {formatDate(unit.deleted_at)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => restoreUnit(unit.id)}>
                          <FontAwesomeIcon
                            icon={faRotateLeft}
                            className="text-blue-600"
                          />
                        </button>
                        <button onClick={() => hardDeleteUnit(unit.id)}>
                          <FontAwesomeIcon
                            icon={faTrash}
                            className="text-red-700"
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      </div>
    </Layout>
  );
}
