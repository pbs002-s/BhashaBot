"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { BusinessProfile } from "@/lib/types";
import {
  BookOpen,
  Save,
  Check,
  Building,
  Truck,
  Shield,
  HelpCircle,
  Package,
  Loader2,
} from "lucide-react";

export default function KnowledgePanel() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) setProfile(data.profile);
      })
      .catch((err) => console.error("Failed to load knowledge:", err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading || !profile) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-fog">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint/15 text-mint">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-paper">
              Business Profile & Knowledge Base Grounding
            </h2>
            <p className="text-xs text-fog">
              The AI dynamically grounds its responses in this factual business data across all languages
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-mint px-4 py-2 text-xs font-semibold text-ink transition-all hover:bg-mintDark active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          <span>{saving ? "Saving…" : saved ? "Changes Saved!" : "Save Knowledge Base"}</span>
        </button>
      </div>

      {/* Grid of Knowledge Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* 1. Core Profile & Contact */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Building className="h-4 w-4 text-mint" />
            <h3 className="font-display text-sm font-semibold text-paper">Store Identity & Contact</h3>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-fog mb-1">Business Name</label>
              <input
                type="text"
                value={profile.businessName}
                onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-mint focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fog mb-1">Tagline & Industry</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-mint focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-fog mb-1">Support Phone</label>
                <input
                  type="text"
                  value={profile.supportPhone}
                  onChange={(e) => setProfile({ ...profile, supportPhone: e.target.value })}
                  className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-mint focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-fog mb-1">Support Email</label>
                <input
                  type="text"
                  value={profile.supportEmail}
                  onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                  className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-mint focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-fog mb-1">Operating Hours</label>
              <input
                type="text"
                value={profile.operatingHours}
                onChange={(e) => setProfile({ ...profile, operatingHours: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-mint focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Delivery & Policies */}
        <div className="rounded-xl border border-line bg-panel p-5">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Truck className="h-4 w-4 text-sky" />
            <h3 className="font-display text-sm font-semibold text-paper">Delivery & Logistics Policies</h3>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-fog mb-1">Delivery Timelines</label>
              <input
                type="text"
                value={profile.deliveryTime}
                onChange={(e) => setProfile({ ...profile, deliveryTime: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-sky focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fog mb-1">Delivery Fees & Free Shipping</label>
              <input
                type="text"
                value={profile.deliveryFee}
                onChange={(e) => setProfile({ ...profile, deliveryFee: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-sky focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fog mb-1">Return & Warranty Policy</label>
              <textarea
                rows={2}
                value={profile.returnPolicy}
                onChange={(e) => setProfile({ ...profile, returnPolicy: e.target.value })}
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-sky focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-fog mb-1">Payment Methods (comma-separated)</label>
              <input
                type="text"
                value={profile.paymentMethods.join(", ")}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    paymentMethods: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                className="w-full rounded-lg border border-line bg-panelCard px-3 py-2 text-xs text-paper focus:border-sky focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Product Catalog & Pricing */}
        <div className="rounded-xl border border-line bg-panel p-5 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Package className="h-4 w-4 text-signal" />
            <h3 className="font-display text-sm font-semibold text-paper">Products & Pricing Catalog</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.products.map((prod, idx) => (
              <div key={idx} className="rounded-lg border border-line bg-panelCard p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-paper">{prod.name}</span>
                  <span className="font-mono font-semibold text-signal">{prod.price}</span>
                </div>
                <span className="mt-1 inline-block rounded bg-line px-1.5 py-0.5 font-mono text-[10px] text-fog">
                  {prod.category}
                </span>
                <p className="mt-1.5 text-fog leading-relaxed">{prod.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Frequently Asked Questions */}
        <div className="rounded-xl border border-line bg-panel p-5 md:col-span-2">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <HelpCircle className="h-4 w-4 text-violet" />
            <h3 className="font-display text-sm font-semibold text-paper">Frequently Asked Questions & Answers</h3>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {profile.faqs.map((faq, idx) => (
              <div key={idx} className="rounded-lg border border-line bg-panelCard p-3 text-xs">
                <p className="font-semibold text-paper">{faq.question}</p>
                <p className="mt-1 text-fog leading-relaxed">{faq.answer}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {faq.keywords.map((kw, kidx) => (
                    <span key={kidx} className="rounded bg-line px-1.5 py-0.5 font-mono text-[9px] text-fog">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
