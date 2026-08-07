"use client";

import {
  Participant,
  Room,
  RoomEvent,
  Track,
  type TrackPublication,
} from "livekit-client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { LiveWhiteboard } from "@/components/live-whiteboard";
import { RecordingControl } from "@/components/recording-control";

type LiveRoomProps = {
  classId: string;
  role: "TEACHER" | "STUDENT";
};

type RoomMessage =
  | { type: "chat"; text: string; sender: string; at: number }
  | { type: "hand"; sender: string; raised: boolean; at: number };

function ParticipantTile({
  participant,
  refresh,
  classId,
  canMute,
}: {
  participant: Participant;
  refresh: number;
  classId: string;
  canMute: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muting, setMuting] = useState(false);

  useEffect(() => {
    const videoPublication = findPublication(participant, Track.Kind.Video);
    const audioPublication = findPublication(participant, Track.Kind.Audio);
    const videoTrack = videoPublication?.track;
    const audioTrack = audioPublication?.track;
    const videoElement = videoRef.current;
    const audioElement = audioRef.current;

    if (videoTrack && videoElement) videoTrack.attach(videoElement);
    if (audioTrack && audioElement) audioTrack.attach(audioElement);

    return () => {
      if (videoTrack && videoElement) videoTrack.detach(videoElement);
      if (audioTrack && audioElement) audioTrack.detach(audioElement);
    };
  }, [participant, refresh]);

  const audioPublication = findPublication(participant, Track.Kind.Audio);
  const isMuted = audioPublication?.isMuted ?? false;

  async function toggleParticipantMute() {
    if (!audioPublication || muting) return;
    setMuting(true);
    try {
      const response = await fetch("/api/livekit/mute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          identity: participant.identity,
          trackSid: audioPublication.trackSid,
          muted: !isMuted,
        }),
      });
      if (!response.ok) throw new Error("mute failed");
    } finally {
      setMuting(false);
    }
  }

  return (
    <div className="relative min-h-48 overflow-hidden rounded-2xl bg-slate-900">
      <video ref={videoRef} autoPlay playsInline className="h-full min-h-48 w-full object-cover" />
      <audio ref={audioRef} autoPlay />
      <span className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-sm text-white">
        {participant.name || participant.identity}
      </span>
      {canMute && audioPublication && (
        <button
          type="button"
          onClick={() => void toggleParticipantMute()}
          disabled={muting}
          className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
        >
          {isMuted ? "فتح الميكروفون" : "كتم الطالب"}
        </button>
      )}
    </div>
  );
}

function findPublication(participant: Participant, kind: Track.Kind): TrackPublication | undefined {
  const publications = participant.getTrackPublications().filter((publication) => publication.kind === kind);
  return publications.find((publication) => publication.source === Track.Source.ScreenShare) ?? publications[0];
}

export function LiveRoom({ classId, role }: LiveRoomProps) {
  const roomRef = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [refresh, setRefresh] = useState(0);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);
  const [status, setStatus] = useState("جاري تجهيز القاعة...");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [handRaised, setHandRaised] = useState(false);

  useEffect(() => {
    let active = true;
    const liveRoom = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = liveRoom;

    const updateParticipants = () => {
      setParticipants([...liveRoom.remoteParticipants.values()]);
      setRefresh((value) => value + 1);
    };

    const receiveData = (data: Uint8Array) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(data)) as RoomMessage;
        if (message.type === "chat" || message.type === "hand") {
          setMessages((current) => [...current.slice(-49), message]);
        }
      } catch {
        // تجاهل أي بيانات ليست من تنسيق القاعة
      }
    };

    const connect = async () => {
      try {
        const response = await fetch(`/api/livekit/token?classId=${encodeURIComponent(classId)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "تعذر تجهيز القاعة");

        const url = String(data.url).replace(/^http:/, "ws:").replace(/^https:/, "wss:");
        await liveRoom.connect(url, data.token);
        if (!active) return;

        setRoom(liveRoom);
        await liveRoom.localParticipant.setCameraEnabled(role === "TEACHER");
        await liveRoom.localParticipant.setMicrophoneEnabled(role === "TEACHER");
        setCameraEnabled(role === "TEACHER");
        setMicEnabled(role === "TEACHER");
        updateParticipants();
        setStatus("متصل بالقاعة");
      } catch (connectionError) {
        if (!active) return;
        setError(connectionError instanceof Error ? connectionError.message : "تعذر دخول القاعة");
        setStatus("تعذر الاتصال");
      }
    };

    liveRoom.on(RoomEvent.ParticipantConnected, updateParticipants);
    liveRoom.on(RoomEvent.ParticipantDisconnected, updateParticipants);
    liveRoom.on(RoomEvent.TrackSubscribed, updateParticipants);
    liveRoom.on(RoomEvent.TrackUnsubscribed, updateParticipants);
    liveRoom.on(RoomEvent.LocalTrackPublished, updateParticipants);
    liveRoom.on(RoomEvent.LocalTrackUnpublished, updateParticipants);
    liveRoom.on(RoomEvent.DataReceived, receiveData);
    void connect();

    return () => {
      active = false;
      liveRoom.disconnect();
      roomRef.current = null;
    };
  }, [classId, role]);

  async function toggleCamera() {
    if (!room) return;
    const next = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(next);
    setCameraEnabled(next);
    setRefresh((value) => value + 1);
  }

  async function toggleMic() {
    if (!room) return;
    const next = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }

  async function toggleScreenShare() {
    if (!room) return;
    const next = !screenShareEnabled;
    await room.localParticipant.setScreenShareEnabled(next);
    setScreenShareEnabled(next);
    setRefresh((value) => value + 1);
  }

  async function publishMessage(message: RoomMessage) {
    if (!room) return;
    await room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(message)),
      { reliable: true, topic: "academy-room" }
    );
    setMessages((current) => [...current.slice(-49), message]);
  }

  async function sendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = messageText.trim();
    if (!text || !room) return;
    setMessageText("");
    await publishMessage({
      type: "chat",
      text,
      sender: room.localParticipant.name || room.localParticipant.identity,
      at: Date.now(),
    });
  }

  async function toggleHand() {
    if (!room) return;
    const raised = !handRaised;
    setHandRaised(raised);
    await publishMessage({
      type: "hand",
      sender: room.localParticipant.name || room.localParticipant.identity,
      raised,
      at: Date.now(),
    });
  }

  useEffect(() => {
    if (roomRef.current && !room) setRoom(roomRef.current);
  }, [room]);

  const localParticipant = room?.localParticipant;
  const visibleParticipants = localParticipant
    ? [localParticipant, ...participants]
    : participants;

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">قاعة الدرس المباشرة</h2>
          <p className="text-sm text-slate-500">{status}</p>
        </div>
        <div className="flex gap-2">
          {role === "TEACHER" && <RecordingControl classId={classId} />}
          <button
            type="button"
            onClick={() => void toggleMic()}
            disabled={!room}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {micEnabled ? "كتم الميكروفون" : "فتح الميكروفون"}
          </button>
          <button
            type="button"
            onClick={() => void toggleCamera()}
            disabled={!room}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {cameraEnabled ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
          </button>
          <button
            type="button"
            onClick={() => void toggleScreenShare()}
            disabled={!room}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {screenShareEnabled ? "إيقاف مشاركة الشاشة" : "مشاركة الشاشة"}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {visibleParticipants.length === 0 ? (
        <div className="rounded-2xl bg-slate-900 p-10 text-center text-slate-300">
          في انتظار المشاركين...
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleParticipants.map((participant) => (
            <ParticipantTile
              key={participant.identity}
              participant={participant}
              refresh={refresh}
              classId={classId}
              canMute={role === "TEACHER" && !participant.isLocal}
            />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-bold text-slate-900">التحكم في المشاركة</h3>
          <button
            type="button"
            onClick={() => void toggleHand()}
            disabled={!room}
            className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50"
          >
            {handRaised ? "إنزال اليد" : "رفع اليد"}
          </button>
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            {messages
              .filter((message) => message.type === "hand" && message.raised)
              .map((message) => (
                <p key={`${message.sender}-${message.at}`}>
                  ✋ {message.sender} رفع إيده
                </p>
              ))}
          </div>
        </div>

        <div className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-bold text-slate-900">شات القاعة</h3>
          <div className="mt-3 flex-1 space-y-2 overflow-y-auto text-sm">
            {messages
              .filter((message) => message.type === "chat")
              .map((message) => (
                <p key={`${message.sender}-${message.at}`}>
                  <strong>{message.sender}:</strong> {message.text}
                </p>
              ))}
          </div>
          <form onSubmit={sendChat} className="mt-3 flex gap-2">
            <input
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              placeholder="اكتب رسالة..."
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!room || !messageText.trim()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              إرسال
            </button>
          </form>
        </div>
      </div>

      <LiveWhiteboard room={room} canEdit={role === "TEACHER"} />
    </section>
  );
}
