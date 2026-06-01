import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { InventoryProvider } from "./context/InventoryContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";

export default function App() {
  return (
    <InventoryProvider>
      <HashRouter>
        <div className="flex flex-col lg:flex-row min-h-screen bg-slate-55 text-slate-900 font-sans antialiased">
          
          {/* STICKY ENTERPRISE SYSTEM NAVIGATION */}
          <Sidebar />

          {/* DYNAMIC CONTENT SPACE */}
          <div className="flex-1 flex flex-col min-w-0">
            
            {/* TOP HEADER DISPLAY */}
            <Header />

            {/* MOUNTED ROUTES CHANNELS */}
            <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/orders" element={<Orders />} />
              </Routes>
            </main>

          </div>
        </div>
      </HashRouter>
    </InventoryProvider>
  );
}
