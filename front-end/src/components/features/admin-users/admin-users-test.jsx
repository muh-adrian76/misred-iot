"use client";

// Test component untuk memastikan semua fitur admin users bekerja
import { useState } from "react";

export default function AdminUsersTest() {
  const [testUsers] = useState([
    {
      id: 1,
      name: "Admin Test",
      email: "admin@test.com",
      is_admin: true,
      whatsapp_notif: true,
      onboarding_completed: true,
      created_at: "2025-01-01T00:00:00Z",
      device_count: 2,
      dashboard_count: 1,
      alarm_count: 3
    },
    {
      id: 2,
      name: "User Test",
      email: "user@test.com",
      is_admin: false,
      whatsapp_notif: false,
      onboarding_completed: false,
      created_at: "2025-01-02T00:00:00Z",
      device_count: 1,
      dashboard_count: 0,
      alarm_count: 1
    }
  ]);

  const [filters, setFilters] = useState({
    role: "all",
    onboarding: "all",
    whatsapp: "all"
  });

  const [search, setSearch] = useState("");

  // Test filter functionality
  const filteredUsers = testUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(search.toLowerCase()) ||
                         user.email?.toLowerCase().includes(search.toLowerCase());
    
    const matchesRole = filters.role === "all" || 
                       (filters.role === "admin" && user.is_admin) ||
                       (filters.role === "user" && !user.is_admin);
    
    const matchesOnboarding = filters.onboarding === "all" ||
                             (filters.onboarding === "completed" && user.onboarding_completed) ||
                             (filters.onboarding === "not_completed" && !user.onboarding_completed);
    
    const matchesWhatsapp = filters.whatsapp === "all" ||
                           (filters.whatsapp === "enabled" && user.whatsapp_notif) ||
                           (filters.whatsapp === "disabled" && !user.whatsapp_notif);
    
    return matchesSearch && matchesRole && matchesOnboarding && matchesWhatsapp;
  });

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Users - Test Component</h1>
      
      {/* Test Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Test</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Cari nama atau email..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role:</label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Onboarding:</label>
            <select
              value={filters.onboarding}
              onChange={(e) => setFilters({...filters, onboarding: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="not_completed">Belum Selesai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp:</label>
            <select
              value={filters.whatsapp}
              onChange={(e) => setFilters({...filters, whatsapp: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">Semua Status</option>
              <option value="enabled">Aktif</option>
              <option value="disabled">Nonaktif</option>
            </select>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">
          Filter Results ({filteredUsers.length} dari {testUsers.length} users)
        </h2>
        <div className="space-y-2">
          {filteredUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.is_admin ? 'Admin' : 'User'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  user.onboarding_completed ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {user.onboarding_completed ? 'Onboarding OK' : 'Onboarding Pending'}
                </span>
                <span className={`px-2 py-1 text-xs rounded ${
                  user.whatsapp_notif ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  WA: {user.whatsapp_notif ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Test */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{filteredUsers.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-purple-600">
            {filteredUsers.filter(u => u.is_admin).length}
          </div>
          <div className="text-sm text-gray-600">Admin Users</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-green-600">
            {filteredUsers.filter(u => u.onboarding_completed).length}
          </div>
          <div className="text-sm text-gray-600">Onboarding Selesai</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">
            {filteredUsers.filter(u => u.whatsapp_notif).length}
          </div>
          <div className="text-sm text-gray-600">WhatsApp Aktif</div>
        </div>
      </div>
    </div>
  );
}
