import { useState, useRef, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import styles from './AIChat.module.css';
import logoImg from '../../assets/logo.png';

const QUICK_QUESTIONS = [
  { icon: '♿', text: '휠체어 타는 아이랑 갈 수 있는 곳' },
  { icon: '🌿', text: '소음에 예민한 아이한테 좋은 놀이터' },
  { icon: '🖐', text: '모래놀이나 촉감 놀이 할 수 있는 곳' },
];

export default function AIChat({ playgrounds }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '안녕하세요! 부산 놀이터 추천 도우미예요 🌳\n현재 위치를 파악하면 가까운 놀이터를 우선 추천해 드릴게요.\n아이에 대해 몇 가지 여쭤볼게요!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('pending');
  const [tagSummaries, setTagSummaries] = useState({});
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) { setLocationStatus('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied')
    );
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'tag_summary'), (snap) => {
      const s = {};
      snap.docs.forEach((d) => { s[d.id] = d.data(); });
      setTagSummaries(s);
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const userText = text.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          history,
          playgrounds: (playgrounds || []).slice(0, 50),
          userLocation,
          tagSummaries,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.text ?? '응답을 받지 못했어요.';
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '잠시 후 다시 시도해주세요. 🙏', isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>💬</span>
        <div>
          <p className={styles.headerTitle}>AI 놀이터 추천</p>
          <p className={styles.headerSub}>Claude AI가 맞춤 놀이터를 찾아드려요</p>
        </div>
      </div>

      {/* 위치 상태 */}
      <div className={styles.locationBar}>
        {locationStatus === 'granted' && <span className={styles.locationOn}>📍 현재 위치 기반 추천 활성화</span>}
        {locationStatus === 'denied' && <span className={styles.locationOff}>📍 위치 권한 없음 — 전체 목록에서 추천</span>}
      </div>

      {/* 빠른 질문 */}
      <div className={styles.quickRow}>
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.text}
            className={styles.quickBtn}
            onClick={() => sendMessage(q.text)}
            disabled={loading}
          >
            {q.icon} {q.text}
          </button>
        ))}
      </div>

      {/* 대화창 */}
      <div className={styles.chatBody}>
        {messages.map((m, i) => (
          <Bubble key={i} message={m} />
        ))}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="궁금한 것을 물어보세요"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          className={styles.sendBtn}
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          전송
        </button>
      </div>
    </div>
  );
}

function Bubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`${styles.bubbleRow} ${isUser ? styles.bubbleRowUser : ''}`}>
      {!isUser && <img src={logoImg} alt="로고" className={styles.avatar} />}
      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAI} ${message.isError ? styles.bubbleError : ''}`}>
        {message.text.split('\n').map((line, i) => (
          <span key={i}>{line}{i < message.text.split('\n').length - 1 && <br />}</span>
        ))}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className={styles.bubbleRow}>
      <img src={logoImg} alt="로고" className={styles.avatar} />
      <div className={`${styles.bubble} ${styles.bubbleAI}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
