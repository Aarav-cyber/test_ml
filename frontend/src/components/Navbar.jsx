import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid
} from "@heroicons/react/24/solid";

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: HomeIcon, iconSolid: HomeIconSolid },
    { path: "/logs", label: "Logs", icon: DocumentTextIcon, iconSolid: DocumentTextIconSolid },
    { path: "/strangers", label: "Strangers", icon: UserGroupIcon, iconSolid: UserGroupIconSolid },
    { path: "/integration", label: "Settings", icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/50 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-200">
              HS
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg">Home Security</span>
              <p className="text-xs text-gray-500 -mt-1">Smart Monitoring System</p>
            </div>
          </Link>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = isActive ? item.iconSolid : item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
