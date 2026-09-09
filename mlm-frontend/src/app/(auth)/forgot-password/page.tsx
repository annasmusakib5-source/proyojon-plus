"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, MessageCircle, ArrowLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const ADMIN_PHONE = "01775636057";

export default function ForgotPasswordPage() {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#D4A843]/5 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] mb-4 shadow-lg shadow-[#D4A843]/20">
            <span className="text-2xl font-black text-[#0F1B35]">P+</span>
          </div>
          <h1 className="text-3xl font-bold text-gold-gradient">Proyojon Plus</h1>
        </div>

        <div className="glass-card p-8 border-gold-glow">
          {/* Alert icon */}
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#D4A843]/10 border border-[#D4A843]/20 mx-auto mb-5">
            <ShieldAlert className="w-7 h-7 text-[#D4A843]" />
          </div>

          <h2 className="text-xl font-semibold text-[#E8EDF5] text-center mb-2">
            Password Recovery
          </h2>
          <p className="text-[#94A3B8] text-sm text-center mb-6 leading-relaxed">
            For security purposes, password resets are handled{" "}
            <span className="text-[#E8EDF5] font-medium">manually by our Admin.</span> Please
            contact us using the number below.
          </p>

          {/* Admin Contact Card */}
          <div className="bg-[#0F1B35]/80 border border-[#D4A843]/20 rounded-xl p-5 mb-6">
            <p className="text-[#94A3B8] text-xs uppercase tracking-widest font-medium mb-2">
              Official Admin Contact
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#D4A843]/10">
                <Phone className="w-5 h-5 text-[#D4A843]" />
              </div>
              <div>
                <p className="text-[#E8EDF5] font-bold text-xl tracking-wider">{ADMIN_PHONE}</p>
                <p className="text-[#94A3B8] text-xs">Available: Sat–Thu, 9am–6pm</p>
              </div>
            </div>
          </div>

          {/* WhatsApp / Call buttons */}
          <div className="flex gap-3 mb-6">
            <a
              href={`https://wa.me/88${ADMIN_PHONE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full h-11 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 hover:border-[#25D366]/50 rounded-xl font-medium gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
            </a>
            <a href={`tel:${ADMIN_PHONE}`} className="flex-1">
              <Button
                variant="outline"
                className="w-full h-11 border-[#D4A843]/30 text-[#D4A843] hover:bg-[#D4A843]/10 hover:border-[#D4A843]/50 rounded-xl font-medium gap-2"
              >
                <Phone className="w-4 h-4" />
                Call Now
              </Button>
            </a>
          </div>

          <Link href="/login">
            <Button
              variant="ghost"
              className="w-full h-11 text-[#94A3B8] hover:text-[#E8EDF5] hover:bg-white/5 rounded-xl gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
