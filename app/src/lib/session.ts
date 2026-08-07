import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// ملف الجلسات — بيظبط كوكي آمن في المتصفح فيه هوية المستخدم مشفرة
const secretKey = process.env.AUTH_SECRET || "academy-dev-secret";
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  role: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

// عمل جلسة (بعد تسجيل أو دخول ناجح)
export async function createSession(userId: string, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, role });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// حذف الجلسة (خروج)
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
