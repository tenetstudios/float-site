import { parseEngagementFilters } from "@/lib/engagement";
import { getEngagementReport } from "@/lib/engagement-server";
import { failure, json, token } from "@/lib/acquisition-server";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const filters = parseEngagementFilters(new URL(request.url).searchParams);
    return json({ report: await getEngagementReport(await token(), filters), filters, updatedAt: new Date().toISOString() });
  } catch (error) { return failure(error); }
}
