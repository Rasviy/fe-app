import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../pages/layout";

const API_LOANS = "http://localhost:3000/loans";
const API_REQUEST = "http://localhost:3000/item-movement";

/* ================= UTIL ================= */

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

const getSafeValue = (value, fallback = "Data tidak tersedia") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

/* ================= EXTRACT ITEM ================= */

const extractItemData = (item, type) => {
  const detail =
    type === "loan"
      ? item.loan_details?.[0]
      : item.details?.[0];

  return {
    name: detail?.sku?.item?.name || "",
    sku_code: detail?.sku?.code || "",
    warehouse: detail?.sku?.warehouse?.name || "",
  };
};

const getLoanReturnDate = (loan) => {
  const detail = loan.loan_details?.[0];
  if (detail?.return_date) return detail.return_date;

  if (loan.loan_date) {
    return new Date(
      new Date(loan.loan_date).getTime() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();
  }
  return null;
};

/* ================= FLATTEN TABLE ================= */

const getAllItemsFromDetails = (item, type) => {
  const rows = [];

  if (type === "loan" && Array.isArray(item.loan_details)) {
    item.loan_details.forEach((detail) => {
      rows.push({
        id: item.id,
        person_name: item.name, // 🔥 FIX
        item_name: detail.sku?.item?.name,
        sku_code: detail.sku?.code,
        warehouse: detail.sku?.warehouse?.name,
        necessity: item.necessity,
        loan_date: item.loan_date,
      });
    });
  }

  if (type === "request" && Array.isArray(item.details)) {
    item.details.forEach((detail) => {
      rows.push({
        id: item.id,
        person_name: item.name,
        item_name: detail.sku?.item?.name,
        sku_code: detail.sku?.code,
        warehouse: detail.sku?.warehouse?.name,
        necessity: item.necessity,
        request_date: item.request_date,
      });
    });
  }

  return rows;
};

/* ================= COMPONENT ================= */

export default function TransactionReceipt() {
  const [type, setType] = useState("loan");
  const [transactions, setTransactions] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [type]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = type === "loan" ? API_LOANS : API_REQUEST;
      const res = await axios.get(url);

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setTransactions(data);

      const rows = [];
      data.forEach((t) => rows.push(...getAllItemsFromDetails(t, type)));

      setTableData(rows);
      setSelectedItem(rows[0] || null);
    } catch (err) {
      console.error(err);
      setTableData([]);
      setSelectedItem(null);
    } finally {
      setLoading(false);
    }
  };

  const getFormattedSelectedItem = () => {
    if (!selectedItem) return null;

    const trx = transactions.find((t) => t.id === selectedItem.id);
    if (!trx) return selectedItem;

    const itemData = extractItemData(trx, type);

    return {
      ...trx,
      person_name: trx.name, // 🔥 FIX
      item_name: itemData.name,
      sku_code: itemData.sku_code,
      warehouse_name: itemData.warehouse,
      return_date: type === "loan" ? getLoanReturnDate(trx) : null,
    };
  };

  const renderGeneralInfo = () => {
    const data = getFormattedSelectedItem();
    if (!data) return null;

    return (
      <div className="grid grid-cols-2 gap-6 text-sm">
        <Info label="Jenis Transaksi" value={type === "loan" ? "Meminjam" : "Meminta"} />
        <Info label={type === "loan" ? "Nama Peminjam" : "Nama Peminta"} value={data.person_name} />
        <Info label="Nama Item" value={data.item_name} />
        <Info label="SKU Code" value={data.sku_code} />
        <Info label="Tanggal Transaksi" value={formatDateTime(data.loan_date || data.request_date)} />
        {type === "loan" && (
          <Info label="Tanggal Pengembalian" value={formatDateTime(data.return_date)} />
        )}
        <Info label="Lokasi Asal" value={data.warehouse_name} />
        <Info label="Kebutuhan" value={data.necessity} />
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Detail Transaksi</h1>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="loan">Meminjam Item</option>
            <option value="request">Meminta Item</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="font-semibold mb-4">Informasi Umum Transaksi</h2>
          {renderGeneralInfo()}
        </div>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2 w-12 text-center font-semibold">No</th>
                  <th className="px-4 py-2 text-left font-semibold">Nama</th>
                  <th className="px-4 py-2 text-left font-semibold">SKU</th>
                  <th className="px-4 py-2 text-left font-semibold">Item</th>
                  <th className="px-4 py-2 text-left font-semibold">Gudang</th>
                  <th className="px-4 py-2 text-left font-semibold">Tanggal</th>
                </tr>
              </thead>
            <tbody>
              {tableData.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => setSelectedItem(row)}
                  className="cursor-pointer hover:bg-blue-50 border-b"
                >
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2">{row.person_name}</td>
                  <td className="px-4 py-2">{row.sku_code}</td>
                  <td className="px-4 py-2">{row.item_name}</td>
                  <td className="px-4 py-2">{row.warehouse}</td>
                  <td className="px-4 py-2">
                    {formatDateTime(row.loan_date || row.request_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {loading && (
            <p className="p-4 text-center text-sm">Memuat data...</p>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium">{getSafeValue(value)}</p>
    </div>
  );
}
