import { RoomServiceClient } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const teacher = await getCurrentUser();
  if (!teacher || teacher.role !== "TEACHER") {
    return Response.json({ message: "غير مسموح" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const classId = typeof body?.classId === "string" ? body.classId : "";
  const identity = typeof body?.identity === "string" ? body.identity : "";
  const trackSid = typeof body?.trackSid === "string" ? body.trackSid : "";
  const muted = typeof body?.muted === "boolean" ? body.muted : null;

  if (!classId || !identity || !trackSid || muted === null) {
    return Response.json({ message: "بيانات الكتم ناقصة" }, { status: 400 });
  }

  const cls = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.id },
  });
  const enrollment = await prisma.enrollment.findFirst({
    where: { classId, studentId: identity, status: "ACTIVE" },
  });
  if (!cls || !enrollment) {
    return Response.json({ message: "الطالب غير تابع للفصل" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) {
    return Response.json({ message: "إعدادات LiveKit ناقصة" }, { status: 500 });
  }

  const service = new RoomServiceClient(livekitUrl, apiKey, apiSecret);
  await service.mutePublishedTrack(`class-${classId}`, identity, trackSid, muted);
  return Response.json({ ok: true, muted });
}
