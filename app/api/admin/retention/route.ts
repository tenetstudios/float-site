import { parseRetentionFilters } from "@/lib/retention";
import { getRetentionReport } from "@/lib/retention-server";
import { failure, json, token } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const filters = parseRetentionFilters(new URL(request.url).searchParams);
    const report = await getRetentionReport(await token(), filters);
    return json({ report, filters, updatedAt: new Date().toISOString() });
  } catch (error) { return failure(error); }
}
