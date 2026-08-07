"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  Tldraw,
  type Editor,
  type TLStoreSnapshot,
} from "tldraw";
import type { Room } from "livekit-client";

type WhiteboardMessage =
  | { type: "whiteboard-request" }
  | { type: "whiteboard-snapshot"; snapshot: TLStoreSnapshot };

export function LiveWhiteboard({
  room,
  canEdit,
}: {
  room: Room | null;
  canEdit: boolean;
}) {
  const editorRef = useRef<Editor | null>(null);
  const remoteUpdate = useRef(false);

  const sendSnapshot = useCallback(async () => {
    if (!room || !editorRef.current) return;
    const message: WhiteboardMessage = {
      type: "whiteboard-snapshot",
      snapshot: editorRef.current.store.getStoreSnapshot() as TLStoreSnapshot,
    };
    await room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(message)),
      { reliable: true, topic: "academy-whiteboard" }
    );
  }, [room]);

  useEffect(() => {
    if (!room) return;

    const receiveSnapshot = (data: Uint8Array) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(data)) as WhiteboardMessage;
        if (message.type === "whiteboard-request" && canEdit) {
          void sendSnapshot();
        }
        if (message.type === "whiteboard-snapshot" && !canEdit && editorRef.current) {
          remoteUpdate.current = true;
          editorRef.current.store.loadStoreSnapshot(message.snapshot);
          remoteUpdate.current = false;
        }
      } catch {
        // تجاهل حزم ليست سبورة أو snapshots غير صالحة
      }
    };

    room.on("dataReceived", receiveSnapshot);
    const request = JSON.stringify({ type: "whiteboard-request" } satisfies WhiteboardMessage);
    void room.localParticipant.publishData(new TextEncoder().encode(request), {
      reliable: true,
      topic: "academy-whiteboard",
    });

    return () => {
      room.off("dataReceived", receiveSnapshot);
    };
  }, [room, canEdit, sendSnapshot]);

  function handleMount(editor: Editor) {
    editorRef.current = editor;
    if (!canEdit) return;

    const removeListener = editor.store.listen(
      () => {
        if (!remoteUpdate.current) void sendSnapshot();
      },
      { source: "user", scope: "document" }
    );
    return removeListener;
  }

  return (
    <section className="relative h-[32rem] overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold shadow">
        {canEdit ? "السبورة عندك — ارسم واشرح" : "سبورة المدرس"}
      </div>
      <div className={!canEdit ? "pointer-events-none h-full" : "h-full"}>
        <Tldraw onMount={handleMount} />
      </div>
    </section>
  );
}
