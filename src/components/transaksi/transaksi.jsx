import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../pages/layout";

const API_LOANS = "http://localhost:3000/loans";
const API_REQUEST = "http://localhost:3000/item-movement";

// 🔹 formatter tanggal + waktu
const formatDateTime = (date) => {
  if (!date) return "Belum ada";
  return new Date(date).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 🔹 Helper untuk mendapatkan nilai yang aman
const getSafeValue = (value, fallback = "Data tidak tersedia") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

// 🔹 Ekstrak data dari detail transaksi - DIPERBAIKI
const extractItemData = (item, type) => {
  let name = "";
  let sku_code = "";
  let warehouse = "";
  
  if (type === "loan") {
    // Untuk loans: ambil data dari loan_details
    const detail = item.loan_details?.[0];
    if (detail) {
      // Coba ambil dari berbagai kemungkinan struktur
      name = detail.sku?.item?.name || 
             detail.sku?.name || 
             detail.name || 
             "";
      
      sku_code = detail.sku?.sku_code || 
                 detail.sku_code || 
                 detail.sku?.code || 
                 "";
      
      warehouse = detail.sku?.warehouse?.name || 
                  detail.warehouse?.name || 
                  "";
    }
  } else {
    // Untuk item-movement: ambil data dari details
    const detail = item.details?.[0];
    if (detail) {
      name = detail.sku?.item?.name || 
             detail.sku?.name || 
             detail.name || 
             "";
      
      sku_code = detail.sku?.sku_code || 
                 detail.sku_code || 
                 detail.sku?.code || 
                 "";
      
      warehouse = detail.sku?.warehouse?.name || 
                  detail.warehouse?.name || 
                  "";
    }
  }
  
  return { name, sku_code, warehouse };
};

// 🔹 Fungsi untuk mendapatkan tanggal pengembalian loans
const getLoanReturnDate = (loan) => {
  // Cari dari loan_details
  const detail = loan.loan_details?.[0];
  if (detail?.return_date) {
    return detail.return_date;
  }
  
  // Jika tidak ada, hitung 7 hari setelah loan_date
  if (loan.loan_date) {
    const estimatedDate = new Date(
      new Date(loan.loan_date).getTime() + (7 * 24 * 60 * 60 * 1000)
    );
    return estimatedDate.toISOString();
  }
  
  return null;
};

// 🔹 Fungsi untuk mendapatkan semua item dari detail transaksi (untuk table)
const getAllItemsFromDetails = (item, type) => {
  const items = [];
  
  if (type === "loan") {
    // Untuk loans
    if (item.loan_details && Array.isArray(item.loan_details)) {
      item.loan_details.forEach(detail => {
        items.push({
          name: detail.sku?.item?.name || 
                detail.sku?.name || 
                detail.name || 
                "Item tidak tersedia",
          sku_code: detail.sku?.sku_code || 
                   detail.sku_code || 
                   detail.sku?.code || 
                   "SKU tidak tersedia",
          warehouse: detail.sku?.warehouse?.name || 
                    detail.warehouse?.name || 
                    "Gudang tidak tersedia",
          necessity: item.necessity || "Tidak disebutkan",
          loan_date: item.loan_date,
          request_date: null,
          id: item.id,
          return_date: detail.return_date,
        });
      });
    } else {
      // Fallback jika tidak ada details
      items.push({
        name: "Item tidak tersedia",
        sku_code: "SKU tidak tersedia",
        warehouse: "Gudang tidak tersedia",
        necessity: item.necessity || "Tidak disebutkan",
        loan_date: item.loan_date,
        request_date: null,
        id: item.id,
        return_date: null,
      });
    }
  } else {
    // Untuk item-movement
    if (item.details && Array.isArray(item.details)) {
      item.details.forEach(detail => {
        items.push({
          name: detail.sku?.item?.name || 
                detail.sku?.name || 
                detail.name || 
                "Item tidak tersedia",
          sku_code: detail.sku?.sku_code || 
                   detail.sku_code || 
                   detail.sku?.code || 
                   "SKU tidak tersedia",
          warehouse: detail.sku?.warehouse?.name || 
                    detail.warehouse?.name || 
                    "Gudang tidak tersedia",
          necessity: item.necessity || "Tidak disebutkan",
          loan_date: null,
          request_date: item.request_date,
          id: item.id,
        });
      });
    } else {
      // Fallback jika tidak ada details
      items.push({
        name: "Item tidak tersedia",
        sku_code: "SKU tidak tersedia",
        warehouse: "Gudang tidak tersedia",
        necessity: item.necessity || "Tidak disebutkan",
        loan_date: null,
        request_date: item.request_date,
        id: item.id,
      });
    }
  }
  
  return items;
};

export default function TransactionReceipt() {
  const [type, setType] = useState("loan");
  const [transactions, setTransactions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = type === "loan" ? API_LOANS : API_REQUEST;
      const res = await axios.get(url);

      // Handle response format
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data?.data && Array.isArray(res.data.data)) {
        data = res.data.data;
      } else if (res.data?.items && Array.isArray(res.data.items)) {
        data = res.data.items;
      }

      // Simpan data transaksi asli
      setTransactions(data);
      
      // Buat data untuk table (flatten details)
      const tableItems = [];
      data.forEach(transaction => {
        const items = getAllItemsFromDetails(transaction, type);
        tableItems.push(...items);
      });
      
      setTableData(tableItems);
      
      // Set selected item ke pertama di table data jika ada
      if (tableItems.length > 0) {
        setSelectedItem(tableItems[0]);
      } else {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setTransactions([]);
      setTableData([]);
      setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  };

  // Format selected item untuk detail view
  const getFormattedSelectedItem = () => {
    if (!selectedItem) return null;
    
    // Ambil transaksi asli berdasarkan ID
    const originalTransaction = transactions.find(t => t.id === selectedItem.id);
    if (!originalTransaction) return selectedItem;
    
    const itemData = extractItemData(originalTransaction, type);
    
    return {
      ...originalTransaction,
      item_name: itemData.name,
      sku_code: itemData.sku_code,
      warehouse_name: itemData.warehouse,
      return_date: type === "loan" ? getLoanReturnDate(originalTransaction) : null,
    };
  };

  const renderGeneralInfo = () => {
    const formattedItem = getFormattedSelectedItem();
    if (!formattedItem) return null;

    // ================== LOAN ==================
    if (type === "loan") {
      return (
        <div className="grid grid-cols-2 gap-6 text-sm">
          <Info label="Jenis Transaksi" value="Meminjam" />
          <Info 
            label="SKU Code" 
            value={getSafeValue(formattedItem.sku_code)} 
          />

          <Info 
            label="Nama Peminjam" 
            value={getSafeValue(formattedItem.name)} 
          />
          <Info 
            label="Nama Item" 
            value={getSafeValue(formattedItem.item_name)} 
          />

          <Info
            label="Tanggal Peminjaman"
            value={formatDateTime(formattedItem.loan_date)}
          />
          <Info
            label="Tanggal Pengembalian"
            value={formattedItem.return_date ? formatDateTime(formattedItem.return_date) : "Belum ditentukan"}
          />

          <Info
            label="Lokasi Asal"
            value={getSafeValue(formattedItem.warehouse_name)}
          />
          <Info 
            label="Kebutuhan" 
            value={getSafeValue(formattedItem.necessity)} 
          />
        </div>
      );
    }

    // ================== REQUEST ==================
    return (
      <div className="grid grid-cols-2 gap-6 text-sm">
        <Info label="Jenis Transaksi" value="Meminta" />
        <Info 
          label="Nama Peminta" 
          value={getSafeValue(formattedItem.name)} 
        />
        <Info 
          label="SKU Code" 
          value={getSafeValue(formattedItem.sku_code)} 
        />
        <Info
          label="Tanggal Transaksi"
          value={formatDateTime(formattedItem.request_date)}
        />
        <Info 
          label="Kebutuhan" 
          value={getSafeValue(formattedItem.necessity)} 
        />
        <Info 
          label="Lokasi Asal" 
          value={getSafeValue(formattedItem.warehouse_name)} 
        />
        <Info 
          label="Nama Item" 
          value={getSafeValue(formattedItem.item_name)} 
        />
      </div>
    );
  };

  // Handler untuk klik row di table
  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-xl font-semibold">Detail Transaksi</h1>

          <select
            className="border rounded-lg px-3 py-2 text-sm w-full sm:w-auto"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="loan">Meminjam Item</option>
            <option value="request">Meminta Item</option>
          </select>
        </div>

        {/* Informasi Umum */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-4 text-lg">
            Informasi Umum Transaksi
          </h2>
          {selectedItem ? renderGeneralInfo() : (
            <p className="text-gray-500 text-sm">Tidak ada transaksi yang dipilih</p>
          )}
        </div>

        {/* Daftar Transaksi */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b px-6 py-4 font-semibold text-lg">
            Daftar Item Transaksi
          </div>

          {loading ? (
            <div className="p-6">
              <p className="text-sm text-center">Memuat data...</p>
            </div>
          ) : tableData.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-gray-500 text-center">
                Tidak ada data transaksi
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left">No</th>
                    <th className="px-6 py-3 text-left">Nama {type === "loan" ? "Peminjam" : "Peminta"}</th>
                    <th className="px-6 py-3 text-left">SKU Code</th>
                    <th className="px-6 py-3 text-left">Nama Item</th>
                    <th className="px-6 py-3 text-left">Gudang</th>
                    <th className="px-6 py-3 text-left">Kebutuhan</th>
                    <th className="px-6 py-3 text-left">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item, i) => (
                    <tr
                      key={`${item.id}-${i}`}
                      onClick={() => handleRowClick(item)}
                      className={`cursor-pointer border-b hover:bg-blue-50 transition-colors ${
                        selectedItem?.id === item.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-3">{i + 1}</td>
                      <td className="px-6 py-3 font-medium">
                        {getSafeValue(item.name)}
                      </td>
                      <td className="px-6 py-3">
                        {getSafeValue(item.sku_code)}
                      </td>
                      <td className="px-6 py-3">
                        {getSafeValue(item.name)}
                      </td>
                      <td className="px-6 py-3">
                        {getSafeValue(item.warehouse)}
                      </td>
                      <td className="px-6 py-3">
                        {getSafeValue(item.necessity)}
                      </td>
                      <td className="px-6 py-3">
                        {type === 'loan' 
                          ? formatDateTime(item.loan_date)
                          : formatDateTime(item.request_date)
                        }
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

function Info({ label, value, className = "" }) {
  return (
    <div>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className={`font-medium ${className}`}>
        {value || "Data tidak tersedia"}
      </p>
    </div>
  );
}