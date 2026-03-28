import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Users, Trash2, ShieldCheck } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير", user: "مستخدم", property_owner: "مالك عقار",
  broker: "وسيط", real_estate_office: "مكتب عقاري",
  developer: "مطوّر", service_provider: "مزوّد خدمة",
};
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 text-red-600 border-red-200",
  user: "bg-muted text-muted-foreground",
  property_owner: "bg-blue-500/10 text-blue-600 border-blue-200",
  broker: "bg-green-500/10 text-green-600 border-green-200",
  real_estate_office: "bg-purple-500/10 text-purple-600 border-purple-200",
  developer: "bg-orange-500/10 text-orange-600 border-orange-200",
  service_provider: "bg-teal-500/10 text-teal-600 border-teal-200",
};

const ALL_ROLES = ["user", "property_owner", "broker", "real_estate_office", "developer", "service_provider", "admin"];

interface UserRow {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) { navigate("/"); return; }
    void fetch("/api/admin/users", { credentials: "include" })
      .then(r => r.json() as Promise<UserRow[]>)
      .then(data => { setUsers(data); setLoading(false); });
  }, [isAdmin, isLoading]);

  const changeRole = async (id: number, role: string) => {
    setUpdatingId(id);
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setUsers(u => u.map(x => x.id === id ? { ...x, role } : x));
    setUpdatingId(null);
  };

  const deleteUser = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
    setUsers(u => u.filter(x => x.id !== id));
  };

  return (
    <Layout>
      <div className="space-y-6 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المستخدمين</h1>
          <p className="text-muted-foreground mt-1">{users.length} مستخدم مسجّل</p>
        </div>

        <Card className="border-border/60 overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20 py-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />المستخدمون
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-muted/30 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-5 py-3 font-medium">الاسم</th>
                      <th className="px-5 py-3 font-medium">اسم المستخدم</th>
                      <th className="px-5 py-3 font-medium">البريد</th>
                      <th className="px-5 py-3 font-medium">الدور</th>
                      <th className="px-5 py-3 font-medium">تاريخ التسجيل</th>
                      <th className="px-5 py-3 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{u.fullName}</td>
                        <td className="px-5 py-3 text-muted-foreground font-mono">@{u.username}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{u.email}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${ROLE_COLORS[u.role] ?? "bg-muted"}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              disabled={updatingId === u.id}
                              onChange={e => void changeRole(u.id, e.target.value)}
                              className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                            >
                              {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg h-8 px-2 text-destructive border-destructive/30"
                              onClick={() => void deleteUser(u.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
