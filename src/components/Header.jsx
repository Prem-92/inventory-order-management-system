import React, { useState, useEffect } from "react";
import { 
  Clock, 
  HelpCircle, 
  Server, 
  Menu, 
  X,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Keep digital system clock fully updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Products", path: "/products", icon: Package },
    { name: "Customers", path: "/customers", icon: Users },
    { name: "Orders", path: "/orders", icon: ShoppingCart }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        
        {/* MOBILE TRIGGER & APP NAME */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition duration-150"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="lg:hidden flex items-center gap-2">
            <span className="font-bold text-slate-800 tracking-tight text-sm uppercase">InventoCore</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 font-medium font-sans">
            <span className="text-slate-500">Workspace</span>
            <span>&middot;</span>
            <span className="text-slate-700 capitalize font-semibold">
              {location.pathname === "/" ? "Dashboard Analytics" : location.pathname.substring(1)}
            </span>
          </div>
        </div>

        {/* METRICS & DIGITAL SYSTEM METEOR */}
        <div className="flex items-center gap-4">
          


          {/* ACTIVE STATUS DISPLAY UNIT */}
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider font-mono">
              Production Environment
            </span>
          </div>

        </div>

      </div>

      {/* MOBILE FULL SCREEN MENU OVERLAY */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-xl p-4 space-y-2 mt-0.5 animate-fadeIn">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-slate-350 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className="border-t border-slate-800 pt-3 mt-4 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>System clock:</span>
            <span>{currentTime || "Syncing..."}</span>
          </div>
        </div>
      )}
    </header>
  );
}
