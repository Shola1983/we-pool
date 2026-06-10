import { useState, useEffect } from "react";
import { ref, onValue, set, remove } from "firebase/database";
import { db } from "./firebase";
import { GROUPS, ALL_TEAMS, SCORING, ADMIN_PASSWORD, flag, emptyPicks, calcScore } from "./data";

const S = {
  page: { background: "#0a1628", minHeight: "100vh" },
  header: { background: "linear-gradient(135deg, #0d1f3c 0%, #1a3a6b 50%, #0d1f3c 100%)", borderBottom: "2px solid #C8A84B", padding: "16px 20px" },
  inner: { maxWidth: 880, margin: "0 auto" },
  gold: "#C8A84B", navy: "#0d1f3c", dim: "#4a6090", mid: "#8899bb",
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
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  useEffect(() => {
    const unsubPlayers = onValue(ref(db, "players"), snap => { setPlayers(snap.val() || {}); setLoading(false); });
    const unsubResults = onValue(ref(db, "results"), snap => { if (snap.val()) setResults(snap.val()); });
    return () => { unsubPlayers(); unsubResults(); };
  }, []);

  useEffect(() => {
    if (currentPlayer && players[currentPlayer.id]) setCurrentPlayer(prev => ({ ...prev, ...players[prev.id] }));
  }, [players]);

  const savePlayer = async (player) => { await set(ref(db, `players/${player.id}`), player); };
  const saveResults = async (r) => { await set(ref(db, "results"), r); showToast("Results saved ✓"); };
  const removePlayer = async (id) => { await remove(ref(db, `players/${id}`)); showToast("Player removed"); };
  const resetPlayerPicks = async (id) => { const p = players[id]; if (!p) return; await savePlayer({ ...p, picks: emptyPicks(), submitted: false }); showToast("Picks reset"); };

  const addPlayer = async () => {
    const name = newName.trim();
    if (!name) return;
    if (Object.values(players).some(p => p.name.toLowerCase() === name.toLowerCase())) { showToast("Name already taken"); return; }
    const id = `p_${Date.now()}`;
    const player = { id, name, picks: emptyPicks(), submitted: false };
    await savePlayer(player);
    setCurrentPlayer(player);
    setNewName("");
    setView("picks");
    showToast(`Welcome, ${name}! Make your picks.`);
  };

  const leaderboard = Object.values(players).map(p => ({ ...p, score: calcScore(p.picks, results) })).sort((a, b) => b.score - a.score);

  if (loading) return <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: S.gold, fontSize: 18 }}>Loading pool data...</div></div>;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div style={S.inner}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ fontSize: 30 }}>⚽</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: S.gold, letterSpacing: 1 }}>SHOTIME FIFA WORLD CUP 2026</div>
              <div style={{ fontSize: 11, color: S.mid, letterSpacing: 3, textTransform: "uppercase" }}>Pool Tracker</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["leaderboard","🏆 Leaderboard"],["picks","✏️ My Picks"],["admin","⚙️ Admin"],["rules","📋 Rules"]].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, background: view === v ? S.gold : "rgba(255,255,255,0.08)", color: view === v ? "#0a1628" : "#c8d4e8" }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: S.gold, color: "#0a1628", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 14, zIndex: 999 }}>{toast}</div>}
      <div style={{ ...S.inner, padding: "20px 16px" }}>
        {view === "leaderboard" && <LeaderboardView leaderboard={leaderboard} players={players} newName={newName} setNewName={setNewName} addPlayer={addPlayer} setCurrentPlayer={setCurrentPlayer} setView={setView} />}
        {view === "picks" && <PicksView currentPlayer={currentPlayer} setCurrentPlayer={setCurrentPlayer} players={players} savePlayer={savePlayer} setView={setView} showToast={showToast} />}
        {view === "admin" && <AdminView results={results} saveResults={saveResults} adminUnlocked={adminUnlocked} setAdminUnlocked={setAdminUnlocked} players={players} removePlayer={removePlayer} resetPlayerPicks={resetPlayerPicks} showToast={showToast} />}
        {view === "rules" && <RulesView />}
      </div>
    </div>
  );
}

function LeaderboardView({ leaderboard, players, newName, setNewName, addPlayer, setCurrentPlayer, setView }) {
  const medals = ["🥇","🥈","🥉"];
  return (
    <div>
      <div style={{ ...S.card, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", marginBottom: 24, padding: 18 }}>
        <div style={{ fontWeight: 700, color: S.gold, marginBottom: 10, fontSize: 15 }}>Join the Pool</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="Enter your name..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPlayer()} style={{ ...S.input, flex: 1, minWidth: 180 }} />
          <button onClick={addPlayer} style={{ ...S.btnGold, whiteSpace: "nowrap" }}>Join & Make Picks →</button>
        </div>
        {Object.values(players).length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 7 }}>
            <span style={{ fontSize: 12, color: S.dim, marginRight: 4 }}>Already joined:</span>
            {Object.values(players).map(p => (
              <button key={p.id} onClick={() => { setCurrentPlayer(p); setView("picks"); }} style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid #2a4070", background: "rgba(255,255,255,0.05)", color: S.mid, fontSize: 12 }}>{p.submitted ? "🔒" : "✏️"} {p.name}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 14 }}>🏆 Live Standings</div>
      {leaderboard.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 20px", color: S.dim, fontSize: 15 }}>No players yet — be the first to join!</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {leaderboard.map((player, i) => (
            <div key={player.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: i === 0 ? "linear-gradient(135deg, rgba(200,168,75,0.15), rgba(200,168,75,0.04))" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "rgba(200,168,75,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10 }}>
              <div style={{ width: 34, textAlign: "center", fontSize: i < 3 ? 24 : 16, color: i >= 3 ? S.dim : undefined }}>{medals[i] || `#${i+1}`}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: i === 0 ? S.gold : "#e8eaf0" }}>{player.name}</div>
                <div style={{ fontSize: 12, color: S.dim, marginTop: 2 }}>{player.submitted ? "Picks locked 🔒" : "Picks pending ✏️"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: i === 0 ? S.gold : "#e8eaf0", lineHeight: 1 }}>{player.score}</div>
                <div style={{ fontSize: 11, color: S.dim }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PicksView({ currentPlayer, setCurrentPlayer, players, savePlayer, setView, showToast }) {
  const [tab, setTab] = useState("groups");
  const [localPicks, setLocalPicks] = useState(null);
  useEffect(() => { if (currentPlayer) setLocalPicks(JSON.parse(JSON.stringify(currentPlayer.picks))); }, [currentPlayer?.id]);
  if (!currentPlayer) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 44, marginBottom: 14 }}>✏️</div>
      <div style={{ color: S.mid, fontSize: 15, marginBottom: 20 }}>Select your name to edit your picks.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
        {Object.values(players).map(p => <button key={p.id} onClick={() => setCurrentPlayer(p)} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #2a4070", background: "rgba(255,255,255,0.05)", color: "#e8eaf0", fontWeight: 600, fontSize: 14 }}>{p.name} {p.submitted ? "🔒" : "✏️"}</button>)}
      </div>
    </div>
  );
  if (!localPicks) return null;
  const updateGroup = (g, field, val) => {
    const newPicks = { ...localPicks, groups: { ...localPicks.groups, [g]: { ...localPicks.groups[g], [field]: val } } };
    ["first","second","third"].filter(f => f !== field).forEach(f => { if (newPicks.groups[g][f] === val && val !== "") newPicks.groups[g][f] = ""; });
    setLocalPicks(newPicks);
  };
  const updateBracket = (round, idx, val) => {
    const br = { ...localPicks.bracket };
    if (round === "champion") { br.champion = val; } else { const arr = [...(br[round] || [])]; arr[idx] = val; br[round] = arr; }
    setLocalPicks({ ...localPicks, bracket: br });
  };
  const handleSubmit = async () => {
    await savePlayer({ ...currentPlayer, picks: localPicks, submitted: true });
    setCurrentPlayer(null); setView("leaderboard"); showToast("Picks locked in! 🔒");
  };
  const saveDraft = async () => { await savePlayer({ ...currentPlayer, picks: localPicks }); showToast("Draft saved ✓"); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{currentPlayer.name}'s Picks</div>
          {currentPlayer.submitted && <div style={{ fontSize: 12, color: S.gold, marginTop: 2 }}>🔒 Previously submitted</div>}
        </div>
        <button onClick={() => setCurrentPlayer(null)} style={S.btnGhost}>Switch player</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid #1a3050", paddingBottom: 10 }}>
        {[["groups","🏟️ Group Stage"],["bracket","🗂️ Bracket"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, background: tab === t ? "#1a3a6b" : "transparent", color: tab === t ? S.gold : S.dim, borderBottom: tab === t ? `2px solid ${S.gold}` : "2px solid transparent" }}>{label}</button>
        ))}
      </div>
      {tab === "groups" && (
        <div>
          <div style={{ color: S.dim, fontSize: 13, marginBottom: 16 }}>Pick the top 3 finishers in each group.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(275px, 1fr))", gap: 14 }}>
            {Object.entries(GROUPS).map(([g, teams]) => (
              <div key={g} style={S.card}>
                <div style={{ fontWeight: 800, color: S.gold, fontSize: 14, marginBottom: 10 }}>Group {g}</div>
                {["first","second","third"].map((pos, i) => (
                  <div key={pos} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: S.dim, marginBottom: 3 }}>{i===0?"1st (5pts)":i===1?"2nd (3pts)":"3rd (2pts)"}</div>
                    <select value={localPicks.groups[g]?.[pos]||""} onChange={e => updateGroup(g, pos, e.target.value)} style={S.select}>
                      <option value="">— Pick team —</option>
                      {teams.map(t => <option key={t} value={t}>{flag(t)} {t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "bracket" && (
        <div>
          <div style={{ color: S.dim, fontSize: 13, marginBottom: 16 }}>Pick who advances in each round.</div>
          {[{key:"r32",label:"Round of 32",count:16,pts:5},{key:"qf",label:"Quarterfinals",count:8,pts:8},{key:"sf",label:"Semifinals",count:4,pts:12},{key:"final",label:"Final",count:2,pts:15}].map(({key,label,count,pts}) => (
            <div key={key} style={{ marginBottom: 22 }}>
              <div style={{ fontWeight: 700, color: S.mid, fontSize: 14, marginBottom: 10 }}>{label} <span style={{ color: S.dim, fontWeight: 400, fontSize: 12 }}>({pts} pts)</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(195px, 1fr))", gap: 8 }}>
                {Array.from({length:count}).map((_,i) => (
                  <select key={i} value={(localPicks.bracket[key]||[])[i]||""} onChange={e=>updateBracket(key,i,e.target.value)} style={S.select}>
                    <option value="">— Pick #{i+1} —</option>
                    {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
                  </select>
                ))}
              </div>
            </div>
          ))}
          <div style={{ ...S.card, border: "1px solid rgba(200,168,75,0.35)", background: "rgba(200,168,75,0.07)", padding: 16 }}>
            <div style={{ fontWeight: 800, color: S.gold, marginBottom: 10, fontSize: 15 }}>🏆 Champion (20 pts)</div>
            <select value={localPicks.bracket.champion||""} onChange={e=>updateBracket("champion",null,e.target.value)} style={{ ...S.select, padding: "10px 14px", border: `1px solid ${S.gold}`, fontSize: 15, fontWeight: 700 }}>
              <option value="">— Pick the champion —</option>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
            </select>
          </div>
        </div>
      )}
      <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={handleSubmit} style={S.btnGold}>{currentPlayer.submitted ? "Update Picks 🔄" : "Lock In Picks 🔒"}</button>
        <button onClick={saveDraft} style={{ ...S.btnGhost, color: S.mid }}>Save Draft</button>
        <button onClick={() => { setCurrentPlayer(null); setView("leaderboard"); }} style={S.btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

function AdminView({ results, saveResults, adminUnlocked, setAdminUnlocked, players, removePlayer, resetPlayerPicks, showToast }) {
  const [adminPw, setAdminPw] = useState("");
  const [tab, setTab] = useState("results");
  const [localResults, setLocalResults] = useState(results);
  useEffect(() => { setLocalResults(results); }, [results]);
  if (!adminUnlocked) return (
    <div style={{ maxWidth: 340, margin: "50px auto", textAlign: "center" }}>
      <div style={{ fontSize: 42, marginBottom: 12 }}>🔐</div>
      <div style={{ color: S.mid, marginBottom: 20 }}>Admin access required</div>
      <input type="password" placeholder="Enter admin password" value={adminPw} onChange={e => setAdminPw(e.target.value)} onKeyDown={e => e.key === "Enter" && (adminPw === ADMIN_PASSWORD ? setAdminUnlocked(true) : showToast("Wrong password"))} style={{ ...S.input, marginBottom: 10 }} />
      <button onClick={() => adminPw === ADMIN_PASSWORD ? setAdminUnlocked(true) : showToast("Wrong password")} style={{ ...S.btnGold, width: "100%" }}>Unlock Admin</button>
      <div style={{ marginTop: 10, fontSize: 12, color: "#3a5070" }}>Default: wc2026</div>
    </div>
  );
  const updateGroupResult = (g, field, val) => setLocalResults(r => ({ ...r, groups: { ...r.groups, [g]: { ...(r.groups?.[g]||{}), [field]: val } } }));
  const updateBracketResult = (round, idx, val) => setLocalResults(r => {
    const br = { ...r.bracket };
    if (round === "champion") { br.champion = val; } else { const arr = [...(br[round]||Array(20).fill(""))]; arr[idx] = val; br[round] = arr; }
    return { ...r, bracket: br };
  });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontWeight: 800, fontSize: 18, flex: 1 }}>⚙️ Admin Panel</div>
        <button onClick={() => setAdminUnlocked(false)} style={{ ...S.btnGhost, fontSize: 12 }}>Lock</button>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[["results","Enter Results"],["players","Manage Players"]].map(([t,label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 16px", borderRadius: 6, border: "none", fontSize: 13, fontWeight: 600, background: tab === t ? "#1a3a6b" : "transparent", color: tab === t ? S.gold : S.dim }}>{label}</button>
        ))}
      </div>
      {tab === "results" && (
        <div>
          <div style={{ color: S.dim, fontSize: 13, marginBottom: 18 }}>Enter actual results — scores update instantly for everyone.</div>
          <div style={{ fontWeight: 700, color: S.mid, marginBottom: 12 }}>Group Stage</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 24 }}>
            {Object.entries(GROUPS).map(([g, teams]) => (
              <div key={g} style={S.card}>
                <div style={{ fontWeight: 700, color: S.gold, marginBottom: 8 }}>Group {g}</div>
                {["first","second","third"].map((pos,i) => (
                  <div key={pos} style={{ marginBottom: 7 }}>
                    <div style={{ fontSize: 11, color: S.dim, marginBottom: 3 }}>{i===0?"1st":i===1?"2nd":"3rd"}</div>
                    <select value={localResults.groups?.[g]?.[pos]||""} onChange={e=>updateGroupResult(g,pos,e.target.value)} style={S.select}>
                      <option value="">—</option>
                      {teams.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ fontWeight: 700, color: S.mid, marginBottom: 12 }}>Knockout Results</div>
          {[{key:"r32",label:"Round of 32",count:16},{key:"qf",label:"Quarterfinals",count:8},{key:"sf",label:"Semifinals",count:4},{key:"final",label:"Final",count:2}].map(({key,label,count}) => (
            <div key={key} style={{ marginBottom: 18 }}>
              <div style={{ color: S.mid, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(185px, 1fr))", gap: 7 }}>
                {Array.from({length:count}).map((_,i) => (
                  <select key={i} value={(localResults.bracket?.[key]||[])[i]||""} onChange={e=>updateBracketResult(key,i,e.target.value)} style={S.select}>
                    <option value="">—</option>
                    {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
                  </select>
                ))}
              </div>
            </div>
          ))}
          <div style={{ ...S.card, border: "1px solid rgba(200,168,75,0.3)", background: "rgba(200,168,75,0.07)", marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: S.gold, marginBottom: 8 }}>🏆 Champion</div>
            <select value={localResults.bracket?.champion||""} onChange={e=>updateBracketResult("champion",null,e.target.value)} style={{ ...S.select, padding: "9px 12px", border: `1px solid ${S.gold}`, fontSize: 14 }}>
              <option value="">—</option>
              {ALL_TEAMS.map(t=><option key={t} value={t}>{flag(t)} {t}</option>)}
            </select>
          </div>
          <button onClick={() => saveResults(localResults)} style={S.btnGold}>Save Results & Update Scores</button>
        </div>
      )}
      {tab === "players" && (
        <div>
          {Object.keys(players).length === 0 ? <div style={{ color: S.dim }}>No players yet.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.values(players).map(p => (
                <div key={p.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: S.dim }}>{p.submitted ? "Submitted 🔒" : "Pending ✏️"}</div>
                  </div>
                  <button onClick={() => resetPlayerPicks(p.id)} style={{ ...S.btnGhost, fontSize: 12 }}>Reset</button>
                  <button onClick={() => removePlayer(p.id)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #7a2a2a", background: "rgba(120,40,40,0.2)", color: "#dd6666", fontSize: 12 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RulesView() {
  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ fontWeight: 800, fontSize: 18, color: S.gold, marginBottom: 18 }}>📋 Rules & Scoring</div>
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🏟️ Group Stage</div>
        {[["Group winner (1st)","5 pts"],["Runner-up (2nd)","3 pts"],["3rd place","2 pts"]].map(([l,p]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color:S.mid, fontSize:14 }}>{l}</span><span style={{ color:S.gold, fontWeight:700 }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>🗂️ Knockout Rounds</div>
        {[["Round of 32","5 pts"],["Quarterfinals","8 pts"],["Semifinals","12 pts"],["Final","15 pts"],["Champion","20 pts"]].map(([l,p]) => (
          <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color:S.mid, fontSize:14 }}>{l}</span><span style={{ color:S.gold, fontWeight:700 }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>📌 How to Play</div>
        {["Enter your name and click Join & Make Picks.","Pick top 3 finishers for all 8 groups.","Pick who advances through each knockout round and name your champion.","Hit Lock In Picks when done.","Admin enters results as the tournament plays — scores update instantly.","Highest score wins! 🏆"].map((step,i) => (
          <div key={i} style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ color:S.gold, fontWeight:700, minWidth:20 }}>{i+1}.</span>
            <span style={{ color:S.mid, fontSize:14, lineHeight:1.6 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
