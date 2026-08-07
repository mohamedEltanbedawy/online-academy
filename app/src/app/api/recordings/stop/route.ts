import { EgressClient } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const teacher = await getCurrentUser();
  if (!teacher || teacher.role !== "TEACHER") return Response.json({ message: "غير مسموح" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const recordingId = typeof body?.recordingId === "string" ? body.recordingId : "";
  const recording = await prisma.recording.findFirst({ where: { id: recordingId, class: { teacherId: teacher.id }, status: { in: ["STARTING", "RECORDING"] } } });
  if (!recording) return Response.json({ message: "التسجيل غير موجود" }, { status: 404 });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) return Response.json({ message: "إعدادات LiveKit ناقصة" }, { status: 500 });
  try {
    const egress = new EgressClient(livekitUrl, apiKey, apiSecret);
    const info = await egress.stopEgress(recording.egressId);
    const endedAt = new Date();
    const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - recording.startedAt.getTime()) / 1000));
    await prisma.recording.update({ where: { id: recording.id }, data: { status: "STOPPED", endedAt, durationSeconds } });
    return Response.json({ status: info.status, recordingId: recording.id });
  } catch (error) {
    console.error("Failed to stop recording", error);
    await prisma.recording.update({ where: { id: recording.id }, data: { status: "FAILED", endedAt: new Date() } });
    return Response.json({ message: "تعذر إيقاف التسجيل" }, { status: 503 });
  }
}
