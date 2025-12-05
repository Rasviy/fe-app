import React, { useEffect, useState } from "react";

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSubmit: (data, isEdit) => void
 * - initialData: item or null
 */
export default function ItemModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState({
    name: "",
    supplier: "",
    price: "",
    stock: "",
    description: "",
    code: "",
    image: "",
    unit_id: "",
    category_id: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name ?? "",
        supplier: initialData.supplier ?? "",
        price: initialData.price ?? "",
        stock: initialData.stock ?? "",
        description: initialData.description ?? "",
        code: initialData.code ?? "",
        image: initialData.image ?? "",
        unit_id: initialData.unit_id ?? "",
        category_id: initialData.category_id ?? "",
      });
    } else {
      setForm({
        name: "",
        supplier: "",
        price: "",
        stock: "",
        description: "",
        code: "",
        image: "",
        unit_id: "",
        category_id: "",
      });
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();

    // minimal validation: required fields
    if (!form.name || !form.stock || !form.unit_id || !form.category_id || !form.code) {
      alert("Please fill required fields: name, code, stock, unit_id, category_id");
      return;
    }

    // convert numeric fields
    const payload = {
      ...form,
      price: form.price ? Number(form.price) : undefined,
      stock: Number(form.stock),
    };

    onSubmit(payload, !!initialData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl overflow-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">{initialData ? "Edit Item" : "Create Item"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>

        <form className="p-6 space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Code (SKU) *</label>
              <input name="code" value={form.code} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Stock *</label>
              <input name="stock" type="number" value={form.stock} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Price</label>
              <input name="price" type="number" value={form.price} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit ID *</label>
              <input name="unit_id" value={form.unit_id} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category ID *</label>
              <input name="category_id" value={form.category_id} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Supplier</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 block w-full border rounded px-3 py-2" rows={3} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">{initialData ? "Save Changes" : "Create Item"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
