"use client";

import { useEffect, useState } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Loader2, UserCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface NetworkMember {
  id: number;
  phone: string;
  status: string;
  joined_date: string;
  active_packages: string | null;
}

export default function NetworkPage() {
  const [level, setLevel] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [members, setMembers] = useState<NetworkMember[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  const fetchNetwork = async (lvl: number, pg: number) => {
    try {
      setLoading(true);
      const res = await api.get(`/network?level=${lvl}&page=${pg}&limit=10`);
      if (res.data?.success) {
        setMembers(res.data.data || []);
        setPagination(res.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch generation network");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork(level, page);
  }, [level, page]);

  const handleTabChange = (val: string) => {
    const newLvl = parseInt(val);
    setLevel(newLvl);
    setPage(1);
  };

  const filteredMembers = members.filter(
    (m) =>
      m.phone.includes(search) ||
      String(m.id).includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-gold-400" />
          <span>My Network Generations</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          View your downline team members across Generation Level 1 through 5.
        </p>
      </div>

      <Card className="bg-card/70 border border-border/60 shadow-xl">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Level Tabs */}
            <Tabs value={String(level)} onValueChange={handleTabChange} className="w-full sm:w-auto">
              <TabsList className="bg-secondary/60 p-1 border border-border/40 grid grid-cols-5 w-full sm:w-auto">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <TabsTrigger
                    key={lvl}
                    value={String(lvl)}
                    className="data-[state=active]:bg-gold-500 data-[state=active]:text-slate-950 font-bold text-xs px-3"
                  >
                    Gen {lvl}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ID or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary/40 border-border/40 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
              <span>Loading Generation {level} members...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">No members found in Generation {level}</p>
              <p className="text-xs">Invite users using your refer link to expand your downline network.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border/40">
                <Table>
                  <TableHeader className="bg-secondary/40">
                    <TableRow>
                      <TableHead className="text-xs uppercase font-semibold">Referral ID (Phone)</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">User ID</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">Account Status</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">Packages</TableHead>
                      <TableHead className="text-xs uppercase font-semibold">Joined Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
                      <TableRow key={member.id} className="hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-semibold text-gold-400">{member.phone}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{member.id}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              member.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {member.status === "active" ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            <span className="capitalize">{member.status}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">
                          {member.active_packages || "None"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(member.joined_date).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                  Showing Total <span className="font-semibold text-foreground">{pagination.total}</span> members in Level {level}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 border-border/40 text-xs gap-1"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <span className="text-xs font-medium px-2">
                    Page {page} of {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="h-8 border-border/40 text-xs gap-1"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
