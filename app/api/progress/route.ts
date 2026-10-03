import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { playerKeyFromSession } from "@/lib/player-identity";
import { normalizeWriteRequest, type ServerProgressBody, type WriteDecision } from "@/lib/progress-sync";
import { getProgressWriteClient, readCloudProgress, writeCloudProgress } from "@/lib/sanity/progress-store";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const playerKey = await currentPlayerKey();
  if (playerKey instanceof NextResponse) return playerKey;

  const client = getProgressWriteClient();
  if (!client) return cloudUnavailable();

  try {
    const record = await readCloudProgress(client, playerKey);
    return NextResponse.json(bodyFromRecord(record), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "cloud_read_failed" }, { status: 500, headers: noStore });
  }
}

export async function PUT(request: Request) {
  const playerKey = await currentPlayerKey();
  if (playerKey instanceof NextResponse) return playerKey;

  const client = getProgressWriteClient();
  if (!client) return cloudUnavailable();

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400, headers: noStore });
  }

  const write = normalizeWriteRequest(payload);
  if (!write) {
    return NextResponse.json({ error: "invalid_progress" }, { status: 400, headers: noStore });
  }

  try {
    const decision = await writeCloudProgress(client, playerKey, write, new Date().toISOString());
    return NextResponse.json(bodyFromDecision(decision), { headers: noStore });
  } catch {
    return NextResponse.json({ error: "cloud_write_failed" }, { status: 500, headers: noStore });
  }
}

async function currentPlayerKey(): Promise<string | NextResponse> {
  try {
    const session = await auth();
    const playerKey = playerKeyFromSession(session);
    if (!playerKey) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
    }
    return playerKey;
  } catch {
    return NextResponse.json({ error: "auth_unavailable" }, { status: 503, headers: noStore });
  }
}

function cloudUnavailable() {
  return NextResponse.json({ error: "cloud_unavailable" }, { status: 503, headers: noStore });
}

function bodyFromRecord(record: { progress: ServerProgressBody["progress"]; revision: number; updatedAt: string } | null): ServerProgressBody {
  if (!record) {
    return { progress: null, revision: null, updatedAt: null, conflict: false, note: null };
  }
  return { progress: record.progress, revision: record.revision, updatedAt: record.updatedAt, conflict: false, note: null };
}

function bodyFromDecision(decision: WriteDecision): ServerProgressBody {
  return {
    progress: decision.record.progress,
    revision: decision.record.revision,
    updatedAt: decision.record.updatedAt,
    conflict: decision.conflict,
    note: decision.note,
  };
}
