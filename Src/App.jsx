mport { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { db } from "./firebase";
import { GROUPS, ALL_TEAMS, SCORING, ADMIN_PASSWORD, flag, emptyPicks, calcScore } from "./data";

// ── Shared styles ──────────────────────────────────────────────────────────
const S = {
  page: { background: "#0a1628", minHeight: "100vh" },
  header: { background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 50%, #0d1f3c 100%)", borderBottom: "2px solid #C8A84B", padding: "16px 20px" },
  inner: { maxWidth: 880, margin: "0 auto" },
  gold: "#C8A84B",
  navy: "#0d1f3c",
  dim: "#4a6090",
  mid: "#8899bb",
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 },
  input: { padding: "9px 14px", borderRadius: 8, border: "1px solid #2a4070", background: "#0d1f3c", color: "#e8eaf0", fontSize: 14, outline: "none", width: "100%" },
  select: { padding: "7px 10px", background: "#0d1f3c", border: "1px solid #2a4070", borderRadius: 6, color: "#e8eaf0", fontSize: 13, outline: "none", width: "100%" },
  btnGold: { padding: "10px 24px", background: "#C8A84B", border: "none", borderRadius: 8, color: "#0a1628", fontWeight: 800, fontSize: 14 },
  btnGhost: { padding: "8px 16px", background: "transparent", border: "1px solid #2a4070", borderRadius: 8, color: "#8899bb", fontSize: 13 },
};

export default function App() {
  const [view, setView] = useState("leaderboard");
  const [players, setPlayers] = useState({});
  const [results, setResults] = useState({ groups: {}, bracket: { r32: [], qf: [], sf: [], final: [], champion: "" } });
  const [currentPlayer, setCurrentPlayer] = useState(null); // { id, name, picks, submitted }
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  // Firebase real-time listeners
  useEffect(() => {
    const playersRef = ref(db, "players");
    const resultsRef = ref(db, "results");

    const unsubPlayers = onValue(playersRef, snap => {
      setPlayers(snap.val() || {});
      setLoading(false);
    });
    const unsubResults = onValue(resultsRef, snap => {
      if (snap.val()) setResults(snap.val());
    });

    return () => { unsubPlayers(); unsubResults(); };
  }, []);

  // Sync currentPlayer when players update from Firebase
