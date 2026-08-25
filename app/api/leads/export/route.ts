import { NextRequest, NextResponse } from "next/server";
import { getLeads } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "csv";
  const leads = await getLeads();

  if (format === "json") {
    return NextResponse.json({
      count: leads.length,
      exportedAt: new Date().toISOString(),
      leads: leads.map((l) => ({
        id: l.id,
        name: l.leadName,
        phone: l.leadPhone,
        email: l.leadEmail,
        location: l.leadLocation,
        company: l.leadCompany,
        interest: l.leadInterest,
        budget: l.leadBudget,
        language: l.detectedLanguage,
        sentiment: l.sentiment,
        createdAt: l.createdAt,
        messageSnippet: l.messageText,
      })),
    });
  }

  // Generate CSV
  const headers = [
    "ID",
    "Lead Name",
    "Phone",
    "Email",
    "Location",
    "Company",
    "Interest",
    "Budget",
    "Language",
    "Sentiment",
    "Created At",
    "Original Message",
  ];

  const rows = leads.map((l) => [
    l.id,
    `"${(l.leadName || "").replace(/"/g, '""')}"`,
    `"${(l.leadPhone || "").replace(/"/g, '""')}"`,
    `"${(l.leadEmail || "").replace(/"/g, '""')}"`,
    `"${(l.leadLocation || "").replace(/"/g, '""')}"`,
    `"${(l.leadCompany || "").replace(/"/g, '""')}"`,
    `"${(l.leadInterest || "").replace(/"/g, '""')}"`,
    `"${(l.leadBudget || "").replace(/"/g, '""')}"`,
    `"${l.detectedLanguage}"`,
    `"${l.sentiment}"`,
    `"${l.createdAt}"`,
    `"${(l.messageText || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bhashabot_leads_${Date.now()}.csv"`,
    },
  });
}
