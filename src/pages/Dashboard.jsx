import React, { useState ,useEffect} from "react";
import { useInventory } from "../context/InventoryContext";
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Plus,
  CheckCircle,
  Search,
  Activity,
  ArrowUp,
  RefreshCw,
  FileSpreadsheet,
  Info,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { products, customers, orders, updateProduct } = useInventory();

  // Low stock threshold state, dynamically adjustable by the user
  const [selectedThreshold, setSelectedThreshold] = useState(3);
  const [lowStockSearch, setLowStockSearch] = useState("");
  const [restockQty, setRestockQty] = useState(15);
  const [isRestockSuccess, setIsRestockSuccess] = useState(null);
  const [grossSalesSum, setGrossSalesSum] = useState(0);

  // Computed metrics
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalOrders = orders.length;

  // const grossSalesSum = orders.reduce((acc, curr) => acc + curr.total_amount, 0);
  const averageOrderValue = totalOrders > 0 ? grossSalesSum / totalOrders : 0;

  // Compute products below selected threshold
  const lowStockItems = products.filter(
    (product) => product.quantity_in_stock <= selectedThreshold
  );

  const totalInStockQty = products.reduce((acc, curr) => acc + curr.quantity_in_stock, 0);

  // Filter low stock items based on search query
  const filteredLowStockItems = lowStockItems.filter((item) => {
    const query = lowStockSearch.trim().toLowerCase();
    return (
      item.sku.toLowerCase().includes(query) ||
      item.name.toLowerCase().includes(query)
    );
  });

  // Dynamic distribution counts by SKU prefix category
  const getCategoryMetrics = () => {
    const categories = {};
    products.forEach((p) => {
      const prefix = p.sku.split("-")[0] || "OTHER";
      categories[prefix] = (categories[prefix] || 0) + p.quantity_in_stock;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const categoryData = getCategoryMetrics();
  const maxCategoryValue = Math.max(...categoryData.map((d) => d.value), 1);

  // Handler for quick dashboard restock execution
  const handleQuickRestock = async (product) => {
    try {
      const newStock = product.quantity_in_stock + restockQty;
      await updateProduct(product.id, {
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity_in_stock: newStock,
        description: product.description || ""
      });
      setIsRestockSuccess(`Successfully replenished ${product.sku} with +${restockQty} units.`);
      setTimeout(() => setIsRestockSuccess(null), 4000);
    } catch (err) {
      console.error(err.message || "Failed to execute restock operations.");
    }
  };

  useEffect(() => {
  if (!orders?.length) return;

  const total = orders.reduce((sum, order) => {
    return sum + Number(order.total_amount || 0);
  }, 0);

  setGrossSalesSum(total);
}, [orders]);

  return (
    <div id="dashboard-root" className="space-y-8 animate-fadeIn">
      
      {/* HEADER OPERATIONS PANEL */}
      <div id="dashboard-header" className="flex flex-col md:flex-row md:items-center md:justify-between justify-start gap-4">
        <div>
          <h2 id="dashboard-title" className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            Operations Intelligence Dashboard
          </h2>
          <p id="dashboard-subtitle" className="text-sm text-slate-500 mt-1">
            Real-time analytics engine, current order ledger records, and multi-variable stock alerts.
          </p>
        </div>
        
        <div id="dashboard-quick-actions" className="flex flex-wrap items-center gap-3">
          <Link
            id="btn-place-order"
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 hover:text-slate-900 transition duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            Place New Order
          </Link>
          <Link
            id="btn-add-sku"
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-xl text-white text-xs font-semibold shadow-md shadow-indigo-600/10 hover:bg-indigo-700 hover:shadow-indigo-600/20 transition duration-155 cursor-pointer"
          >
            <Package className="h-4 w-4" />
            Add Product SKU
          </Link>
        </div>
      </div>

      {/* KEY METRICS GRID */}
      <div id="metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* CARD 1: PRODUCTS METRIC */}
        <div id="metric-card-products" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Catalog Inventory
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {totalProducts}
                </span>
                <span className="text-xs text-slate-405 font-medium">SKUs registered</span>
              </div>
            </div>
            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <Package className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Cumulative stock volume:</span>
            <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{totalInStockQty} items</span>
          </div>
        </div>

        {/* CARD 2: CUSTOMERS METRIC */}
        <div id="metric-card-customers" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Enrolled Customers
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {totalCustomers}
                </span>
                <span className="text-xs text-slate-405 font-medium">customer profiles</span>
              </div>
            </div>
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
              <Users className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Customer status ledger:</span>
            <span className="font-mono font-bold text-emerald-650 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              100% active
            </span>
          </div>
        </div>

        {/* CARD 3: ORDERS METRIC */}
        <div id="metric-card-orders" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Completed Orders
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {totalOrders}
                </span>
                <span className="text-xs text-slate-405 font-medium">invoices closed</span>
              </div>
            </div>
            <span className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
              <ShoppingCart className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Average invoice sales value:</span>
            <span className="font-mono font-bold text-slate-805">₹{averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* CARD 4: REVENUE METRIC */}
        <div id="metric-card-revenue" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400 font-mono tracking-wider uppercase block">
                Gross Financial Sales
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
       {grossSalesSum > 0 ? (
  `₹${grossSalesSum.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
) : (
  "₹0.00"
)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">INR</span>
              </div>
            </div>
            <span className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </span>
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-emerald-600 flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              Sales tracker live
            </span>
            <span className="text-slate-400 font-mono font-normal">Real-time sync</span>
          </div>
        </div>

      </div>

      {/* REPLENISHMENT STATUS FEEDBACK CHANNEL */}
      {isRestockSuccess && (
        <div id="restock-success-toast" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-3 shadow-sm animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold font-sans">{isRestockSuccess}</span>
        </div>
      )}

      {/* ANALYTICS VISUALIZATION PANEL */}
      <div id="dashboard-analytics-viz" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              Stock Asset Allocation Distribution
            </h3>
            <p className="text-xs text-slate-450 mt-0.5">
              Comparison breakdown of available units indexed across standard SKU prefix departments.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 p-1.5 rounded-xl text-[10px] font-mono uppercase text-slate-500">
            <span className="font-bold">Total registered items:</span>
            <span className="bg-blue-600 text-white rounded px-2 py-0.5 font-bold">
              {products.length} Products
            </span>
          </div>
        </div>

        {/* DYNAMIC COMPONENT BAR GRAPHICS */}
        <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* BAR GRAPH DESIGN WITH DIRECT DATA */}
          <div className="space-y-4">
            {categoryData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No inventory asset prefixes found. Add products to build standard departments.
              </div>
            ) : (
              categoryData.map((dept) => {
                const percentage = (dept.value / maxCategoryValue) * 100;
                return (
                  <div key={dept.name} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center font-mono">
                      <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded text-[10px]">
                        Department [{dept.name}]
                      </span>
                      <span className="font-bold text-slate-900">
                        {dept.value} item{dept.value === 1 ? "" : "s"} in stock
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner flex border border-slate-150">
                      <div
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                        className="bg-gradient-to-r from-indigo-500 to-indigo-650 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* VISUAL QUICK STATS PANEL ON RIGHT */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 space-y-4">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Info className="h-4 w-4 text-slate-400" />
              Warehouse Allocation Facts
            </h4>
            
            <div className="divide-y divide-slate-150 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">High Performer Portfolio:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {products.length > 0
                    ? products.reduce((prev, current) => (prev.price > current.price ? prev : current)).sku
                    : "None"}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Highest Physical Volume:</span>
                <span className="font-bold text-indigo-650 font-mono">
                  {products.length > 0
                    ? products.reduce((prev, current) => (prev.quantity_in_stock > current.quantity_in_stock ? prev : current)).sku
                    : "None"}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-500">Depleted items (0 stock):</span>
                <span className="font-bold text-rose-600 font-mono">
                  {products.filter((p) => p.quantity_in_stock === 0).length} SKU(s)
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* INTERACTIVE ALERTS AND RECENT METRICS ROW */}
      <div id="interactive-tables-container" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: DETAILED LOW STOCK INTERACTIVE TABLE (7 COLS) */}
        <section id="low-stock-alert-section" className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          
          {/* HEADER ROW WITH ADJUSTABLE SETTING */}
          <div className="p-5 border-b border-slate-150 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4.5 w-4.5 text-amber-500 ${lowStockItems.length > 0 ? "animate-bounce" : ""}`} />
              <div>
                <h3 className="font-extrabold text-sm text-slate-800">
                  Critical Low Stock Alert Table
                </h3>
                <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                  CRITICAL THRESHOLD LEVEL STATUS
                </p>
              </div>
            </div>

            {/* DYNAMIC CONFIG CONTROLS */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase whitespace-nowrap">
                Set Alert Guardrail:
              </span>
              <select
                id="threshold-selector"
                value={selectedThreshold}
                onChange={(e) => setSelectedThreshold(parseInt(e.target.value))}
                className="bg-white border border-slate-200 rounded-lg text-xs py-1.5 px-2.5 text-slate-700 font-mono font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value={1}>&le; 1 unit</option>
                <option value={3}>&le; 3 units (Standard)</option>
                <option value={5}>&le; 5 units</option>
                <option value={10}>&le; 10 units</option>
              </select>
            </div>
          </div>

          {/* TABLE CONSOLE CONTROLS */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50/30">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-450" />
              <input
                id="low-stock-search-input"
                type="text"
                placeholder="Filter low stock list..."
                value={lowStockSearch}
                onChange={(e) => setLowStockSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 placeholder:text-slate-400 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Restock Factor:</span>
              <input
                id="restock-qty-input"
                type="number"
                min="1"
                placeholder="Qty"
                value={restockQty}
                onChange={(e) => setRestockQty(parseInt(e.target.value) || 1)}
                className="w-14 bg-white border border-slate-250 rounded-lg text-center py-1 font-mono text-xs text-slate-800 focus:outline-none focus:border-indigo-505"
              />
              <span className="text-[10px] text-slate-400 font-mono">units</span>
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-x-auto">
            {filteredLowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-650">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-slate-900 font-extrabold text-xs">A-OK. Stock Margins Safe</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                    Zero registered products fall below the active visual parameters.
                  </p>
                </div>
              </div>
            ) : (
              <table id="low-stock-table" className="w-full text-left border-collapse min-w-[500px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-mono text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <th className="px-4 py-3">SKU Code</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-center">Remaining</th>
                    <th className="px-4 py-3 text-right">Quick Replenish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredLowStockItems.map((prod) => {
                    const isOut = prod.quantity_in_stock === 0;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition">
                        
                        <td className="px-4 py-3.5 font-mono text-[11px] font-bold text-slate-900">
                          <span className="bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded">
                            {prod.sku}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-sans">
                          <span className="font-semibold text-slate-800 block line-clamp-1">
                            {prod.name}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-slate-600">
                          ₹{prod.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {isOut ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                              Depleted
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono">
                              {prod.quantity_in_stock} unit{prod.quantity_in_stock === 1 ? "" : "s"}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <button
                            id={`btn-restock-${prod.sku}`}
                            onClick={() => handleQuickRestock(prod)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10.5px] px-3 py-1.5 rounded-lg transition shadow-sm cursor-pointer"
                          >
                            +{restockQty} Restock
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/products"
              className="text-xs font-semibold text-indigo-650 hover:text-indigo-700 hover:underline inline-flex items-center gap-1.5"
            >
              Configure Master SKUs Catalogs
              <span>&rarr;</span>
            </Link>
          </div>
        </section>

        {/* RIGHT COLUMN: RECENT ORDER LEDGER TABLE (5 COLS) */}
        <section id="recent-orders-section" className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-5 border-b border-slate-150 bg-slate-50/70 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Recent Billing Operations
              </h3>
              <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                CLOSED TRANSACTIONS LEDGER
              </p>
            </div>
            <span className="text-[10px] bg-slate-200/50 text-slate-600 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              LATEST TRANS
            </span>
          </div>

          <div className="p-5 flex-grow overflow-y-auto max-h-[380px] space-y-4">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="p-3 bg-slate-50 rounded-full text-slate-450">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-slate-850 font-extrabold text-xs">No Placed Orders</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
                    Complete invoice checkout actions to display billing receipts.
                  </p>
                </div>
              </div>
            ) : (
              orders.slice(0, 5).map((ord) => {
                const buyer = customers.find((c) => c.id === ord.customer_id);
                return (
                  <div key={ord.id} className="border border-slate-150 rounded-xl p-3.5 hover:bg-slate-50/50 transition flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      
                      {/* BUYER AND INVOICE REF */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-805 truncate block max-w-[150px]">
                          {buyer ? buyer.full_name : `Archived Guest Accounts`}
                        </span>
                        <span className="font-mono text-[10px] text-indigo-650 font-extrabold bg-indigo-50 border border-indigo-150/40 px-1.5 py-0.5 rounded">
                          INV-{ord.id}
                        </span>
                      </div>

                      {/* QUANTITIES & DATE stamp */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Items: {ord.items.length} product units</span>
                        <span>
                          {new Date(ord.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 self-center">
                      <span className="font-mono font-bold text-slate-900 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg block">
                        ₹{ord.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex-shrink-0">
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-650 hover:text-indigo-700 hover:underline inline-flex items-center gap-1.5"
            >
              Analyze Complete Invoicing Ledger
              <span>&rarr;</span>
            </Link>
          </div>
        </section>

      </div>

    </div>
  );
}
