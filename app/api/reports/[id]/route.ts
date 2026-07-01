import { NextResponse } from "next/server";
import { getReport } from "@/services/report.service";
import { fail, ok } from "@/lib/utils/api";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const report = await getReport(id);
  return report ? NextResponse.json(ok(report)) : NextResponse.json(fail("report not found"), { status: 404 });
}
