import { useEffect, useState } from "react";
import { Delete, History, Moon, Sun, RotateCcw } from "lucide-react";

const API = "http://localhost:5000/api";
const keys = [
  ["AC","action"],["±","action"],["%","action"],["÷","operator"],
  ["7","number"],["8","number"],["9","number"],["×","operator"],
  ["4","number"],["5","number"],["6","number"],["−","operator"],
  ["1","number"],["2","number"],["3","number"],["+","operator"],
  ["0","zero"],[".","number"],["⌫","action"],["=","equals"]
];

function calculate(a, op, b) {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Invalid number");
  let value;
  if (op === "+") value = x + y;
  else if (op === "−") value = x - y;
  else if (op === "×") value = x * y;
  else if (op === "÷") { if (y === 0) throw new Error("Cannot divide by zero"); value = x / y; }
  else value = y;
  return Number(value.toPrecision(12)).toString();
}

export default function App() {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [expression, setExpression] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dark, setDark] = useState(true);
  const [error, setError] = useState("");

  const loadHistory = async () => {
    try { const r = await fetch(`${API}/history`); if (r.ok) setHistory(await r.json()); } catch {}
  };
  useEffect(() => { loadHistory(); }, []);

  const saveHistory = async (expr, result) => {
    try {
      const r = await fetch(`${API}/history`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({expression:expr,result}) });
      if (r.ok) loadHistory();
    } catch {}
  };

  const press = (key) => {
    setError("");
    if (key === "AC") { setDisplay("0"); setStored(null); setOperator(null); setWaiting(false); setExpression(""); return; }
    if (key === "⌫") { if (!waiting) setDisplay(v => v.length > 1 ? v.slice(0,-1) : "0"); return; }
    if (key === "±") { setDisplay(v => v === "0" ? v : v.startsWith("-") ? v.slice(1) : `-${v}`); return; }
    if (key === "%") { setDisplay(v => String(Number(v) / 100)); return; }
    if (["+", "−", "×", "÷"].includes(key)) {
      if (operator && !waiting) {
        try { const result = calculate(stored, operator, display); setDisplay(result); setStored(result); }
        catch (e) { setError(e.message); return; }
      } else setStored(display);
      setOperator(key); setWaiting(true); setExpression(`${display} ${key}`); return;
    }
    if (key === "=") {
      if (!operator || stored === null) return;
      try {
        const result = calculate(stored, operator, display);
        const expr = `${stored} ${operator} ${display}`;
        setExpression(`${expr} =`); setDisplay(result); setStored(null); setOperator(null); setWaiting(true);
        saveHistory(expr, result);
      } catch (e) { setError(e.message); }
      return;
    }
    if (key === ".") { if (waiting) { setDisplay("0."); setWaiting(false); } else if (!display.includes(".")) setDisplay(display + "."); return; }
    if (/^\d$/.test(key)) { if (waiting || display === "0") { setDisplay(key); setWaiting(false); } else if (display.length < 14) setDisplay(display + key); }
  };

  useEffect(() => {
    const onKey = e => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === ".") press(".");
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); press("="); }
      else if (e.key === "Backspace") press("⌫");
      else if (e.key === "Escape") press("AC");
      else if (e.key === "+") press("+");
      else if (e.key === "-") press("−");
      else if (e.key === "*") press("×");
      else if (e.key === "/") { e.preventDefault(); press("÷"); }
      else if (e.key === "%") press("%");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return <main className={dark ? "app dark" : "app light"}>
    <section className="shell">
      <header><div><span className="eyebrow">MERN STACK PROJECT</span><h1>Calculator<span>.</span></h1></div>
        <div className="head-actions"><button className="icon-btn" title="Calculation history" onClick={() => setShowHistory(v => !v)}><History size={19}/></button><button className="icon-btn" title="Toggle theme" onClick={() => setDark(v => !v)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button></div>
      </header>
      <div className="calculator">
        <div className="screen"><div className="expression">{expression || " "}</div><div className="display" title={display}>{display}</div>{error && <div className="error">{error}</div>}</div>
        <div className="keypad">{keys.map(([label,type]) => <button key={label} onClick={() => press(label)} className={`key ${type} ${label === "0" ? "zero" : ""} ${label === "=" ? "equals" : ""}`} aria-label={label}>{label}</button>)}</div>
        <div className="hint">Keyboard supported · AC to clear · Enter to calculate</div>
      </div>
      {showHistory && <aside className="history"><div className="history-head"><h2>Recent calculations</h2><button className="icon-btn" onClick={loadHistory} title="Refresh"><RotateCcw size={16}/></button></div>
        {history.length ? history.map(item => <div className="history-item" key={item._id}><span>{item.expression}</span><strong>{item.result}</strong></div>) : <p className="empty">No saved calculations yet. Connect MongoDB to persist history.</p>}
      </aside>}
      <footer>Built with <b>MongoDB</b> · <b>Express</b> · <b>React</b> · <b>Node.js</b></footer>
    </section>
  </main>;
}