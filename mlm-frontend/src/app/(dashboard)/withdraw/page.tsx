"use client";

import { useState } from "react";
import { ArrowDownToLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

export default function WithdrawalPage() {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("bkash");
  const [accountDetails, setAccountDetails] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const numAmount = parseFloat(amount) || 0;
  const charge = numAmount * 0.05; // 5% flat fee
  const netPayable = numAmount > 0 ? numAmount - charge : 0;

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }
    if (!accountDetails) {
      toast.error("Please provide your account number or banking details.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/withdraw", {
        amount: numAmount,
        method,
        account_details: accountDetails,
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Withdrawal request submitted successfully!");
        setAmount("");
        setAccountDetails("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Withdrawal request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <ArrowDownToLine className="h-6 w-6 text-emerald-400" />
          <span>Withdraw Funds</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Request cash withdrawal to Mobile Banking or Bank Account.
        </p>
      </div>

      <Card className="bg-card/80 border border-emerald-500/30 shadow-2xl">
        <form onSubmit={handleWithdrawal}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold text-foreground">Withdrawal Request</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              A standard 5% processing fee applies to all withdrawal methods.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-semibold text-foreground">
                Withdrawal Amount (BDT ৳)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/40 border-border/60 focus:border-emerald-400 font-mono text-sm"
                required
              />
            </div>

            {/* Payment Method Select */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">Payment Method</Label>
              <Select value={method} onValueChange={(val) => setMethod(val || "bkash")}>
                <SelectTrigger className="bg-secondary/40 border-border/60 focus:border-emerald-400 text-sm">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="bkash">bKash (Mobile Banking)</SelectItem>
                  <SelectItem value="nagad">Nagad (Mobile Banking)</SelectItem>
                  <SelectItem value="rocket">Rocket (Mobile Banking)</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Details Input */}
            <div className="space-y-2">
              <Label htmlFor="accountDetails" className="text-xs font-semibold text-foreground">
                Account Details / Mobile Number
              </Label>
              <Input
                id="accountDetails"
                type="text"
                placeholder={
                  method === "bank"
                    ? "Bank Name, Branch, Account Name & Number"
                    : "e.g. 01777000000"
                }
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="bg-secondary/40 border-border/60 focus:border-emerald-400 text-sm"
                required
              />
            </div>

            {/* Live Dynamic Calculation Box */}
            <div className="p-4 rounded-2xl bg-secondary/60 border border-border/60 space-y-2 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Requested Amount:</span>
                <span className="font-semibold text-foreground">৳ {numAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Processing Fee (5%):</span>
                <span className="font-semibold text-rose-400">- ৳ {charge.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-border/40 flex items-center justify-between font-bold text-sm text-emerald-400">
                <span>Net Payable Amount:</span>
                <span>৳ {netPayable.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold gap-2 shadow-lg shadow-emerald-500/20 py-5"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowDownToLine className="h-5 w-5" />}
              <span>Submit Withdrawal Request</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
