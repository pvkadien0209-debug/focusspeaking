"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { findBest, compareTwoStrings } from "../../../lib/stringSimilarity";

/* ── Config ────────────────────────────────────────────── */
const ANSWER_KEYS = ["A", "B", "C", "D"];
const ANSWER_COLORS = ["#4f6ef7", "#22c55e", "#f97316", "#ef4444"];
const SCORE_BANDS = [
  [0, 0.2],
  [0.2, 0.3],
  [0.3, 0.4],
  [0.4, 0.5],
  [0.5, 0.6],
  [0.6, 0.7],
  [0.7, 0.8],
  [0.8, 0.9],
  [0.9, 1.01],
];

/* ── Read audio (desktop) or show text (mobile) ─────── */
function readMessage(audioId, text) {
  if (!audioId) return;
  let link = "/audio/";
  if (audioId.includes("_")) link += audioId.split("_")[0] + "/";
  else if (audioId.startsWith("B")) link += "T1A1/";
  const audio = new Audio(`${link}${audioId}.mp3`);
  // audio.addEventListener("play", () =>
  //   document.getElementById("sttStopBTN")?.click(),
  // );
  audio.addEventListener("ended", () => {
    audio.remove();
    // setTimeout(() => document.getElementById("sttStartBTN")?.click(), 350);
  });
  audio.addEventListener("error", () => {
    audio.remove();
  });
  audio.play().catch(() => {});
}

/* ── Similarity band index ──────────────────────────── */
function getBandIdx(score) {
  for (let i = 0; i < SCORE_BANDS.length; i++) {
    if (score >= SCORE_BANDS[i][0] && score < SCORE_BANDS[i][1]) return i;
  }
  return 8;
}

/* ── MAIN PRACTICE PAGE ─────────────────────────────── */
export default function PracticePage({ params }) {
  const router = useRouter();
  const [lesson, setLesson] = useState(null);
  const [err, setErr] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [scoreRight, setScoreRight] = useState(0);
  const [scoreWrong, setScoreWrong] = useState(0);
  const [scoreSkip, setScoreSkip] = useState(0);
  const [bandCounts, setBandCounts] = useState(Array(9).fill(0)); // similarity histogram
  const [lastSim, setLastSim] = useState(null);
  const [lastPick, setLastPick] = useState(null); // index of picked answer
  const [lastCorrect, setLastCorrect] = useState(null); // true/false/null
  const [transcript, setTranscript] = useState("");
  const [sttActive, setSttActive] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [textMode, setTextMode] = useState(false); // show question text instead of audio
  const [shuffled, setShuffled] = useState(false); // shuffle mode toggle
  const [explainOpen, setExplainOpen] = useState(false); // explain popup
  const recognitionRef = useRef(null);
  const isMobile = useRef(false);
  const originalOrderRef = useRef(null); // store original order

  /* ── Load lesson data ──────────────────────────────── */
  useEffect(() => {
    isMobile.current = /Mobi|Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent,
    );
    fetch(`/data/lessons/${params.lessonId}.json`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        originalOrderRef.current = [...data.lessonWorkingSheet];
        setLesson(data);
      })
      .catch(() => setErr("Không tìm thấy bài học"));
  }, [params.lessonId]);

  /* ── Toggle shuffle ──────────────────────────────────── */
  function toggleShuffle() {
    if (!lesson) return;
    const newShuffled = !shuffled;
    setShuffled(newShuffled);
    setQIdx(0);
    setLastPick(null);
    setLastCorrect(null);
    setLastSim(null);
    resetSTT();
    if (newShuffled) {
      const arr = [...originalOrderRef.current];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setLesson((prev) => ({ ...prev, lessonWorkingSheet: arr }));
    } else {
      setLesson((prev) => ({
        ...prev,
        lessonWorkingSheet: [...originalOrderRef.current],
      }));
    }
  }

  /* ── Init SpeechRecognition ────────────────────────── */
  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSttSupported(false);
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else final += e.results[i][0].transcript;
      }
      // Write to hidden DOM anchor
      const el = document.getElementById("dtphTranscript");
      if (el) el.textContent = final;
      setTranscript(final);
    };

    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") setSttActive(false);
    };

    rec.onend = () => {
      // On mobile: don't auto-restart (user controls it)
      // On desktop: auto-restart if still active
      if (!isMobile.current && recognitionRef.current?._shouldRun) {
        try {
          rec.start();
        } catch (_) {}
      } else {
        setSttActive(false);
      }
    };

    recognitionRef.current = rec;
    recognitionRef.current._shouldRun = false;
    return () => {
      try {
        rec.stop();
      } catch (_) {}
    };
  }, []);

  /* ── Auto-play audio khi chuyển câu / load câu đầu ── */
  useEffect(() => {
    if (!lesson) return;
    const q = lesson.lessonWorkingSheet[qIdx];
    if (!textMode && q?.["qs-audio"]) readMessage(q["qs-audio"], q["qs-text"]);
  }, [lesson, qIdx, textMode]);

  /* ── STT controls exposed via hidden DOM buttons ───── */
  useEffect(() => {
    // These buttons are called by ReadMessageMp3 audio events
    const startBtn = document.getElementById("sttStartBTN");
    const stopBtn = document.getElementById("sttStopBTN");
    if (startBtn) startBtn.onclick = () => startSTT();
    if (stopBtn) stopBtn.onclick = () => stopSTT();
  });

  function startSTT() {
    if (!recognitionRef.current || sttActive) return;
    recognitionRef.current._shouldRun = true;
    try {
      recognitionRef.current.start();
      setSttActive(true);
    } catch (_) {}
  }

  function stopSTT() {
    if (!recognitionRef.current) return;
    recognitionRef.current._shouldRun = false;
    try {
      recognitionRef.current.stop();
      setSttActive(false);
    } catch (_) {}
  }

  function resetSTT() {
    const el = document.getElementById("dtphTranscript");
    if (el) el.textContent = "";
    setTranscript("");
  }

  /* ── Check answer (triggered by check button) ───────── */
  function checkAnswer() {
    if (!lesson) return;
    const q = lesson.lessonWorkingSheet[qIdx];
    const input =
      document.getElementById("dtphTranscript")?.textContent?.trim() || "";
    if (!input) return;

    const answers = ["aw-A", "aw-B", "aw-C", "aw-D"].map((k) => q[k]);
    const { index, score } = findBest(input, answers, 0.25);

    setLastSim(score);
    if (score > 0 && index >= 0) {
      // Update similarity histogram
      const band = getBandIdx(score);
      setBandCounts((prev) => {
        const n = [...prev];
        n[band]++;
        return n;
      });

      const pickedKey = ANSWER_KEYS[index];
      setLastPick(index);
      const isCorrect = pickedKey === q["rs-dapan"];
      setLastCorrect(isCorrect);
      if (isCorrect) setScoreRight((s) => s + 1);
      else setScoreWrong((s) => s + 1);
    } else {
      setLastPick(null);
      setLastCorrect(null);
    }
    resetSTT();
  }

  /* ── Navigate questions ─────────────────────────────── */
  function nextQ() {
    if (!lesson) return;
    setLastPick(null);
    setLastCorrect(null);
    setLastSim(null);
    resetSTT();
    const total = lesson.lessonWorkingSheet.length;
    if (qIdx + 1 >= total) {
      setDone(true);
    } else {
      setQIdx((q) => q + 1);
    }
  }

  function skipQ() {
    setScoreSkip((s) => s + 1);
    nextQ();
  }

  function playQuestion() {
    if (!lesson) return;
    const q = lesson.lessonWorkingSheet[qIdx];
    if (!textMode && q["qs-audio"]) readMessage(q["qs-audio"], q["qs-text"]);
  }

  /* ── Loading / Error ─────────────────────────────────── */
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
          }}
        >
          ← Về
        </button>
      </div>
    );
  if (!lesson)
    return (
      <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
        Đang tải...
      </div>
    );

  const qs = lesson.lessonWorkingSheet;
  const total = qs.length;
  const q = qs[qIdx];
  const progress = (qIdx / total) * 100;

  /* ── DONE SCREEN ─────────────────────────────────────── */
  if (done)
    return (
      <DoneScreen
        scoreRight={scoreRight}
        scoreWrong={scoreWrong}
        scoreSkip={scoreSkip}
        total={total}
        bandCounts={bandCounts}
        router={router}
        lessonId={params.lessonId}
      />
    );

  /* ── MAIN RENDER ─────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        paddingBottom: 220,
      }}
    >
      {/* Hidden STT DOM anchors */}
      <div style={{ display: "none" }}>
        <div id="dtphTranscript" />
        <div id="aw01Textcontent" />
        <button id="sttStartBTN" />
        <button id="sttStopBTN" />
        <button id="checkBTN" onClick={checkAnswer} />
      </div>

      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <button
          onClick={() => router.push(`/lesson/${params.lessonId}`)}
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            borderRadius: 10,
            padding: "6px 12px",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            🎤 FocusSpeaking
          </div>
          <div
            style={{
              color: "#fff",
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lesson.lessonName}
          </div>
        </div>
        {/* Score chips */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            ["✓", scoreRight, "#22c55e"],
            ["✗", scoreWrong, "#ef4444"],
            ["→", scoreSkip, "#94a3b8"],
          ].map(([ic, val, col]) => (
            <div
              key={ic}
              style={{
                background: col,
                borderRadius: 99,
                padding: "3px 9px",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {ic} {val}
            </div>
          ))}
        </div>
        {/* Utility buttons: shuffle + text mode */}
        <div style={{ display: "flex", gap: 6, marginLeft: 4 }}>
          <button
            onClick={toggleShuffle}
            title={shuffled ? "Bỏ trộn câu" : "Trộn ngẫu nhiên"}
            style={{
              background: shuffled
                ? "rgba(249,115,22,0.85)"
                : "rgba(255,255,255,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              border: shuffled
                ? "1px solid #fb923c"
                : "1px solid rgba(255,255,255,0.3)",
            }}
          >
            🔀
          </button>
          <button
            onClick={() => setTextMode((v) => !v)}
            title={
              textMode ? "Chuyển sang nghe audio" : "Hiện text thay vì nghe"
            }
            style={{
              background: textMode
                ? "rgba(139,92,246,0.85)"
                : "rgba(255,255,255,0.18)",
              color: "#fff",
              borderRadius: 8,
              padding: "5px 8px",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              border: textMode
                ? "1px solid #a78bfa"
                : "1px solid rgba(255,255,255,0.3)",
            }}
          >
            📖
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ height: 5, background: "#e0e7ff" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <div
        style={{
          textAlign: "right",
          fontSize: 11,
          color: "#94a3b8",
          padding: "4px 16px 0",
          fontWeight: 600,
        }}
      >
        {qIdx + 1} / {total}
      </div>

      {/* ── Question area (scrollable) ── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 16px 0" }}>
        {/* Index card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "20px 20px 16px",
            boxShadow: "0 4px 24px rgba(79,110,247,0.10)",
            marginBottom: 12,
            animation: "fadeUp 0.3s ease",
          }}
        >
          {/* Question label */}
          <div
            style={{
              fontSize: 11,
              color: "#4f6ef7",
              fontWeight: 700,
              marginBottom: 8,
              letterSpacing: 0.5,
              textTransform: "uppercase",
            }}
          >
            Câu {qIdx + 1} {/* Text mode: show question text */}
            {textMode && q["qs-text"] && (
              <div
                style={{
                  display: "block",
                  background: "#eff6ff",
                  borderRadius: 10,
                  padding: "8px 14px",
                  fontSize: 14,
                  color: "#1e40af",
                  fontWeight: 600,
                  marginTop: 6,
                  lineHeight: 1.5,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                💬 {q["qs-text"]}
              </div>
            )}
          </div>
        </div>
        {/* Hint - ẩn khi đã trả lời */}
        {lastPick === null && (
          <div
            style={{
              background: "linear-gradient(90deg,#fef3c7,#fde68a30)",
              border: "1px solid #fde68a",
              borderRadius: 12,
              padding: "10px 14px",
              fontSize: 13,
              color: "#92400e",
              fontWeight: 600,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>💡</span> Gợi ý:{" "}
            <em style={{ color: "#b45309" }}>{q["hint"]}</em>
          </div>
        )}
        {/* 4 Answer choices */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 12,
          }}
        >
          {ANSWER_KEYS.map((key, i) => {
            const text = q[`aw-${key}`];
            const isPicked = lastPick === i;
            const isCorrectAnswer = key === q["rs-dapan"];
            let bg = "#fff",
              border = `2px solid ${ANSWER_COLORS[i]}22`,
              textColor = "#1e293b";

            if (lastPick !== null) {
              if (isPicked && lastCorrect) {
                bg = "#dcfce7";
                border = `2px solid #22c55e`;
                textColor = "#15803d";
              } else if (isPicked && !lastCorrect) {
                bg = "#fee2e2";
                border = `2px solid #ef4444`;
                textColor = "#b91c1c";
              } else if (isCorrectAnswer) {
                bg = "#eff6ff";
                border = `2px solid #4f6ef7`;
              }
            }

            return (
              <div
                key={key}
                style={{
                  background: bg,
                  border,
                  borderRadius: 14,
                  padding: "12px 14px",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 8 }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 99,
                      minWidth: 26,
                      background: ANSWER_COLORS[i],
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {key}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: textColor,
                      lineHeight: 1.4,
                    }}
                  >
                    {text}
                    {isPicked && lastCorrect && (
                      <span style={{ marginLeft: 4 }}>✓</span>
                    )}
                    {isPicked && !lastCorrect && (
                      <span style={{ marginLeft: 4 }}>✗</span>
                    )}
                    {!isPicked && isCorrectAnswer && lastPick !== null && (
                      <span style={{ marginLeft: 4, color: "#4f6ef7" }}>←</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phần thao tác */}
        <div>
          {/* Nút Nghe + Bỏ qua - ẩn khi đã trả lời */}
          {lastPick === null && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {!textMode && (
                <button
                  onClick={playQuestion}
                  style={{
                    flex: 1,
                    background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
                    color: "#fff",
                    borderRadius: 12,
                    padding: "11px 0",
                    fontWeight: 700,
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  🔊 Nghe câu hỏi
                </button>
              )}
              <button
                onClick={skipQ}
                style={{
                  background: "#f1f5f9",
                  color: "#64748b",
                  borderRadius: 12,
                  padding: "11px 16px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Bỏ qua →
              </button>
            </div>
          )}

          {/* Similarity readout - compact badge */}
          {lastSim !== null && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
                animation: "popIn 0.25s ease",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#fff",
                  border: `2px solid ${lastSim >= 0.7 ? "#22c55e" : lastSim >= 0.4 ? "#eab308" : "#ef4444"}`,
                  borderRadius: 99,
                  padding: "5px 12px 5px 8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                }}
              >
                <span style={{ fontSize: 14 }}>📊</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      lastSim >= 0.7
                        ? "#15803d"
                        : lastSim >= 0.4
                          ? "#a16207"
                          : "#b91c1c",
                  }}
                >
                  Độ giống: {Math.round(lastSim * 100)}%
                </span>
                <div
                  style={{
                    width: 56,
                    height: 6,
                    background: "#e0e7ff",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${lastSim * 100}%`,
                      background:
                        lastSim >= 0.7
                          ? "#22c55e"
                          : lastSim >= 0.4
                            ? "#eab308"
                            : "#ef4444",
                      borderRadius: 99,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              </div>
              {lastCorrect !== null && (
                <span style={{ fontSize: 20 }}>
                  {lastCorrect ? "✅" : "❌"}
                </span>
              )}
            </div>
          )}

          {/* Explain block - separated */}
          {lastSim !== null && (
            <div
              style={{
                background: "linear-gradient(90deg,#fef3c7,#fde68a30)",
                border: "1px solid #fde68a",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 13,
                color: "#92400e",
                fontWeight: 600,
                marginBottom: 12,
                animation: "popIn 0.3s ease",
              }}
            >
              <span style={{ marginRight: 6 }}>💡</span>
              <span style={{ fontWeight: 700 }}>Giải thích: </span>
              {(() => {
                const txt = q["rs-explain"] || "";
                if (!txt)
                  return (
                    <em style={{ color: "#a16207", fontWeight: 400 }}>
                      Không có giải thích
                    </em>
                  );
                if (txt.length <= 300) {
                  return (
                    <em style={{ color: "#b45309", fontWeight: 400 }}>{txt}</em>
                  );
                }
                return (
                  <>
                    <em style={{ color: "#b45309", fontWeight: 400 }}>
                      {txt.slice(0, 200)}…
                    </em>{" "}
                    <button
                      onClick={() => setExplainOpen(true)}
                      style={{
                        display: "inline",
                        background: "none",
                        border: "none",
                        padding: 0,
                        color: "#7c3aed",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Xem thêm ▸
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* Explain popup modal */}
          {explainOpen && (
            <div
              onClick={() => setExplainOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15,23,42,0.55)",
                zIndex: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 16px",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "#fff",
                  borderRadius: 20,
                  padding: "24px 20px",
                  maxWidth: 520,
                  width: "100%",
                  maxHeight: "80vh",
                  overflowY: "auto",
                  boxShadow: "0 16px 64px rgba(0,0,0,0.2)",
                  animation: "popIn 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 15,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    💡 Giải thích
                  </div>
                  <button
                    onClick={() => setExplainOpen(false)}
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      borderRadius: 8,
                      padding: "5px 10px",
                      fontWeight: 700,
                      fontSize: 16,
                      color: "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: "#92400e",
                    lineHeight: 1.7,
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {q["rs-explain"]}
                </p>
              </div>
            </div>
          )}

          {/* Next button */}
          {lastPick !== null && (
            <button
              onClick={nextQ}
              style={{
                width: "100%",
                background: "linear-gradient(90deg,#22c55e,#16a34a)",
                color: "#fff",
                borderRadius: 14,
                padding: "14px",
                fontFamily: "var(--font-head)",
                fontWeight: 800,
                fontSize: 16,
                boxShadow: "0 4px 16px rgba(34,197,94,0.30)",
                marginBottom: 12,
                animation: "popIn 0.2s ease",
              }}
            >
              Câu tiếp theo →
            </button>
          )}
        </div>
      </div>

      {/* ── Fixed STT Panel ── */}
      <STTPanel
        transcript={transcript}
        sttActive={sttActive}
        sttSupported={sttSupported}
        onStart={startSTT}
        onStop={stopSTT}
        onReset={resetSTT}
        onCheck={checkAnswer}
        disabled={lastPick !== null}
      />
    </div>
  );
}

/* ── STT Panel Component (fixed bottom) ───────────────── */
function STTPanel({
  transcript,
  sttActive,
  sttSupported,
  onStart,
  onStop,
  onReset,
  onCheck,
  disabled,
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(16px)",
        borderTop: "1px solid #e0e7ff",
        boxShadow: "0 -4px 32px rgba(79,110,247,0.12)",
        padding: "12px 16px 20px",
      }}
    >
      {/* Transcript display */}
      <div
        style={{
          background: sttActive
            ? "linear-gradient(90deg,#eff6ff,#f0fdf4)"
            : "#f8faff",
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 10,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          border: `1px solid ${sttActive ? "#93c5fd" : "#e0e7ff"}`,
          transition: "border-color 0.2s, background 0.2s",
          animation: sttActive ? "sttPulse 2s ease infinite" : "none",
        }}
      >
        <span style={{ fontSize: 16, marginRight: 8 }}>
          {sttActive ? "🔴" : "🎙️"}
        </span>
        <span
          style={{
            flex: 1,
            fontSize: 14,
            color: transcript ? "#1e293b" : "#94a3b8",
            fontStyle: transcript ? "normal" : "italic",
            fontWeight: transcript ? 600 : 400,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {transcript ||
            (sttActive
              ? "Đang lắng nghe... nói to câu trả lời"
              : "Nhấn MIC để bắt đầu nói")}
        </span>
      </div>

      {/* Control buttons */}
      <div style={{ display: "flex", gap: 8, maxWidth: 680, margin: "0 auto" }}>
        {/* MIC toggle */}
        {sttSupported ? (
          <button
            onClick={sttActive ? onStop : onStart}
            disabled={disabled}
            style={{
              flex: 1,
              borderRadius: 12,
              padding: "11px 0",
              background: sttActive
                ? "linear-gradient(90deg,#ef4444,#f97316)"
                : "linear-gradient(90deg,#4f6ef7,#7c3aed)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              animation: sttActive ? "pulse-ring 1.5s infinite" : "none",
            }}
          >
            {sttActive ? "⏹ Dừng" : "🎤 MIC"}
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              background: "#f1f5f9",
              borderRadius: 12,
              padding: "11px",
              textAlign: "center",
              fontSize: 12,
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            STT không hỗ trợ trên trình duyệt này
          </div>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={disabled || !transcript}
          style={{
            background: "#f1f5f9",
            color: "#64748b",
            borderRadius: 12,
            padding: "11px 14px",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ↺ Reset
        </button>

        {/* Check */}
        <button
          onClick={onCheck}
          disabled={disabled || !transcript}
          style={{
            flex: 1.2,
            background: "linear-gradient(90deg,#22c55e,#16a34a)",
            color: "#fff",
            borderRadius: 12,
            padding: "11px 0",
            fontWeight: 800,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: "0 3px 12px rgba(34,197,94,0.25)",
          }}
        >
          ✓ Kiểm tra
        </button>
      </div>
    </div>
  );
}

/* ── Done / Summary Screen ────────────────────────────── */
function DoneScreen({
  scoreRight,
  scoreWrong,
  scoreSkip,
  total,
  bandCounts,
  router,
  lessonId,
}) {
  const pct = total > 0 ? Math.round((scoreRight / total) * 100) : 0;
  const bandLabels = [
    "0–20%",
    "20–30%",
    "30–40%",
    "40–50%",
    "50–60%",
    "60–70%",
    "70–80%",
    "80–90%",
    "90–100%",
  ];
  const maxBand = Math.max(...bandCounts, 1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        padding: "0 0 40px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
          padding: "16px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 800,
            fontSize: 22,
            color: "#fff",
          }}
        >
          🏆 Tổng kết bài luyện
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        {/* Big score */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "28px 24px",
            textAlign: "center",
            boxShadow: "0 4px 32px rgba(79,110,247,0.12)",
            marginBottom: 20,
            animation: "popIn 0.4s ease",
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 8 }}>
            {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 900,
              fontSize: 52,
              color: "#4f6ef7",
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 20,
              marginTop: 4,
            }}
          >
            {pct >= 80
              ? "Xuất sắc! Tiếp tục phát huy!"
              : pct >= 50
                ? "Tốt! Luyện thêm nhé!"
                : "Cố gắng hơn lần sau!"}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {[
              ["✅ Đúng", scoreRight, "#22c55e"],
              ["❌ Sai", scoreWrong, "#ef4444"],
              ["⏩ Bỏ qua", scoreSkip, "#94a3b8"],
            ].map(([label, val, color]) => (
              <div
                key={label}
                style={{
                  background: `${color}15`,
                  borderRadius: 14,
                  padding: "12px 8px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-head)",
                    fontWeight: 800,
                    fontSize: 28,
                    color,
                  }}
                >
                  {val}
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 700 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Similarity histogram */}
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            padding: "20px",
            boxShadow: "0 2px 16px rgba(79,110,247,0.08)",
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: 16,
              marginBottom: 14,
              color: "#1e293b",
            }}
          >
            📊 Phân bổ độ giống phát âm
          </h3>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>
            Biểu đồ cho thấy trình độ phát âm của bạn theo từng mức độ giống
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              alignItems: "flex-end",
              height: 100,
            }}
          >
            {bandCounts.map((count, i) => {
              const barPct = maxBand > 0 ? (count / maxBand) * 100 : 0;
              const hue = Math.round((i / 8) * 120); // red → green
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}
                  >
                    {count || ""}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max(barPct, count > 0 ? 8 : 0)}%`,
                      background: `hsl(${hue},70%,50%)`,
                      borderRadius: "4px 4px 0 0",
                      minHeight: count > 0 ? 8 : 2,
                      transition: "height 0.5s ease",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            {bandLabels.map((l, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  fontSize: 8,
                  color: "#94a3b8",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#64748b",
              textAlign: "center",
            }}
          >
            Cột cao nhất cho thấy mức độ phát âm bạn hay đạt được nhất
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={() => {
              window.location.reload();
            }}
            style={{
              background: "linear-gradient(90deg,#4f6ef7,#7c3aed)",
              color: "#fff",
              borderRadius: 14,
              padding: "14px",
              fontFamily: "var(--font-head)",
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            🔁 Làm lại bài này
          </button>
          <button
            onClick={() => router.push(`/lesson/${lessonId}`)}
            style={{
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: 14,
              padding: "14px",
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            ← Về bài học
          </button>
          <button
            onClick={() => router.push("/")}
            style={{
              background: "#f1f5f9",
              color: "#475569",
              borderRadius: 14,
              padding: "14px",
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            🏠 Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
