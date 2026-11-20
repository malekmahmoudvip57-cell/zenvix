import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signInWithPopup, onAuthStateChanged, signOut, updateProfile
} from "firebase/auth";
import {
  addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp,
  setDoc, where, limit
} from "firebase/firestore";
import { auth, db, googleProvider, firebaseReady } from "./firebase";
import { Hash, LogOut, MessageCircle, Plus, Send, Users, Zap, Shield, Globe2 } from "lucide-react";

const ROOMS = [
  { id: "general", name: "الاستراحة العامة", desc: "اتعرف على ناس جديدة", icon: "💬" },
  { id: "gaming", name: "الألعاب", desc: "كل ما يخص الجيمينج", icon: "🎮" },
  { id: "tech", name: "التكنولوجيا", desc: "تقنية وبرمجة", icon: "⚡" },
  { id: "friends", name: "تعارف وأصدقاء", desc: "دردشة باحترام", icon: "🌟" }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [activeRoom, setActiveRoom] = useState("general");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const q = query(collection(db, "rooms", activeRoom, "messages"), orderBy("createdAt", "asc"), limit(100));
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))), e => setError(e.message));
  }, [user, activeRoom]);

  const currentRoom = ROOMS.find(r => r.id === activeRoom) || ROOMS[0];

  async function authenticate(e) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) await updateProfile(cred.user, { displayName: displayName.trim() });
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid, displayName: displayName.trim() || email.split("@")[0],
          email: cred.user.email, createdAt: serverTimestamp()
        });
      } else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) { setError(friendlyError(e.code) || e.message); }
    finally { setBusy(false); }
  }

  async function googleLogin() {
    setError(""); setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid, displayName: cred.user.displayName || "عضو ZENVIX",
        email: cred.user.email, photoURL: cred.user.photoURL || "", createdAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { setError(friendlyError(e.code) || e.message); }
    finally { setBusy(false); }
  }

  async function sendMessage(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !user || !db) return;
    setDraft("");
    try {
      await addDoc(collection(db, "rooms", activeRoom, "messages"), {
        text: body, uid: user.uid, name: user.displayName || user.email?.split("@")[0] || "عضو",
        createdAt: serverTimestamp()
      });
    } catch (e) { setError("لم نتمكن من إرسال الرسالة. تأكد من إعدادات Firestore."); setDraft(body); }
  }

  if (!firebaseReady) return <SetupScreen />;
  if (!user) return <main className="auth-page">
    <div className="auth-glow" />
    <section className="auth-card">
      <Brand />
      <div className="eyebrow"><span className="pulse" /> مكانك وسط الناس</div>
      <h1>{mode === "login" ? "أهلاً بعودتك" : "انضم لعالم ZENVIX"}</h1>
      <p className="muted">دردشة بسيطة، ناس جديدة، ومساحة تكون فيها على طبيعتك.</p>
      <form onSubmit={authenticate} className="auth-form">
        {mode === "signup" && <label>اسمك <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="اكتب اسمك" required /></label>}
        <label>البريد الإلكتروني<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" required /></label>
        <label>كلمة المرور<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="6 أحرف على الأقل" minLength="6" required /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary full" disabled={busy}>{busy ? "لحظة..." : mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</button>
      </form>
      <div className="or"><span /> أو <span /></div>
      <button className="google full" onClick={googleLogin} disabled={busy}><b>G</b> المتابعة باستخدام Google</button>
      <p className="switch">{mode === "login" ? "لسه معندكش حساب؟" : "عندك حساب بالفعل؟"} <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}}>{mode==="login"?"إنشاء حساب":"تسجيل الدخول"}</button></p>
      <small className="fine">باستخدامك ZENVIX، توافق على الالتزام بقواعد الاحترام والأمان.</small>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <div className="side-label">مساحتك</div>
      <div className="room-list">
        {ROOMS.map(room=><button key={room.id} className={`room ${activeRoom===room.id?"selected":""}`} onClick={()=>setActiveRoom(room.id)}>
          <span className="room-icon">{room.icon}</span><span><b>{room.name}</b><small>{room.desc}</small></span>
        </button>)}
      </div>
      <div className="side-bottom">
        <div className="online-card"><span className="pulse" /><div><b>أنت متصل الآن</b><small>استمتع بدردشة آمنة</small></div></div>
        <button className="logout" onClick={()=>signOut(auth)}><LogOut size={17}/> تسجيل الخروج</button>
      </div>
    </aside>
    <main className="chat-area">
      <header className="topbar">
        <div className="room-heading"><span className="big-room-icon">{currentRoom.icon}</span><div><h2>{currentRoom.name}</h2><p>{currentRoom.desc}</p></div></div>
        <div className="user-pill"><span className="avatar">{(user.displayName||user.email||"Z").slice(0,1).toUpperCase()}</span><span>{user.displayName || user.email?.split("@")[0]}</span></div>
      </header>
      <div className="welcome-banner"><div><span className="banner-tag"><Zap size={13}/> ZENVIX COMMUNITY</span><h1>الكلام الحلو بيبدأ من هنا.</h1><p>خليك لطيف، شارك أفكارك، واتعرف على ناس شبهك.</p></div><div className="banner-orb">Z</div></div>
      <section className="messages">
        {messages.length===0 ? <div className="empty"><div className="empty-icon"><MessageCircle size={27}/></div><h3>ابدأ أول محادثة 👋</h3><p>مفيش رسائل هنا لسه. اكتب أول رسالة في الغرفة!</p></div> :
          messages.map(m=><article className={`message ${m.uid===user.uid?"mine":""}`} key={m.id}>
            <div className="msg-avatar">{(m.name||"Z").slice(0,1).toUpperCase()}</div><div className="msg-content"><div className="msg-meta"><b>{m.name||"عضو"}</b>{m.uid===user.uid&&<span className="you">أنت</span>}<time>{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}) : "الآن"}</time></div><p>{m.text}</p></div>
          </article>)}
      </section>
      <form className="composer" onSubmit={sendMessage}><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder={`اكتب رسالة في ${currentRoom.name}...`} maxLength={1500}/><button className="send" disabled={!draft.trim()} aria-label="إرسال"><Send size={19}/></button></form>
      {error && <div className="toast" onClick={()=>setError("")}>{error} ×</div>}
      <footer className="chat-footer"><Shield size={13}/> خليك محترم — لا تشارك بياناتك الشخصية مع الغرباء</footer>
    </main>
  </div>;
}

function Brand(){return <div className="brand"><div className="brand-mark">Z</div><div><strong>ZENVIX</strong><small>CHAT • CONNECT • VIBE</small></div></div>}

function SetupScreen(){return <main className="setup-page"><section className="setup-card"><Brand/><div className="setup-icon"><Globe2 size={26}/></div><h1>نجهز عالم ZENVIX!</h1><p>ملفات الموقع جاهزة، لكن يلزم ربط مشروع Firebase قبل تشغيل تسجيل الدخول والدردشة.</p><ol><li>أنشئ مشروعًا مجانيًا في Firebase.</li><li>فعّل Authentication: Email/Password وGoogle.</li><li>أنشئ Cloud Firestore.</li><li>انسخ إعدادات تطبيق الويب إلى ملف <code>.env</code>.</li></ol><p className="muted">راجع ملف README داخل المشروع للتعليمات بالتفصيل.</p></section></main>}

function friendlyError(code){
  const errors={
    "auth/invalid-credential":"البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    "auth/email-already-in-use":"البريد الإلكتروني مستخدم بالفعل.",
    "auth/weak-password":"كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.",
    "auth/invalid-email":"صيغة البريد الإلكتروني غير صحيحة.",
    "auth/popup-closed-by-user":"تم إغلاق نافذة تسجيل الدخول.",
    "auth/unauthorized-domain":"أضف دومين الموقع إلى Authorized domains في Firebase."
  }; return errors[code];
}