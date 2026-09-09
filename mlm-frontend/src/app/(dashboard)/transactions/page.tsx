"use client";

import { useEffect, useState } from "react";
import { History, Search, ArrowUpRight, ArrowDownLeft, Loader2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: string | number;
  category: string;
  description: string;
  wallet_field?: string;
  created_at: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const res = await api.get("/wallet");
        if (res.data?.success && res.data?.data?.transactions) {
          setTransactions(res.data.data.transactions);
        } else {
          // Fetch transactions list endpoint if available or fallback
          const txRes = await api.get("/admin/reports/sales").catch(() => null);
          if (txRes?.data?.data) {
            setTransactions(txRes.data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTx = transactions.filter(
    (tx) =>
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-gold-400" />
          <span>Transactions Ledger</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Complete historical record of your wallet credits, debits, referral bonuses, and fund transfers.
        </p>
      </div>

      <Card className="bg-card/70 border border-border/60 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">Transaction History</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Filter transactions by description or category.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/40 border-border/40 text-xs"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
              <span>Loading transaction history...</span>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <History className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-medium">No transactions recorded yet</p>
              <p className="text-xs">Your account transactions, referral bonuses, and transfers will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/40">
              <Table>
                <TableHeader className="bg-secondary/40">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Amount</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Category / Wallet</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Description</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTx.map((tx) => (
                    <TableRow key={tx.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            tx.type === "credit"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                          }`}
                        >
                          {tx.type === "credit" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          <span className="capitalize">{tx.type}</span>
                        </span>
                      </TableCell>
                      <TableCell className={`font-bold font-mono text-sm ${tx.type === "credit" ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.type === "credit" ? "+" : "-"} ৳{parseFloat(String(tx.amount || 0)).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gold-400 capitalize">
                        {tx.category || tx.wallet_field || "Wallet"}
                      </TableCell>
                      <TableCell className="text-xs text-foreground/90 max-w-xs truncate">
                        {tx.description || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(tx.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
