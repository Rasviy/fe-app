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

// ============================
// FORMAT DATETIME HELPER
// ============================
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

// ============================
// STATUS BADGE (ACTIVE / INACTIVE / DELETED)
// ============================
function StatusBadge({ status }) {
    const value = (status || '').toLowerCase();

    let className = 'bg-gray-100 text-gray-800';
    let label = status;

    if (value === 'active') {
        className = 'bg-green-100 text-green-800';
        label = 'Active';
    } else if (value === 'inactive') {
        className = 'bg-yellow-100 text-yellow-800';
        label = 'Inactive';
    } else if (value === 'deleted') {
        className = 'bg-red-100 text-red-800';
        label = 'Deleted';
    }

    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${className}`}
        >
            {label}
        </span>
    );
}

export default function WarehousePage() {
    const [list, setList] = useState([]);
    const [deletedList, setDeletedList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState('Active');
    const [createdBy, setCreatedBy] = useState('');

    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);

    // ============================
    // FETCH ACTIVE
    // ============================
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

    // ============================
    // FETCH DELETED
    // ============================
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

    // ============================
    // CREATE
    // ============================
    async function handleCreate(e) {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    address,
                    status,
                    created_by: createdBy,
                }),
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

    // ============================
    // UPDATE
    // ============================
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

    // ============================
    // DELETE ACTIONS
    // ============================
    async function handleSoftDelete(id) {
        if (!confirm('Yakin ingin soft delete?')) return;
        await fetch(`${API_BASE}/${id}/soft-delete`, { method: 'PATCH' });
        fetchList();
        fetchDeleted();
    }

    async function handleRestore(id) {
        await fetch(`${API_BASE}/${id}/restore`, { method: 'PUT' });
        fetchList();
        fetchDeleted();
    }

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
                ACTIVE TABLE
                ============================ */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 className="font-semibold mb-4">Existing Warehouses</h3>

                    {loading ? (
                        <p className="text-center py-5">Loading...</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b">
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Status</th>
                                    <th>Created By</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.map((w) => (
                                    <tr key={w.id} className="border-b hover:bg-gray-50">
                                        <td>{w.name}</td>
                                        <td>{w.address}</td>
                                        <td><StatusBadge status={w.status} /></td>
                                        <td>{w.created_by || '-'}</td>
                                        <td className="text-right space-x-2">
                                            <button onClick={() => setEditing(w)}>
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button onClick={() => handleSoftDelete(w.id)}>
                                                <FontAwesomeIcon icon={faTrashCan} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ============================
                SOFT DELETED TABLE
                ============================ */}
                {deletedList.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="font-semibold mb-4 text-red-600">Recycle Bin</h3>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-gray-500 border-b">
                                    <th>Name</th>
                                    <th>Address</th>
                                    <th>Status</th>
                                    <th>Deleted At</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedList.map((w) => (
                                    <tr key={w.id} className="border-b hover:bg-gray-50">
                                        <td>{w.name}</td>
                                        <td>{w.address}</td>
                                        <td>
                                            {/* FORCE STATUS = DELETED */}
                                            <StatusBadge status="Deleted" />
                                        </td>
                                        <td className="text-red-600">
                                            {formatDateTime(w.deleted_at)}
                                        </td>
                                        <td className="text-right space-x-2">
                                            <button onClick={() => handleRestore(w.id)}>
                                                <FontAwesomeIcon icon={faRotateLeft} />
                                            </button>
                                            <button onClick={() => handleHardDelete(w.id)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}
