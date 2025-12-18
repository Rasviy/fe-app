import { useEffect, useState, useRef } from "react";
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
    neutral: "bg-gray-100 text-gray-700",
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
  const [newItems, setNewItems] = useState([]);
  
  // Refs untuk menyimpan data sebelumnya
  const prevStats = useRef({
    totalItems: 0,
    newItems: 0,
    loans: 0,
    itemsOut: 0,
  });
  
  const prevData = useRef({
    items: [],
    loans: [],
    movements: [],
  });

  /* =======================
     FETCH STATS & ITEMS
  ======================= */
  useEffect(() => {
    fetchStatsAndItems();
  }, []);

  const fetchStatsAndItems = async () => {
    try {
      const [itemsRes, loansRes, movementRes] = await Promise.all([
        axios.get(API_ITEMS),
        axios.get(API_LOANS),
        axios.get(API_MOVEMENT),
      ]);

      const items = itemsRes.data?.data || itemsRes.data || [];
      const loans = loansRes.data?.data || [];
      const movements = movementRes.data?.data || [];

      const now = new Date();

      // Filter item yang baru (kurang dari 24 jam)
      const freshItems = items.filter(i => {
        const createdDate = new Date(i.created_at);
        const hoursDiff = (now - createdDate) / 36e5;
        return hoursDiff <= 24;
      });

      // Filter item yang sudah lebih dari 24 jam (untuk total items)
      const oldItems = items.filter(i => {
        const createdDate = new Date(i.created_at);
        const hoursDiff = (now - createdDate) / 36e5;
        return hoursDiff > 24;
      });

      // Filter movement bulan ini
      const monthOut = movements.filter(m => {
        const d = new Date(m.request_date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      // Hitung perubahan dari data sebelumnya
      const changes = calculateChanges(
        { 
          totalItems: oldItems.length, 
          newItems: freshItems.length, 
          loans: loans.length, 
          itemsOut: monthOut.length 
        },
        prevStats.current,
        { items, loans, movements },
        prevData.current
      );

      setNewItems(freshItems);
      setStats({
        totalItems: oldItems.length,
        newItems: freshItems.length,
        loans: loans.length,
        itemsOut: monthOut.length,
      });

      // Update previous data
      prevStats.current = {
        totalItems: oldItems.length,
        newItems: freshItems.length,
        loans: loans.length,
        itemsOut: monthOut.length,
      };
      
      prevData.current = { 
        items, 
        loans, 
        movements 
      };

      // Set data awal untuk table "all"
      setData(oldItems);
    } catch (err) {
      console.error("Error fetching stats:", err);
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
        const loans = res.data?.data || [];
        
        const processedLoans = loans.map(loan => {
          const details = loan.loan_details || [];
          
          let returnDate = null;
          if (details.length > 0) {
            const dates = details
              .filter(d => d.return_date)
              .map(d => new Date(d.return_date));
            
            if (dates.length > 0) {
              returnDate = new Date(Math.max(...dates));
            }
          }
          
          return {
            ...loan,
            processed_return_date: returnDate
          };
        });
        
        setData(processedLoans);
      } 
      else if (activeTable === "out") {
        res = await axios.get(API_MOVEMENT);
        setData(res.data?.data || []);
      } 
      else if (activeTable === "in") {
        setData(newItems);
      }
      else {
        res = await axios.get(API_ITEMS);
        const items = res.data?.data || res.data || [];
        const now = new Date();
        
        const oldItems = items.filter(i => {
          const createdDate = new Date(i.created_at);
          const hoursDiff = (now - createdDate) / 36e5;
          return hoursDiff > 24;
        });
        
        setData(oldItems);
      }
    } catch (err) {
      console.error("Error fetching table data:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data setiap menit
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStatsAndItems();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Hitung perubahan untuk badges
  const calculateBadgeInfo = () => {
    const current = stats;
    const previous = prevStats.current;
    
    return {
      totalItems: {
        text: current.totalItems > previous.totalItems 
          ? `+${current.totalItems - previous.totalItems}`
          : "updated",
        type: current.totalItems > previous.totalItems ? "success" : "neutral",
        showChange: current.totalItems > previous.totalItems
      },
      
      newItems: {
        text: current.newItems > previous.newItems 
          ? `+${current.newItems - previous.newItems}`
          : "new",
        type: current.newItems > previous.newItems ? "warning" : "warning",
        showChange: current.newItems > previous.newItems
      },
      
      loans: {
        text: current.loans > previous.loans 
          ? `+${current.loans - previous.loans}`
          : "borrowing",
        type: current.loans > previous.loans ? "info" : "info",
        showChange: current.loans > previous.loans
      },
      
      itemsOut: {
        text: current.itemsOut > previous.itemsOut 
          ? `+${current.itemsOut - previous.itemsOut}`
          : "out",
        type: current.itemsOut > previous.itemsOut ? "danger" : "danger",
        showChange: current.itemsOut > previous.itemsOut
      },
    };
  };

  const badgeInfo = calculateBadgeInfo();

  return (
    <Layout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, here's a summary of your inventory.
            New items will appear in "New Items" table for 24 hours before moving to "Total Item Types".
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard 
            title="Total Item Types" 
            value={stats.totalItems}
            description="Items older than 24h"
            badge={
              <div className="flex flex-col items-end">
                {badgeInfo.totalItems.showChange && (
                  <span className="text-xs text-green-600 font-semibold mb-1">
                    +{stats.totalItems - prevStats.current.totalItems} new after 24h
                  </span>
                )}
                <Badge 
                  type={badgeInfo.totalItems.type} 
                  text={badgeInfo.totalItems.text} 
                />
              </div>
            }
            active={activeTable === "all"}
            onClick={() => setActiveTable("all")}
          />
          <StatCard 
            title="New Items (24h)" 
            value={stats.newItems}
            description="Fresh items (< 24h)"
            badge={
              <div className="flex flex-col items-end">
                {badgeInfo.newItems.showChange && (
                  <span className="text-xs text-yellow-600 font-semibold mb-1">
                    +{stats.newItems - prevStats.current.newItems} just added
                  </span>
                )}
                <Badge 
                  type={badgeInfo.newItems.type} 
                  text={badgeInfo.newItems.text} 
                />
              </div>
            }
            active={activeTable === "in"}
            onClick={() => setActiveTable("in")}
          />
          <StatCard 
            title="Loans Active" 
            value={stats.loans}
            description="Currently borrowed"
            badge={
              <div className="flex flex-col items-end">
                {badgeInfo.loans.showChange && (
                  <span className="text-xs text-blue-600 font-semibold mb-1">
                    +{stats.loans - prevStats.current.loans} borrowed
                  </span>
                )}
                <Badge 
                  type={badgeInfo.loans.type} 
                  text={badgeInfo.loans.text} 
                />
              </div>
            }
            active={activeTable === "loan"}
            onClick={() => setActiveTable("loan")}
          />
          <StatCard 
            title="Items Out This Month" 
            value={stats.itemsOut}
            description="Monthly movement"
            badge={
              <div className="flex flex-col items-end">
                {badgeInfo.itemsOut.showChange && (
                  <span className="text-xs text-red-600 font-semibold mb-1">
                    +{stats.itemsOut - prevStats.current.itemsOut} out
                  </span>
                )}
                <Badge 
                  type={badgeInfo.itemsOut.type} 
                  text={badgeInfo.itemsOut.text} 
                />
              </div>
            }
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
   HELPER: CALCULATE CHANGES
======================= */
function calculateChanges(currentStats, previousStats, currentData, previousData) {
  // Hitung item yang baru masuk ke total items (> 24 jam)
  const newToTotal = calculateNewToTotalItems(currentData.items, previousData.items);
  
  // Hitung item baru (< 24 jam)
  const newItems = calculateNewItems(currentData.items, previousData.items);
  
  // Hitung loans baru
  const newLoans = calculateNewLoans(currentData.loans, previousData.loans);
  
  // Hitung items out baru
  const newItemsOut = calculateNewItemsOut(currentData.movements, previousData.movements);
  
  return {
    totalItems: newToTotal,
    newItems: newItems,
    loans: newLoans,
    itemsOut: newItemsOut,
  };
}

/* =======================
   HELPER: CALCULATE NEW TO TOTAL ITEMS
======================= */
function calculateNewToTotalItems(currentItems, previousItems) {
  if (!previousItems || previousItems.length === 0) return 0;
  
  const now = new Date();
  
  // Item current yang sudah > 24 jam
  const currentOldItems = currentItems.filter(i => {
    const createdDate = new Date(i.created_at);
    const hoursDiff = (now - createdDate) / 36e5;
    return hoursDiff > 24;
  });
  
  // Item previous yang sudah > 24 jam
  const previousOldItems = previousItems.filter(i => {
    const createdDate = new Date(i.created_at);
    const hoursDiff = (now - createdDate) / 36e5;
    return hoursDiff > 24;
  });
  
  // Cari ID item yang baru masuk ke total
  const previousIds = new Set(previousOldItems.map(i => i.id));
  const newToTotal = currentOldItems.filter(i => !previousIds.has(i.id));
  
  return newToTotal.length;
}

/* =======================
   HELPER: CALCULATE NEW ITEMS
======================= */
function calculateNewItems(currentItems, previousItems) {
  if (!previousItems || previousItems.length === 0) return currentItems.length;
  
  const now = new Date();
  
  // Item current yang < 24 jam
  const currentNewItems = currentItems.filter(i => {
    const createdDate = new Date(i.created_at);
    const hoursDiff = (now - createdDate) / 36e5;
    return hoursDiff <= 24;
  });
  
  // Item previous yang < 24 jam
  const previousNewItems = previousItems.filter(i => {
    const createdDate = new Date(i.created_at);
    const hoursDiff = (now - createdDate) / 36e5;
    return hoursDiff <= 24;
  });
  
  // Cari ID item baru
  const previousIds = new Set(previousNewItems.map(i => i.id));
  const newItems = currentNewItems.filter(i => !previousIds.has(i.id));
  
  return newItems.length;
}

/* =======================
   HELPER: CALCULATE NEW LOANS
======================= */
function calculateNewLoans(currentLoans, previousLoans) {
  if (!previousLoans || previousLoans.length === 0) return currentLoans.length;
  
  // Cari loans baru (belum ada di previous)
  const previousIds = new Set(previousLoans.map(l => l.id));
  const newLoans = currentLoans.filter(l => !previousIds.has(l.id));
  
  return newLoans.length;
}

/* =======================
   HELPER: CALCULATE NEW ITEMS OUT
======================= */
function calculateNewItemsOut(currentMovements, previousMovements) {
  if (!previousMovements || previousMovements.length === 0) {
    const now = new Date();
    return currentMovements.filter(m => {
      const d = new Date(m.request_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }
  
  const now = new Date();
  const currentMonth = currentMovements.filter(m => {
    const d = new Date(m.request_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const previousMonth = previousMovements.filter(m => {
    const d = new Date(m.request_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  // Cari movements baru
  const previousIds = new Set(previousMonth.map(m => m.id));
  const newMovements = currentMonth.filter(m => !previousIds.has(m.id));
  
  return newMovements.length;
}

/* =======================
   STAT CARD
======================= */
function StatCard({ title, value, description, badge, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-6 transition relative
        ${active ? "bg-blue-50 border-blue-500" : "bg-white hover:bg-gray-50"}`}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      <div className="flex justify-between items-center">
        <div className="flex items-end">
          <h2 className="text-3xl font-bold mr-2">{value}</h2>
        </div>
        <div className="text-right">
          {badge}
        </div>
      </div>
    </div>
  );
}

/* =======================
   TABLE RENDER
======================= */
function renderTable(type, data) {
  /* ITEMS (all & in) */
  if (type === "all" || type === "in") {
    return table(
      ["Name", "Unit", "Category", "Supplier", "Stock", "Code", "Created"],
      data.map(i => [
        <div key={i.id} className="flex items-center">
          <span>{i.name}</span>
          {type === "in" && (
            <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              +1
            </span>
          )}
        </div>,
        i.unit?.name || "-",
        i.category?.name || "-",
        getSupplierName(i),
        <div key={i.id} className="flex items-center">
          <span className={`font-semibold ${i.stock <= 10 ? 'text-red-600' : 'text-green-600'}`}>
            {i.stock}
          </span>
        </div>,
        i.code,
        new Date(i.created_at).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short"
        })
      ])
    );
  }

  /* LOANS */
  if (type === "loan") {
    return table(
      ["Name", "Phone", "Email", "Necessity", "Loan Date", "Return Date", "Qty", "Status", "Note"],
      data.map(l => {
        const details = l.loan_details || [];
        const qty = details.reduce((s, d) => s + (d.qty || 0), 0);

        const loanDate = new Date(l.loan_date);
        
        let returnDate = l.processed_return_date;
        if (!returnDate && details.length > 0) {
          const detailWithReturnDate = details.find(d => d.return_date);
          returnDate = detailWithReturnDate ? new Date(detailWithReturnDate.return_date) : null;
        }
        
        const returned = details.some(d => d.returned_at);
        const late = returnDate && new Date() > returnDate && !returned;

        let status = <Badge type="info" text="Borrowing" />;
        if (returned) status = <Badge type="success" text="Returned" />;
        if (late) status = <Badge type="danger" text="Late" />;

        return [
          l.name || "-",
          l.phone_number || "-",
          l.email || "-",
          l.necessity || "-",
          loanDate.toLocaleString("id-ID", {
            dateStyle: "short",
            timeStyle: "short"
          }),
          returnDate ? returnDate.toLocaleString("id-ID", {
            dateStyle: "short",
            timeStyle: "short"
          }) : "-",
          qty,
          status,
          l.note || "-"
        ];
      })
    );
  }

  /* ITEM OUT (Movement) */
  return table(
    ["Name", "Phone", "Email", "Necessity", "Date"],
    data.map(o => [
      o.name || "-",
      o.phone_number || "-",
      o.email || "-",
      o.necessity || "-",
      new Date(o.request_date).toLocaleString("id-ID", {
        dateStyle: "short",
        timeStyle: "short"
      })
    ])
  );
}

/* =======================
   HELPER: GET SUPPLIER NAME
======================= */
function getSupplierName(item) {
  if (!item) return "-";
  
  if (typeof item.supplier === 'string') {
    return item.supplier || "-";
  }
  
  if (item.supplier && typeof item.supplier === 'object') {
    return item.supplier.name || "-";
  }
  
  return item.supplier || "-";
}

/* =======================
   TABLE HELPER
======================= */
function table(headers, rows) {
  if (rows.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-100">
        <tr>
          {headers.map((h, index) => (
            <th key={index} className="px-4 py-3 text-left font-medium text-gray-700">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y">
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="hover:bg-gray-50">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-4 py-3 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}