import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Database,
  Layers,
  Sparkles
} from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Package },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Orders", path: "/orders", icon: ShoppingCart }
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-slate-100 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* BRANDING/LOGO LINE */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/30">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white font-sans uppercase">
            Inventory & Order Management System
          </h1>
        </div>
      </div>

      {/* NAVIGATION TREE */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider px-3 uppercase block mb-3">
          Core Modules
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition duration-150 group ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>


    </aside>
  );
}
