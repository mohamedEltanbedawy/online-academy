import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ recordingId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("غير مسموح", { status: 401 });
  const { recordingId } = await params;
  const recording = await prisma.recording.findFirst({
    where: {
      id: recordingId,
      status: "STOPPED",
      OR: [
        { class: { teacherId: user.id } },
        { active: true, class: { enrollments: { some: { studentId: user.id, status: "ACTIVE" } } } },
      ],
    },
  });
  if (!recording?.filePath) return new Response("التسجيل غير متاح", { status: 404 });
  try {
    const info = await stat(recording.filePath);
    const stream = Readable.toWeb(createReadStream(recording.filePath)) as ReadableStream;
    return new Response(stream, { headers: { "Content-Type": "video/mp4", "Content-Length": String(info.size), "Accept-Ranges": "bytes" } });
  } catch {
    return new Response("ملف التسجيل غير موجود", { status: 404 });
  }
}
