"use client";

import { useState } from "react";
import { Send, UserCheck, ShieldAlert, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

export default function FundTransferPage() {
  const [receiverId, setReceiverId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid receiver ID and transfer amount.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/wallet/transfer", {
        receiver_id: parseInt(receiverId),
        amount: parseFloat(amount),
      });

      if (res.data?.success) {
        toast.success(res.data.message || `Successfully transferred ৳${amount} to ID #${receiverId}`);
        setReceiverId("");
        setAmount("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Transfer failed. Please check balance and receiver ID.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
          <Send className="h-6 w-6 text-gold-400" />
          <span>ID-to-ID Fund Transfer</span>
        </h2>
        <p className="text-sm text-muted-foreground">
          Instantly transfer funds from your Current Balance to another member's account.
        </p>
      </div>

      <Card className="bg-card/80 border border-gold-500/30 shadow-2xl">
        <form onSubmit={handleTransfer}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg font-bold text-foreground">Transfer Details</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Transfers are instant and non-refundable. Please double check the receiver ID.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receiverId" className="text-xs font-semibold text-foreground">
                Receiver Phone / User ID
              </Label>
              <div className="relative">
                <Input
                  id="receiverId"
                  type="text"
                  placeholder="e.g. 017XXXXXXXX or 102"
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="bg-secondary/40 border-border/60 focus:border-gold-400 font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-semibold text-foreground">
                Amount (BDT ৳)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Minimum ৳ 10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary/40 border-border/60 focus:border-gold-400 font-mono text-sm"
                required
              />
            </div>

            {/* Quick Note Box */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Funds will be immediately debited from your <strong>Current Balance</strong> and credited to the receiver.
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold gap-2 shadow-lg shadow-gold-500/20 py-5"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              <span>Confirm & Transfer Funds</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
