import { parseFilters } from "@/lib/acquisition";
import { failure, getReport, json, token } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const report = await getReport(await token(), filters);
    return json({ report, filters, updatedAt: new Date().toISOString() });
  } catch (error) { return failure(error); }
}
