import { notFound } from "next/navigation";
import { EditNurseryInvoiceForm } from "@/components/edit-nursery-invoice-form";
import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EditNurseryInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;
  const invoice = await prisma.nurseryInvoice.findUnique({ where: { id }, select: { id: true, dueDate: true, status: true } });
  if (!invoice) notFound();
  const dueDate = invoice.dueDate.toISOString().slice(0, 10);
  return (
    <AppShell title="تعديل الفاتورة" maxWidth="max-w-xl">
      <section className="section-card">
        <h2 className="section-title">تعديل الفاتورة</h2>
        <div className="mt-4">
          <EditNurseryInvoiceForm invoice={{ ...invoice, dueDate }} />
        </div>
      </section>
    </AppShell>
  );
}
