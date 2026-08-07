import { AccessToken } from "livekit-server-sdk";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ message: "غير مسموح" }, { status: 401 });

  const classId = new URL(request.url).searchParams.get("classId");
  if (!classId) {
    return Response.json({ message: "الفصل غير محدد" }, { status: 400 });
  }

  const allowed =
    user.role === "TEACHER"
      ? await prisma.class.findFirst({ where: { id: classId, teacherId: user.id } })
      : await prisma.enrollment.findFirst({
          where: { classId, studentId: user.id, status: "ACTIVE" },
        });

  if (!allowed) {
    return Response.json({ message: "مش مسموح لك تدخل القاعة" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) {
    return Response.json({ message: "إعدادات LiveKit ناقصة" }, { status: 500 });
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: user.name,
    ttl: "2h",
  });
  token.addGrant({
    room: `class-${classId}`,
    roomJoin: true,
    canPublish: user.role === "TEACHER",
    canSubscribe: true,
    canPublishData: true,
  });

  return Response.json({
    token: await token.toJwt(),
    url: livekitUrl,
    roomName: `class-${classId}`,
    participantName: user.name,
    role: user.role,
  });
}
