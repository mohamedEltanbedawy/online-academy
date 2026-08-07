import { randomUUID } from "crypto";
import { join } from "path";
import { mkdir } from "fs/promises";
import { EncodedFileOutput, EncodedFileType } from "@livekit/protocol";
import { EgressClient } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const teacher = await getCurrentUser();
  if (!teacher || teacher.role !== "TEACHER") return Response.json({ message: "غير مسموح" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const title = typeof body?.title === "string" && body.title.trim() ? body.title.trim() : "تسجيل حصة";
  const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: teacher.id } });
  if (!cls) return Response.json({ message: "الفصل غير موجود" }, { status: 404 });

  const active = await prisma.recording.findFirst({ where: { classId, status: { in: ["STARTING", "RECORDING"] } } });
  if (active) return Response.json({ recordingId: active.id, message: "التسجيل شغال بالفعل" });

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) return Response.json({ message: "إعدادات LiveKit ناقصة" }, { status: 500 });

  const recordingId = randomUUID();
  const recordingsDir = process.env.RECORDINGS_DIR || join(process.cwd(), "recordings");
  const filePath = join(recordingsDir, `${recordingId}.mp4`);
  const egressFilePath = `/recordings/${recordingId}.mp4`;
  try {
    await mkdir(recordingsDir, { recursive: true });
    const egress = new EgressClient(livekitUrl, apiKey, apiSecret);
    const output = new EncodedFileOutput({ fileType: EncodedFileType.MP4, filepath: egressFilePath });
    const info = await egress.startRoomCompositeEgress(`class-${classId}`, { file: output }, { layout: "grid" });
    const recording = await prisma.recording.create({ data: { id: recordingId, classId, egressId: info.egressId, title, status: "RECORDING", filePath } });
    return Response.json({ recordingId: recording.id, status: recording.status });
  } catch (error) {
    console.error("Failed to start recording", error);
    return Response.json({ message: "خدمة التسجيل غير متاحة. تأكد من تشغيل LiveKit Egress." }, { status: 503 });
  }
}
