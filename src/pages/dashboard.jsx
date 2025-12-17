import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./layout";

/* =======================
   API
======================= */
const API_ITEMS = "http://localhost:3000/items";
const API_LOANS = "http://localhost:3000/loans";
const API_MOVEMENT = "http://localhost:3000/item-movement";

/* =======================
   BADGE
======================= */
function Badge({ type, text }) {
  const map = {
    success: "bg-green-100 text-green-700",
    danger: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[type]}`}>
      {text}
    </span>
  );
}

/* =======================
   DASHBOARD
======================= */
export default function Dashboard() {
  const [activeTable, setActiveTable] = useState("all");
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    newItems: 0,
    loans: 0,
    itemsOut: 0,
  });
  const [loading, setLoading] = useState(true);

  /* =======================
     FETCH STATS
  ======================= */
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [itemsRes, loansRes, outRes] = await Promise.all([
        axios.get(API_ITEMS),
        axios.get(API_LOANS),
        axios.get(API_MOVEMENT),
      ]);

      const items = itemsRes.data?.data || itemsRes.data || [];
      const loans = loansRes.data?.data || [];
      const outs = outRes.data?.data || [];

      const now = new Date();

      const newItems = items.filter(i =>
        (now - new Date(i.created_at)) / 36e5 <= 24
      );

      const monthOut = outs.filter(o => {
        const d = new Date(o.request_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      setStats({
        totalItems: items.length,
        newItems: newItems.length,
        loans: loans.length,
        itemsOut: monthOut.length,
      });
    } catch (err) {
      console.error(err);
    }
  };

  /* =======================
     FETCH TABLE
  ======================= */
  useEffect(() => {
    fetchTableData();
  }, [activeTable]);

  const fetchTableData = async () => {
    setLoading(true);
    try {
      let res;

      if (activeTable === "loan") {
        res = await axios.get(API_LOANS);
        setData(res.data?.data || []);
      } 
      else if (activeTable === "out") {
        res = await axios.get(API_MOVEMENT);
        setData(res.data?.data || []);
      } 
      else {
        res = await axios.get(API_ITEMS);
        const items = res.data?.data || res.data || [];

        if (activeTable === "in") {
          const now = new Date();
          setData(items.filter(i =>
            (now - new Date(i.created_at)) / 36e5 <= 24
          ));
        } else {
          setData(items);
        }
      }
    } catch (err) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, here’s a summary of your inventory.
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard title="Total Item Types" value={stats.totalItems}
            badge={<Badge type="success" text="+ updated" />}
            active={activeTable === "all"}
            onClick={() => setActiveTable("all")}
          />
          <StatCard title="New Items (24h)" value={stats.newItems}
            badge={<Badge type="warning" text="new" />}
            active={activeTable === "in"}
            onClick={() => setActiveTable("in")}
          />
          <StatCard title="Loans Active" value={stats.loans}
            badge={<Badge type="info" text="borrowing" />}
            active={activeTable === "loan"}
            onClick={() => setActiveTable("loan")}
          />
          <StatCard title="Items Out This Month" value={stats.itemsOut}
            badge={<Badge type="danger" text="out" />}
            active={activeTable === "out"}
            onClick={() => setActiveTable("out")}
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading...</div>
          ) : (
            renderTable(activeTable, data)
          )}
        </div>
      </div>
    </Layout>
  );
}

/* =======================
   STAT CARD
======================= */
function StatCard({ title, value, badge, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-6 transition
        ${active ? "bg-blue-50 border-blue-500" : "bg-white hover:bg-gray-50"}`}
    >
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">{value}</h2>
        {badge}
      </div>
    </div>
  );
}

/* =======================
   TABLE RENDER
======================= */
function renderTable(type, data) {
  /* ITEMS */
  if (type === "all" || type === "in") {
    return table(
      ["Name", "Unit", "Category", "Supplier", "Stock", "Code"],
      data.map(i => [
        i.name,
        i.unit?.name || "-",
        i.category?.name || "-",
        i.supplier?.name || "-",
        i.stock,
        i.code,
      ])
    );
  }

  /* LOANS */
  if (type === "loan") {
    return table(
      ["Name", "Loan Date", "Return Date", "Qty", "Status"],
      data.map(l => {
        const details = l.loan_details || [];
        const qty = details.reduce((s, d) => s + (d.qty || 0), 0);

        const returnDate = l.return_date
          ? new Date(l.return_date)
          : null;

        const returned = details.some(d => d.returned_at);
        const late = returnDate && new Date() > returnDate && !returned;

        let status = <Badge type="info" text="Borrowing" />;
        if (returned) status = <Badge type="success" text="Returned" />;
        if (late) status = <Badge type="danger" text="Late Return" />;

        return [
          l.name,
          new Date(l.loan_date).toLocaleDateString("id-ID"),
          returnDate ? returnDate.toLocaleDateString("id-ID") : "-",
          qty,
          status,
        ];
      })
    );
  }

  /* ITEM OUT */
  return table(
    ["Name", "Email", "Necessity", "Date"],
    data.map(o => [
      o.name,
      o.email,
      o.necessity,
      new Date(o.request_date).toLocaleDateString("id-ID"),
    ])
  );
}

/* =======================
   TABLE HELPER
======================= */
function table(headers, rows) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className="px-4 py-3">{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
