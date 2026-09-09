"use client";

import { useEffect, useState } from "react";
import {
  Search,
  DollarSign,
  Loader2,
  Crown,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface AdminUser {
  id: number;
  name: string;
  username: string;
  phone: string;
  role: string;
  status: string;
  sponsor_username: string;
  sponsor_name: string;
  sponsor_phone: string;
  accumulated_pv: string;
  sp: string;
  gp: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Adjustment Modal State
  const [adjustUserId, setAdjustUserId] = useState<string>("");
  const [walletField, setWalletField] = useState<string>("current_balance");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [adjusting, setAdjusting] = useState<boolean>(false);
  const [distributing, setDistributing] = useState<boolean>(false);

  // Reset Password State
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err: any) {
      toast.error("Failed to load admin management data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleStatusChange = async (userId: number, newStatus: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      if (res.data?.success) {
        toast.success(`User #${userId} → ${newStatus}`);
        fetchAdminData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId || !amount) {
      toast.error("Please fill in user ID and amount");
      return;
    }

    try {
      setAdjusting(true);
      const res = await api.post("/admin/adjustments", {
        user_id: parseInt(adjustUserId),
        wallet_field: walletField,
        amount: parseFloat(amount),
        description: description || "Admin Wallet Adjustment",
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Wallet balance adjusted successfully!");
        setAdjustUserId("");
        setAmount("");
        setDescription("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Adjustment failed");
    } finally {
      setAdjusting(false);
    }
  };

  const filteredUsers = users.filter(
    (u) => u.phone.includes(search) || String(u.id).includes(search)
  );

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setResetting(true);
      const res = await api.put(`/admin/users/${resetUserId}/reset-password`, { new_password: newPassword });
      if (res.data?.success) {
        toast.success(res.data.message || "Password reset successfully!");
        setResetUserId(null);
        setNewPassword("");
      } else {
        toast.error(res.data?.message || "Failed to reset password");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">

        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold px-4 py-2 text-sm gap-2 shadow-lg shadow-gold-500/20">
            <DollarSign className="h-4 w-4" /> Adjust Wallet Balance
          </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <form onSubmit={handleWalletAdjustment}>
                <DialogHeader>
                  <DialogTitle className="text-gold-400 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" /> Admin Wallet Adjustment
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground text-xs">
                    Directly credit or debit a user's wallet field. Logged in audit trail.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">User ID</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 101"
                      value={adjustUserId}
                      onChange={(e) => setAdjustUserId(e.target.value)}
                      className="bg-secondary/40 border-border/60 text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Target Wallet Field</Label>
                    <Select value={walletField} onValueChange={(val) => setWalletField(val || "current_balance")}>
                      <SelectTrigger className="bg-secondary/40 border-border/60 text-sm">
                        <SelectValue placeholder="Select Field" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="current_balance">Current Balance</SelectItem>
                        <SelectItem value="daily_club_bonus">Daily ROI / Club Bonus</SelectItem>
                        <SelectItem value="shareholder_club">Shareholder Club</SelectItem>
                        <SelectItem value="hajj_club">Hajj Club</SelectItem>
                        <SelectItem value="salary_club">Salary Club</SelectItem>
                        <SelectItem value="reward_point">Reward Point</SelectItem>
                        <SelectItem value="monthly_prize_point">Monthly Prize Point</SelectItem>
                        <SelectItem value="hajj_lottery_club">Hajj Lottery Club</SelectItem>
                        <SelectItem value="due_account">Due Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Amount (Negative to debit)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 500 or -200"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-secondary/40 border-border/60 font-mono text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Reason / Description</Label>
                    <Input
                      type="text"
                      placeholder="e.g. Manual correction"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-secondary/40 border-border/60 text-sm"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={adjusting} className="bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold w-full">
                    {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Adjustment"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/70 border border-gold-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold-400">{users.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border border-emerald-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {users.filter((u) => u.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border border-rose-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Banned Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-400">
              {users.filter((u) => u.status === "banned").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management Table */}
      <Card className="bg-card/70 border border-border/60 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">User Accounts</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Manage user activation statuses and roles.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search User ID or Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/40 border-border/40 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-gold-400" />
              <span>Loading users list...</span>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">User</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Contact</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Referral ID</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Points</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Active Packages</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Role</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Joined</TableHead>
                    <TableHead className="text-xs font-semibold uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-bold text-gold-400">#{u.id} {u.username && `(${u.username})`}</div>
                        <div className="text-[10px] text-muted-foreground">{u.name || "No Name"}</div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{u.phone}</TableCell>
                      <TableCell>
                        {u.sponsor_phone ? (
                          <>
                            <div className="text-xs font-bold text-emerald-400">{u.sponsor_phone}</div>
                            <div className="text-[10px] text-muted-foreground">{u.sponsor_name || u.sponsor_username}</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Admin/None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[11px] font-mono">
                          <span className="text-blue-400">PV: {Number(u.accumulated_pv || 0).toFixed(2)}</span>
                          <span className="text-pink-400">SP: {Number(u.sp || 0).toFixed(2)}</span>
                          <span className="text-yellow-400">GP: {Number(u.gp || 0).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {Number(u.accumulated_pv || 0) >= 1000 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full w-fit">Customer</span>}
                          {Number(u.sp || 0) >= 5000 && <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-0.5 rounded-full w-fit">Shareholder</span>}
                          {Number(u.gp || 0) >= 5000 && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full w-fit">Gold</span>}
                          {Number(u.accumulated_pv || 0) < 1000 && Number(u.sp || 0) < 5000 && Number(u.gp || 0) < 5000 && (
                            <span className="text-[10px] text-muted-foreground">No Package</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-xs font-medium">{u.role}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            u.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : u.status === "banned"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {u.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(u.id, "active")}
                            className="h-7 text-[11px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          >
                            Activate
                          </Button>
                        )}
                        {u.status !== "banned" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(u.id, "banned")}
                            className="h-7 text-[11px] border-rose-500/30 text-rose-400 hover:bg-rose-500/10 mt-1"
                          >
                            Ban
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResetUserId(u.id)}
                          className="h-7 text-[11px] border-blue-500/30 text-blue-400 hover:bg-blue-500/10 mt-1"
                        >
                          Pass
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetUserId !== null} onOpenChange={(open) => !open && setResetUserId(null)}>
        <DialogContent className="bg-card border-border">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle className="text-blue-400 flex items-center gap-2">
                <Zap className="h-5 w-5" /> Reset User Password
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs">
                Enter a new password for User ID #{resetUserId}. They will be able to log in immediately with this.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">New Password</Label>
                <Input
                  type="text"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary/40 border-border/60 text-sm"
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetUserId(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetting} className="bg-blue-600 hover:bg-blue-500 text-white">
                {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
