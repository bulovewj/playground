import { useState, useRef, useEffect } from 'react';
import styles from './AIChat.module.css';

const SYSTEM_PROMPT = `당신은 장애 아동 보호자와 특수교사를 위한 부산 놀이터 추천 도우미입니다.
따뜻하고 친절한 말투로 답변하세요.

아래 데이터를 참고하여 조건에 맞는 놀이터를 추천해주세요.

[놀이터 목록]
{playgrounds_json}

[태그별 후기 집계]
{tag_summary_json}

답변 규칙:
- 추천은 최대 3개
- 각 추천마다 선정 이유를 구체적으로 설명
- 장애 유형이 언급되면 해당 유형에 맞는 태그 우선 고려
  · 지체장애/휠체어 → 휠체어편리, 바닥안전
  · 자폐성장애 → 조용함, 안전한울타리
  · 시각장애 → 촉감놀이기구
  · 지적장애 → 안전한울타리, 쉴공간있음
- 확인되지 않은 정보는 "직접 확인이 필요해요"라고 답변
- 놀이터 이름을 언급할 때는 정확한 이름 사용`;

const QUICK_QUESTIONS = [
  { icon: '♿', text: '휠체어 타는 아이랑 갈 수 있는 곳' },
  { icon: '🌿', text: '소음에 예민한 아이한테 좋은 놀이터' },
  { icon: '🖐', text: '모래놀이나 촉감 놀이 할 수 있는 곳' },
];

export default function AIChat({ playgrounds }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '안녕하세요! 부산 놀이터 추천 도우미예요 🌳\n아이의 장애 유형이나 원하는 환경을 알려주시면 맞춤 놀이터를 찾아드릴게요.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

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
      const pgSample = (playgrounds || []).slice(0, 30);
      const systemPrompt = SYSTEM_PROMPT
        .replace('{playgrounds_json}', JSON.stringify(pgSample))
        .replace('{tag_summary_json}', '{}');

      const history = messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.text,
      }));

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...history, { role: 'user', content: userText }],
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const reply = data.content?.[0]?.text ?? '응답을 받지 못했어요.';
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
      {!isUser && <span className={styles.avatar}>🌳</span>}
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
      <span className={styles.avatar}>🌳</span>
      <div className={`${styles.bubble} ${styles.bubbleAI}`}>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
    </div>
  );
}
