"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

/* ─── Constants ─── */
const LESSONS_MOBILE = 4;
const LESSONS_DESKTOP = 8;

const SEG_COLORS = [
  ["#4f6ef7", "#7c3aed"],
  ["#f97316", "#ef4444"],
  ["#22c55e", "#0ea5e9"],
  ["#eab308", "#f97316"],
  ["#ec4899", "#7c3aed"],
];

/* ─── Thumbnail ─── */
function LessonThumb({ idx }) {
  const hues = [
    "210,100%,63%",
    "271,68%,56%",
    "25,95%,53%",
    "142,70%,45%",
    "334,86%,67%",
  ];
  const h = hues[idx % hues.length];
  return (
    <div
      style={{
        width: "100%",
        paddingTop: "56.25%",
        borderRadius: "10px 10px 0 0",
        background: `hsl(${h})`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 32, filter: "brightness(0) invert(1)" }}>
          🎙️
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.85)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Lesson {idx + 1}
        </span>
      </div>
    </div>
  );
}

/* ─── Lesson Card ─── */
function LessonCard({ lesson, idx, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        background: "#fff",
        boxShadow: "0 2px 16px rgba(79,110,247,0.10)",
        transition: "transform 0.18s, box-shadow 0.18s",
        animation: `fadeUp 0.4s ease ${(idx % 8) * 0.05}s both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(79,110,247,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 16px rgba(79,110,247,0.10)";
      }}
    >
      <LessonThumb idx={idx} />
      <div style={{ padding: "12px 14px 14px" }}>
        <div
          style={{
            fontSize: 11,
            color: "#4f6ef7",
            fontWeight: 700,
            letterSpacing: 0.5,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {lesson.lessonId}
        </div>
        <div
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.3,
            marginBottom: 6,
            color: "#1e293b",
          }}
        >
          {lesson.lessonName}
        </div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>
          {lesson.lessonShortBrief}
        </div>
        <div
          style={{
            marginTop: 10,
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
            borderRadius: 99,
            padding: "5px 12px",
            fontSize: 12,
            color: "#fff",
            fontWeight: 700,
          }}
        >
          🎤 Bắt đầu luyện nói
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function SegmentPage() {
  const router = useRouter();
  const params = useParams();
  const segmentId = params?.segmentId;

  const [seg, setSeg] = useState(null);
  const [segIdx, setSegIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!segmentId) return;
    fetch("/data/segments.json")
      .then((r) => r.json())
      .then((data) => {
        const idx = data.findIndex((s) => s.segmentID === segmentId);
        if (idx !== -1) {
          setSeg(data[idx]);
          setSegIdx(idx);
        } else setSeg(null);
      });
  }, [segmentId]);

  const perPage = isMobile ? LESSONS_MOBILE : LESSONS_DESKTOP;
  const totalPages = seg ? Math.ceil(seg.lessons.length / perPage) : 0;
  const visible = seg
    ? seg.lessons.slice(page * perPage, (page + 1) * perPage)
    : [];
  const [c1, c2] = SEG_COLORS[segIdx % SEG_COLORS.length];

  /* ── Loading ── */
  if (!seg)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--c-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 16 }}>
          {seg === null && segmentId
            ? "❌ Không tìm thấy segment."
            : "Đang tải..."}
        </div>
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)" }}>
      {/* ── HEADER ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          padding: isMobile ? "32px 20px 48px" : "48px 40px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: [200, 140, 90, 60][i],
              height: [200, 140, 90, 60][i],
              borderRadius: "50%",
              background: "rgba(255,255,255,0.07)",
              top: ["-40px", "30px", "60%", "20%"][i],
              right: ["-60px", "15%", "-20px", "5%"][i],
              pointerEvents: "none",
            }}
          />
        ))}

        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => router.push("/")}
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 99,
                padding: "5px 14px",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                backdropFilter: "blur(8px)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Trang chủ
            </button>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
              /
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {seg.segmentDes}
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: isMobile ? 26 : 40,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: 10,
            }}
          >
            {seg.segmentDes}
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.20)",
                backdropFilter: "blur(8px)",
                borderRadius: 99,
                padding: "6px 16px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              📚 {seg.lessons.length} bài học
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.20)",
                backdropFilter: "blur(8px)",
                borderRadius: 99,
                padding: "6px 16px",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              🎙️ Luyện nói từng bài
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: isMobile ? "28px 16px 100px" : "36px 32px 60px",
        }}
      >
        {/* Page info */}
        {totalPages > 1 && (
          <div
            style={{
              marginBottom: 16,
              color: "#64748b",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Trang {page + 1} / {totalPages} · Hiển thị {visible.length} /{" "}
            {seg.lessons.length} bài
          </div>
        )}

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: isMobile ? 12 : 16,
            marginBottom: 28,
          }}
        >
          {visible.map((lesson, i) => (
            <LessonCard
              key={lesson.lessonId}
              lesson={lesson}
              idx={page * perPage + i}
              onClick={() => router.push(`/lesson/${lesson.lessonId}`)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => {
                setPage(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === 0}
              style={{
                background: page === 0 ? "#f1f5f9" : "#e0e7ff",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 12,
                color: page === 0 ? "#cbd5e1" : "#4f6ef7",
                fontWeight: 700,
                cursor: page === 0 ? "default" : "pointer",
              }}
            >
              «
            </button>

            <button
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === 0}
              style={{
                background: page === 0 ? "#f1f5f9" : "#e0e7ff",
                border: "none",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 16,
                color: page === 0 ? "#cbd5e1" : "#4f6ef7",
                fontWeight: 700,
                cursor: page === 0 ? "default" : "pointer",
              }}
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => {
              // Show max 5 page buttons around current
              if (totalPages <= 7) return i;
              if (i === 0 || i === totalPages - 1) return i;
              if (Math.abs(i - page) <= 2) return i;
              return null;
            }).map((i, arrIdx) => {
              if (i === null) {
                // Ellipsis — only render once per gap
                const prev = Array.from({ length: totalPages }, (_, k) => {
                  if (totalPages <= 7) return k;
                  if (k === 0 || k === totalPages - 1) return k;
                  if (Math.abs(k - page) <= 2) return k;
                  return null;
                })[arrIdx - 1];
                if (prev !== null)
                  return (
                    <span
                      key={`ellipsis-${arrIdx}`}
                      style={{
                        color: "#94a3b8",
                        fontWeight: 700,
                        padding: "0 4px",
                      }}
                    >
                      …
                    </span>
                  );
                return null;
              }
              return (
                <button
                  key={i}
                  onClick={() => {
                    setPage(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    width: page === i ? 40 : 36,
                    height: 36,
                    borderRadius: 10,
                    background:
                      page === i
                        ? `linear-gradient(90deg, ${c1}, ${c2})`
                        : "#f1f5f9",
                    border: "none",
                    color: page === i ? "#fff" : "#475569",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: page === i ? `0 4px 12px ${c1}40` : "none",
                  }}
                >
                  {i + 1}
                </button>
              );
            })}

            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages - 1, p + 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === totalPages - 1}
              style={{
                background: page === totalPages - 1 ? "#f1f5f9" : "#e0e7ff",
                border: "none",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 16,
                color: page === totalPages - 1 ? "#cbd5e1" : "#4f6ef7",
                fontWeight: 700,
                cursor: page === totalPages - 1 ? "default" : "pointer",
              }}
            >
              ›
            </button>

            <button
              onClick={() => {
                setPage(totalPages - 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={page === totalPages - 1}
              style={{
                background: page === totalPages - 1 ? "#f1f5f9" : "#e0e7ff",
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                fontSize: 12,
                color: page === totalPages - 1 ? "#cbd5e1" : "#4f6ef7",
                fontWeight: 700,
                cursor: page === totalPages - 1 ? "default" : "pointer",
              }}
            >
              »
            </button>
          </div>
        )}

        {/* Back to home */}
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 32 }}
        >
          <button
            onClick={() => router.push("/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#f1f5f9",
              border: "none",
              borderRadius: 99,
              padding: "10px 24px",
              fontSize: 13,
              fontWeight: 700,
              color: "#475569",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
          >
            ← Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
