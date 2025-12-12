import React, { useEffect, useState } from 'react';
import Layout from "../../pages/layout";

const API_BASE = 'http://localhost:3000/warehouse';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faPenToSquare,
    faTrashCan,
    faRotateLeft,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

// Badge Status
function StatusBadge({ status }) {
    const isActive = (status || '').toLowerCase() === 'active';
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}
        >
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

export default function WarehousePage() {
    const [list, setList] = useState([]); // Active list
    const [deletedList, setDeletedList] = useState([]); // Soft deleted list

    const [loading, setLoading] = useState(false);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState('Active');
    const [createdBy, setCreatedBy] = useState('');

    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    // Fetch Active Warehouses
    async function fetchList() {
        setLoading(true);
        try {
            const res = await fetch(API_BASE);
            const data = await res.json();
            setList(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }

    // Fetch Soft Deleted Warehouses
    async function fetchDeleted() {
        setLoadingDeleted(true);
        try {
            const res = await fetch(`${API_BASE}/deleted`);
            const data = await res.json();
            setDeletedList(Array.isArray(data) ? data : []);
        } finally {
            setLoadingDeleted(false);
        }
    }

    useEffect(() => {
        fetchList();
        fetchDeleted();
    }, []);

    // CREATE
    async function handleCreate(e) {
        e.preventDefault();
        setSaving(true);
        try {
            const body = { name, address, status, created_by: createdBy };
            await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            setName('');
            setAddress('');
            setStatus('Active');
            setCreatedBy('');
            fetchList();
        } finally {
            setSaving(false);
        }
    }

    // OPEN EDIT MODAL
    function openEdit(item) {
        setEditing({ ...item });
    }

    // UPDATE
    async function handleUpdate(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch(`${API_BASE}/${editing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editing),
            });
            setEditing(null);
            fetchList();
        } finally {
            setSaving(false);
        }
    }

    // SOFT DELETE
    async function handleSoftDelete(id) {
        if (!confirm('Yakin ingin soft delete?')) return;
        await fetch(`${API_BASE}/${id}/soft-delete`, { method: 'PATCH' });
        fetchList();
        fetchDeleted();
    }

    // RESTORE
    async function handleRestore(id) {
        await fetch(`${API_BASE}/${id}/restore`, { method: 'PUT' });
        fetchList();
        fetchDeleted();
    }

    // HARD DELETE
    async function handleHardDelete(id) {
        if (!confirm('Hapus permanen?')) return;
        await fetch(`${API_BASE}/${id}/hard-delete`, { method: 'DELETE' });
        fetchDeleted();
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto">

                {/* ============================
            CREATE FORM
        ============================ */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Create New Warehouse</h2>

                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="Warehouse Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />

                        <input
                            className="col-span-2 border rounded px-3 py-2 text-sm"
                            placeholder="Address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />

                        <select
                            className="border rounded px-3 py-2 text-sm"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>

                        <input
                            className="border rounded px-3 py-2 text-sm"
                            placeholder="Created By"
                            value={createdBy}
                            onChange={(e) => setCreatedBy(e.target.value)}
                        />

                        <div className="col-span-full flex justify-end">
                            <button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                            >
                                {saving ? 'Saving...' : 'Create Warehouse'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ============================
            ACTIVE WAREHOUSE TABLE
        ============================ */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="font-semibold mb-4">Existing Warehouses</h3>

                    {loading ? (
                        <p className="text-center py-5">Loading...</p>
                    ) : list.length === 0 ? (
                        <p className="text-center py-5 text-gray-500">No warehouses found.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b">
                                    <th className="py-2">Name</th>
                                    <th className="py-2">Address</th>
                                    <th className="py-2">Status</th>
                                    <th className="py-2">Created By</th>
                                    <th className="py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((w) => (
                                    <tr key={w.id} className="border-b hover:bg-gray-50">
                                        <td className="py-3">{w.name}</td>
                                        <td className="py-3">{w.address}</td>
                                        <td className="py-3"><StatusBadge status={w.status} /></td>
                                        <td className="py-3">{w.created_by || '-'}</td>

                                        <td className="py-3 text-right space-x-2">
                                            <button
                                                onClick={() => openEdit(w)}
                                                className="px-3 py-1 border rounded"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faPenToSquare}
                                                    size="lg"
                                                    style={{ color: "#FFD43B" }}
                                                />
                                            </button>

                                            <button
                                                onClick={() => handleSoftDelete(w.id)}
                                                className="px-3 py-1 border rounded"
                                            >
                                                <FontAwesomeIcon
                                                    icon={faTrashCan}
                                                    size="lg"
                                                    style={{ color: "#ff0000" }}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ============================
            SOFT DELETED TABLE (ONLY IF DATA EXIST)
        ============================ */}
                {deletedList.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <h3 className="font-semibold mb-4 text-red-600">Recycle Bin (Soft Deleted)</h3>

                        {loadingDeleted ? (
                            <p className="text-center py-5">Loading...</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs text-gray-500 border-b">
                                        <th className="py-2">Name</th>
                                        <th className="py-2">Address</th>
                                        <th className="py-2">Status</th>
                                        <th className="py-2">Deleted At</th>
                                        <th className="py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deletedList.map((w) => (
                                        <tr key={w.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3">{w.name}</td>
                                            <td className="py-3">{w.address}</td>
                                            <td className="py-3"><StatusBadge status={w.status} /></td>
                                            <td className="py-3 text-red-500">{w.deleted_at}</td>

                                            <td className="py-3 text-right space-x-2">
                                                <button
                                                    onClick={() => handleRestore(w.id)}
                                                    className="px-3 py-1 border rounded text-green-700"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faRotateLeft}
                                                        size="lg"
                                                        style={{ color: "#3b82f6" }}
                                                    />
                                                </button>

                                                <button
                                                    onClick={() => handleHardDelete(w.id)}
                                                    className="px-3 py-1 border rounded text-red-700"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faTrash}
                                                        size="lg"
                                                        style={{ color: "#dc2626" }}
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* EDIT MODAL */}
                {editing && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                            <h3 className="text-lg font-semibold mb-4">Edit Warehouse</h3>

                            <form onSubmit={handleUpdate} className="space-y-3">
                                <input
                                    className="w-full border rounded px-3 py-2"
                                    value={editing.name}
                                    onChange={(e) =>
                                        setEditing({ ...editing, name: e.target.value })
                                    }
                                />

                                <input
                                    className="w-full border rounded px-3 py-2"
                                    value={editing.address}
                                    onChange={(e) =>
                                        setEditing({ ...editing, address: e.target.value })
                                    }
                                />

                                <select
                                    className="w-full border rounded px-3 py-2"
                                    value={editing.status}
                                    onChange={(e) =>
                                        setEditing({ ...editing, status: e.target.value })
                                    }
                                >
                                    <option>Active</option>
                                    <option>Inactive</option>
                                </select>

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(null)}
                                        className="px-4 py-2 border rounded"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
