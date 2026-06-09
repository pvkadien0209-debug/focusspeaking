"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LessonPage({ params }) {
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("content");

  useEffect(() => {
    fetch(`/data/lessons/${params.lessonId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setLesson)
      .catch(() => setErr("Không tìm thấy bài học: " + params.lessonId));
  }, [params.lessonId]);

  /* ── Back: về segment chứa bài này ── */
  function goBack() {
    if (lesson?.segmentID) {
      router.push(`/segment/${lesson.segmentID}`);
    } else {
      router.back();
    }
  }

  if (err)
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 16 }}>
          {err}
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "#4f6ef7",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 24px",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
          }}
        >
          ← Về trang chủ
        </button>
      </div>
    );

  if (!lesson)
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 16,
        }}
      >
        Đang tải...
      </div>
    );

  return (
    <div style={{ minHeight: "100vh", background: "var(--c-bg)" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={goBack}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: 10,
            padding: "6px 14px",
            fontWeight: 700,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          ← Về các bài học khác
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {lesson.segmentDes} · {lesson.lessonId}
          </div>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: 16,
              color: "#fff",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {lesson.lessonName}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          overflow: "auto",
          position: "sticky",
          top: 56,
          zIndex: 99,
        }}
      >
        {[
          { key: "content", label: "📝 Bài học" },
          { key: "video", label: "▶️ Video" },
          { key: "practice", label: "🎤 Luyện tập" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: "14px 8px",
              fontWeight: 700,
              fontSize: 13,
              color: tab === key ? "#4f6ef7" : "#94a3b8",
              background: "none",
              border: "none",
              borderBottom:
                tab === key ? "3px solid #4f6ef7" : "3px solid transparent",
              transition: "color 0.15s, border-color 0.15s",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 120px" }}
      >
        {/* CONTENT TAB */}
        {tab === "content" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 2px 16px rgba(79,110,247,0.08)",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 800,
                  fontSize: 20,
                  marginBottom: 14,
                  color: "#1e293b",
                }}
              >
                Nội dung bài học
              </h2>
              <p style={{ color: "#475569", lineHeight: 1.8, fontSize: 15 }}>
                {lesson.lessonContent || "Nội dung đang được cập nhật..."}
              </p>
            </div>
            <button
              onClick={() => setTab("practice")}
              style={{
                width: "100%",
                background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
                color: "#fff",
                borderRadius: 14,
                padding: "16px",
                fontFamily: "var(--font-head)",
                fontWeight: 800,
                fontSize: 16,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(79,110,247,0.30)",
              }}
            >
              🎤 Bắt đầu luyện nói ngay →
            </button>
          </div>
        )}

        {/* VIDEO TAB */}
        {tab === "video" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {lesson.lessonYoutubeLink ? (
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                }}
              >
                <div style={{ position: "relative", paddingTop: "56.25%" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYoutubeId(lesson.lessonYoutubeLink)}`}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                    allowFullScreen
                    frameBorder="0"
                  />
                </div>
              </div>
            ) : lesson.lessonMp4Soure ? (
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                }}
              >
                <video
                  controls
                  style={{ width: "100%", display: "block" }}
                  src={lesson.lessonMp4Soure}
                />
              </div>
            ) : (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  padding: 40,
                  textAlign: "center",
                  boxShadow: "0 2px 16px rgba(79,110,247,0.08)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h3
                  style={{
                    fontFamily: "var(--font-head)",
                    fontWeight: 800,
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  Video sắp ra mắt
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}
                >
                  Video bài học đang được biên soạn. Hãy luyện tập với phần bài
                  tập trắc nghiệm.
                </p>
              </div>
            )}
          </div>
        )}

        {/* PRACTICE TAB */}
        {tab === "practice" && lesson.lessonWorkingSheet?.length > 0 && (
          <div style={{ animation: "fadeUp 0.3s ease", textAlign: "center" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                padding: 32,
                boxShadow: "0 4px 32px rgba(79,110,247,0.12)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎤</div>
              <h3
                style={{
                  fontFamily: "var(--font-head)",
                  fontWeight: 800,
                  fontSize: 22,
                  color: "#1e293b",
                  marginBottom: 8,
                }}
              >
                {lesson.lessonWorkingSheet.length} câu hỏi luyện nói
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Nghe câu hỏi → nói to câu trả lời → hệ thống so sánh giọng nói
                và chọn đáp án đúng nhất.
              </p>
              <button
                onClick={() => router.push(`/practice/${lesson.lessonId}`)}
                style={{
                  background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
                  color: "#fff",
                  borderRadius: 14,
                  padding: "16px 32px",
                  fontFamily: "var(--font-head)",
                  fontWeight: 800,
                  fontSize: 18,
                  boxShadow: "0 4px 20px rgba(79,110,247,0.30)",
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Bắt đầu ngay →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function extractYoutubeId(url) {
  if (!url) return "";
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : url;
}
