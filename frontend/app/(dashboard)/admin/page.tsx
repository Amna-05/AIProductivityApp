"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminApi, SystemStats, UserListItem } from "@/lib/api/admin";
import { useAuthStore } from "@/lib/store/authStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, CheckCircle2, Shield, BarChart3, UserCog, UserX } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningUserId, setActioningUserId] = useState<number | null>(null);

  useEffect(() => {
    // Check admin access
    if (!authLoading && !isAdmin) {
      toast.error("Admin access required");
      router.push("/dashboard");
      return;
    }

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, authLoading, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsData, usersData] = await Promise.all([
        adminApi.getStats(),
        adminApi.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error: any) {
      console.error("Failed to fetch admin data:", error);
      toast.error(error.response?.data?.detail || "Failed to load admin data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    try {
      setActioningUserId(userId);
      const response = await adminApi.toggleAdmin(userId);
      toast.success(response.message);

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_superuser: !currentStatus } : user
      ));
    } catch (error: any) {
      console.error("Failed to toggle admin:", error);
      toast.error(error.response?.data?.detail || "Failed to update admin status");
    } finally {
      setActioningUserId(null);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      setActioningUserId(userId);
      const response = await adminApi.toggleActive(userId);
      toast.success(response.message);

      // Update local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error: any) {
      console.error("Failed to toggle active:", error);
      toast.error(error.response?.data?.detail || "Failed to update active status");
    } finally {
      setActioningUserId(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 font-medium mt-0.5">
          Manage users and view system statistics
        </p>
      </div>

      {/* System Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-indigo-700">Total Users</CardTitle>
              <div className="p-1.5 rounded-lg bg-indigo-100">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-700">Active Users</CardTitle>
              <div className="p-1.5 rounded-lg bg-emerald-100">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.active_users}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700">Admins</CardTitle>
              <div className="p-1.5 rounded-lg bg-blue-100">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.admin_users}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-amber-700">Total Tasks</CardTitle>
              <div className="p-1.5 rounded-lg bg-amber-100">
                <BarChart3 className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{stats.total_tasks}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-700">Completed Tasks</CardTitle>
              <div className="p-1.5 rounded-lg bg-purple-100">
                <CheckCircle2 className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.completed_tasks}</div>
              <p className="text-xs text-purple-600/70">
                {stats.total_tasks > 0
                  ? `${((stats.completed_tasks / stats.total_tasks) * 100).toFixed(1)}% completion`
                  : "No tasks"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <Card className="border-gray-100 shadow-sm">
        <CardHeader className="border-b border-gray-50 bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-lg font-bold text-gray-900">User Management</CardTitle>
          <CardDescription>
            Manage user accounts, admin privileges, and access
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="p-3 text-left text-sm font-medium">User</th>
                  <th className="p-3 text-left text-sm font-medium">Email</th>
                  <th className="p-3 text-left text-sm font-medium">Tasks</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Role</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </p>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.email}</td>
                    <td className="p-3">
                      <div className="text-sm">
                        <p>{user.task_count} total</p>
                        <p className="text-xs text-muted-foreground">
                          {user.completed_task_count} completed
                        </p>
                      </div>
                    </td>
                    <td className="p-3">
                      {user.is_active ? (
                        <Badge variant="default" className="bg-green-600">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      {user.is_superuser ? (
                        <Badge variant="default" className="bg-blue-600">
                          <Shield className="h-3 w-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline">User</Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAdmin(user.id, user.is_superuser)}
                          disabled={actioningUserId === user.id}
                        >
                          {actioningUserId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <UserCog className="h-3 w-3 mr-1" />
                              {user.is_superuser ? "Remove Admin" : "Make Admin"}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                          disabled={actioningUserId === user.id}
                        >
                          {actioningUserId === user.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              {user.is_active ? "Deactivate" : "Activate"}
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
