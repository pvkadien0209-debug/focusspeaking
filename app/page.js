"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ─── Constants ─── */
const LESSONS_MOBILE = 4;
const LESSONS_DESKTOP = 8;

/* ─── Gradient palettes per segment index ─── */
const SEG_COLORS = [
  ["#4f6ef7", "#7c3aed"],
  ["#f97316", "#ef4444"],
  ["#22c55e", "#0ea5e9"],
  ["#eab308", "#f97316"],
  ["#ec4899", "#7c3aed"],
];

/* ─── Thumbnail placeholder ─── */
function LessonThumb({ idx, name }) {
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
        animation: `fadeUp 0.4s ease ${idx * 0.06}s both`,
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
      <LessonThumb idx={idx} name={lesson.lessonName} />
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

/* ─── Segment Section (preview only, no pagination) ─── */
function SegmentSection({ seg, segIdx, router, isMobile }) {
  const perPage = isMobile ? LESSONS_MOBILE : LESSONS_DESKTOP;
  const preview = seg.lessons.slice(0, perPage);
  const hasMore = seg.lessons.length > perPage;
  const [c1, c2] = SEG_COLORS[segIdx % SEG_COLORS.length];

  return (
    <section style={{ marginBottom: 40 }}>
      {/* Segment header — clickable → /segment/[segmentId] */}
      <div
        onClick={() => router.push(`/segment/${seg.segmentID}`)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          padding: "12px 18px",
          borderRadius: 14,
          background: `linear-gradient(90deg, ${c1}18, ${c2}10)`,
          borderLeft: `4px solid ${c1}`,
          cursor: "pointer",
          transition: "box-shadow 0.18s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = `0 4px 20px ${c1}30`)
        }
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        <span
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 800,
            fontSize: 20,
            background: `linear-gradient(90deg, ${c1}, ${c2})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {seg.segmentDes}
        </span>

        <span
          style={{
            background: c1,
            color: "#fff",
            borderRadius: 99,
            padding: "2px 10px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {seg.lessons.length} bài
        </span>

        {/* Arrow hint */}
        <span
          style={{
            marginLeft: "auto",
            color: c1,
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          ›
        </span>
      </div>

      {/* Preview cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? 12 : 16,
        }}
      >
        {preview.map((lesson, i) => (
          <LessonCard
            key={lesson.lessonId}
            lesson={lesson}
            idx={i}
            onClick={() => router.push(`/lesson/${lesson.lessonId}`)}
          />
        ))}
      </div>

      {/* "Xem tất cả" button — only if more lessons than preview */}
      {hasMore && (
        <div
          style={{ display: "flex", justifyContent: "center", marginTop: 16 }}
        >
          <button
            onClick={() => router.push(`/segment/${seg.segmentID}`)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: `linear-gradient(90deg, ${c1}, ${c2})`,
              color: "#fff",
              border: "none",
              borderRadius: 99,
              padding: "10px 28px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: `0 4px 16px ${c1}40`,
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${c1}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = `0 4px 16px ${c1}40`;
            }}
          >
            Xem tất cả {seg.lessons.length} bài
            <span style={{ fontSize: 16 }}>→</span>
          </button>
        </div>
      )}
    </section>
  );
}

/* ─── MAIN PAGE ─── */
export default function HomePage() {
  const router = useRouter();
  const [segments, setSegments] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchErr, setSearchErr] = useState("");
  const searchRef = useRef();

  useEffect(() => {
    fetch("/data/segments.json")
      .then((r) => r.json())
      .then(setSegments);
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleSearch() {
    const q = search.trim();
    if (!q) return;
    let found = null;
    for (const seg of segments) {
      const lesson = seg.lessons.find(
        (l) =>
          l.lessonId.toLowerCase() === q.toLowerCase() ||
          l.lessonName.toLowerCase().includes(q.toLowerCase()),
      );
      if (lesson) {
        found = lesson;
        break;
      }
    }
    if (found) {
      setSearchErr("");
      setSearchResult(found);
    } else {
      setSearchResult(null);
      setSearchErr(
        "Không tìm thấy bài học. Thử lại với Lesson ID hoặc tên bài.",
      );
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)" }}>
      {/* ── HERO ── */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #4f6ef7 0%, #7c3aed 50%, #f97316 100%)",
          padding: isMobile ? "40px 20px 60px" : "60px 40px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: [200, 140, 90, 60][i],
              height: [200, 140, 90, 60][i],
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              top: ["-40px", "30px", "60%", "20%"][i],
              right: ["-60px", "15%", "-20px", "5%"][i],
              pointerEvents: "none",
            }}
          />
        ))}

        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 99,
              padding: "6px 16px",
              marginBottom: 16,
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 14 }}>🎙️</span>
            <span
              style={{
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Speak First, Learn Faster
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: isMobile ? 32 : 48,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 12,
            }}
          >
            Focus<span style={{ color: "#fde68a" }}>Speaking</span>
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.88)",
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.6,
              marginBottom: 8,
            }}
          >
            Học tiếng Anh bằng giọng nói —{" "}
            <strong style={{ color: "#fde68a" }}>
              tập trung, liên tục, hiệu quả.
            </strong>
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            Thay vì bấm tay, bạn{" "}
            <strong style={{ color: "#fff" }}>nói to đáp án</strong> → đạt 2 mục
            tiêu cùng lúc: luyện nghe nói <em>và</em> học kiến thức.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              ["🎯", "Trả lời bằng giọng nói"],
              ["👂", "Nghe + Nói cùng lúc"],
              ["📊", "Theo dõi phát âm"],
            ].map(([ic, txt]) => (
              <div
                key={txt}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 99,
                  padding: "7px 14px",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{ic}</span>
                {txt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div
        style={{
          maxWidth: 680,
          margin: isMobile ? "-24px 16px 0" : "-28px auto 0",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(79,110,247,0.18)",
            padding: "14px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 20 }}>🔍</span>
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm bài học theo ID hoặc tên... (ví dụ: seg01-ls01)"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              color: "#1e293b",
              background: "transparent",
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 18px",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Tìm
          </button>
        </div>

        {searchResult && (
          <div
            onClick={() => router.push(`/lesson/${searchResult.lessonId}`)}
            style={{
              marginTop: 8,
              background: "#fff",
              borderRadius: 12,
              padding: "12px 16px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(79,110,247,0.12)",
              border: "2px solid #4f6ef7",
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: "popIn 0.25s ease",
            }}
          >
            <span style={{ fontSize: 24 }}>📖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                {searchResult.lessonName}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {searchResult.lessonId} · {searchResult.lessonShortBrief}
              </div>
            </div>
            <span
              style={{ marginLeft: "auto", color: "#4f6ef7", fontSize: 18 }}
            >
              →
            </span>
          </div>
        )}
        {searchErr && (
          <div
            style={{
              marginTop: 8,
              color: "#ef4444",
              fontSize: 13,
              padding: "0 4px",
            }}
          >
            {searchErr}
          </div>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: isMobile ? "32px 16px 120px" : "40px 32px 60px",
        }}
      >
        {segments.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#94a3b8",
              fontSize: 16,
            }}
          >
            Đang tải dữ liệu...
          </div>
        ) : (
          segments.map((seg, i) => (
            <SegmentSection
              key={seg.segmentID}
              seg={seg}
              segIdx={i}
              router={router}
              isMobile={isMobile}
            />
          ))
        )}
      </div>
    </div>
  );
}
