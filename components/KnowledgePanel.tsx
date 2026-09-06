"use client";

import React, { useEffect, useState } from "react";
import {
  Buildings,
  CheckCircle,
  FloppyDisk,
  Package,
  Question,
  Truck,
} from "@phosphor-icons/react/dist/ssr";
import type { BusinessProfile } from "@/lib/types";
import { useSettings, useT } from "./providers/AppProviders";
import { Button, Chip, SectionHead, Skeleton, TextArea, TextInput, cx } from "./ui/primitives";

export default function KnowledgePanel() {
  const t = useT();
  const { settings } = useSettings();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge")
      .then((res) => res.json())
      .then((data) => data.profile && setProfile(data.profile))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  const usedByMode =
    settings.persona.workspaceMode === "business" || settings.persona.workspaceMode === "creator";

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-shell border border-line/70 bg-panelCard/40 p-1.5">
            <div className="rounded-core border border-line/60 bg-panel p-6">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="mt-5 h-9 w-full" />
              <Skeleton className="mt-3 h-9 w-full" />
              <Skeleton className="mt-3 h-9 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <p className="rounded-card border border-coral/40 bg-coral/10 px-4 py-3 text-xs text-coral">
        {t("error.loadFailed")}
      </p>
    );
  }

  const set = (patch: Partial<BusinessProfile>) => setProfile({ ...profile, ...patch });

  return (
    <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4">
      <Panel>
        <SectionHead
          title={t("kb.title")}
          hint={t("kb.subtitle")}
          icon={<Buildings size={17} />}
          actions={
            <>
              {!usedByMode ? <Chip tone="signal">{t("kb.note")}</Chip> : null}
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
                leadingIcon={
                  saved ? <CheckCircle size={13} weight="fill" /> : <FloppyDisk size={13} />
                }
              >
                {saving ? t("action.saving") : saved ? t("action.saved") : t("kb.save")}
              </Button>
            </>
          }
        />
        {failed ? (
          <p className="px-6 pb-4 pt-3 text-xs text-coral">{t("error.saveFailed")}</p>
        ) : null}
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Panel className="lg:col-span-5">
          <SectionHead title={t("kb.identity")} icon={<Buildings size={17} />} />
          <div className="flex flex-col gap-4 p-6">
            <TextInput
              label={t("kb.field.name")}
              value={profile.businessName}
              onChange={(e) => set({ businessName: e.target.value })}
            />
            <TextInput
              label={t("kb.field.tagline")}
              value={profile.tagline}
              onChange={(e) => set({ tagline: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextInput
                label={t("kb.field.phone")}
                value={profile.supportPhone}
                onChange={(e) => set({ supportPhone: e.target.value })}
              />
              <TextInput
                label={t("kb.field.email")}
                type="email"
                value={profile.supportEmail}
                onChange={(e) => set({ supportEmail: e.target.value })}
              />
            </div>
            <TextInput
              label={t("kb.field.hours")}
              value={profile.operatingHours}
              onChange={(e) => set({ operatingHours: e.target.value })}
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-7">
          <SectionHead title={t("kb.logistics")} icon={<Truck size={17} />} />
          <div className="flex flex-col gap-4 p-6">
            <TextInput
              label={t("kb.field.deliveryTime")}
              value={profile.deliveryTime}
              onChange={(e) => set({ deliveryTime: e.target.value })}
            />
            <TextInput
              label={t("kb.field.deliveryFee")}
              value={profile.deliveryFee}
              onChange={(e) => set({ deliveryFee: e.target.value })}
            />
            <TextArea
              label={t("kb.field.returns")}
              rows={2}
              value={profile.returnPolicy}
              onChange={(e) => set({ returnPolicy: e.target.value })}
            />
            <TextInput
              label={t("kb.field.payments")}
              value={profile.paymentMethods.join(", ")}
              onChange={(e) =>
                set({ paymentMethods: e.target.value.split(",").map((s) => s.trim()) })
              }
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-7">
          <SectionHead title={t("kb.catalog")} icon={<Package size={17} />} />
          <div className="grid grid-cols-1 gap-3 p-6 sm:grid-cols-2">
            {profile.products.map((product, index) => (
              <article key={index} className="rounded-card border border-line bg-panelCard p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="text-xs font-semibold text-paper">{product.name}</h4>
                  <span className="shrink-0 font-mono text-[0.72rem] text-signal">
                    {product.price}
                  </span>
                </div>
                <Chip className="mt-2">{product.category}</Chip>
                <p className="mt-2.5 text-[0.72rem] leading-relaxed text-fog">
                  {product.description}
                </p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel className="lg:col-span-5">
          <SectionHead title={t("kb.faq")} icon={<Question size={17} />} />
          <div className="divide-y divide-line px-6">
            {profile.faqs.map((faq, index) => (
              <div key={index} className="py-4">
                <p className="text-xs font-medium leading-relaxed text-paper">{faq.question}</p>
                <p className="mt-1.5 text-[0.72rem] leading-relaxed text-fog">{faq.answer}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {faq.keywords.slice(0, 6).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-panelCard px-2 py-0.5 font-mono text-[0.6rem] text-fog"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </form>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cx("rounded-shell border border-line/70 bg-panelCard/40 p-1.5 shadow-ambient", className)}
    >
      <div className="h-full rounded-core border border-line/60 bg-panel shadow-inset">{children}</div>
    </section>
  );
}
