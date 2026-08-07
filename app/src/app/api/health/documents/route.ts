import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getMyTenantId } from "@/lib/family";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "health");
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
  if (!(await hasPermission("health:documents"))) return NextResponse.json({ error: "لا تملك صلاحية رفع الملفات الصحية" }, { status: 403 });

  const formData = await req.formData();
  const childId = String(formData.get("childId") || "");
  const title = String(formData.get("title") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const file = formData.get("file");

  if (!childId || !(file instanceof File)) {
    return NextResponse.json({ error: "البيانات ناقصة (childId + file)" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "الملف أكبر من 15MB" }, { status: 400 });

  const child = await prisma.child.findUnique({ where: { id: childId } });
  if (!child) return NextResponse.json({ error: "الطفل غير موجود" }, { status: 404 });

  const tenantId = await getMyTenantId();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = path.join(UPLOAD_ROOT, childId, `${Date.now()}-${safeName}`);
  await mkdir(path.dirname(filePath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const doc = await prisma.healthDocument.create({
    data: {
      tenantId,
      childId,
      title,
      category,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storagePath: filePath,
      uploadedById: user.id,
    },
  });

  return NextResponse.json({ ok: true, id: doc.id, fileName: doc.fileName });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "غير مسموح" }, { status: 401 });
  if (!(await hasPermission("health:view"))) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id ناقص" }, { status: 400 });

  const doc = await prisma.healthDocument.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

  const { readFile } = await import("fs/promises");
  try {
    const data = await readFile(doc.storagePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "تعذر قراءة الملف" }, { status: 500 });
  }
}
