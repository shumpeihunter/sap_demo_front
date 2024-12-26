import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';

// react-markdown, syntax-highlighter 関連のインポート
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import { atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('javascript', js);

const SAPChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({
    searchData: false,
    geminiResponse: false,
  });

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);
    setProgress({ searchData: false, geminiResponse: false });

    // ユーザーの入力をチャットに追加
    setMessages((prev) => [...prev, { type: 'user', content: userMessage }]);

    const formData = new FormData();
    formData.append('user_query', userMessage);

    try {
      // サーバーからストリーミングで応答を受け取る例
      const response = await fetch('https://dz992silxsfizx-5000.proxy.runpod.net/chat-ai', {
        method: 'POST',
        body: formData,
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // ストリームで受け取ったデータをテキストに変換
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // 最後の行は途中かもしれないので残しておく
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue; // 空行はスキップ

          try {
            // JSON としてパースを試みる
            const data = JSON.parse(line);

            if (data.type === 'intermediate') {
              // 検索データ取得完了フラグ
              setProgress((prev) => ({ ...prev, searchData: true }));
              const preview1 = data.data_from1?.slice(0, 50) || '';
              const preview2 = data.data_from_qa_new?.slice(0, 50) || '';
              setMessages((prev) => [
                ...prev,
                {
                  type: 'assistant',
                  content: `検索データ概要: ${preview1} ... / ${preview2} ...`,
                  isSystemMessage: true,
                },
              ]);
            } else if (data.type === 'after_request_gemini') {
              // AI応答生成開始フラグ
              setProgress((prev) => ({ ...prev, geminiResponse: true }));
              const preview = data.gemini_response?.slice(0, 50) || '';
              setMessages((prev) => [
                ...prev,
                {
                  type: 'assistant',
                  content: `1次AI応答生成概要: ${preview} ...`,
                  isSystemMessage: true,
                },
              ]);
              setIsLoading(false);
            } else {
              // その他の JSON 形式
            }
          } catch (err) {
            // JSON でない場合、ストリーミングテキストとして扱う
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              // 直前がストリーミング中のアシスタントメッセージなら結合
              if (lastMessage?.type === 'assistant' && lastMessage.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + '\n' + line },
                ];
              } else {
                // 新たなメッセージとして追加
                return [
                  ...prev,
                  { type: 'assistant', content: line, isStreaming: true },
                ];
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      // 最終的に isStreaming を false に変更
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => {
          const isUser = message.type === 'user';
          const isSystem = message.isSystemMessage;

          return (
            <React.Fragment key={index}>
              {/* チャットバブル */}
              <div
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[80%] rounded-lg p-3
                    ${isUser ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}
                    ${isSystem ? 'text-xs text-gray-400 bg-transparent' : ''}
                  `}
                >
                  {/* ReactMarkdown で描画 */}
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <SyntaxHighlighter
                            language={match[1]}
                            style={atomOneLight}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>

              {/* ローディング表示 */}
              {isLoading && index === messages.length - 1 && (
                <div className="space-y-2 text-sm text-gray-500 mt-2">
                  {/* 検索データ */}
                  <div className="flex items-center space-x-2">
                    <Loader
                      className={`w-4 h-4 ${
                        progress.searchData ? 'text-green-500' : 'animate-spin'
                      }`}
                    />
                    <span>検索データを取得中...</span>
                    {progress.searchData && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                  {/* AI応答 */}
                  <div className="flex items-center space-x-2">
                    <Loader
                      className={`w-4 h-4 ${
                        progress.geminiResponse
                          ? 'text-green-500'
                          : 'animate-spin'
                      }`}
                    />
                    <span>1次AI応答を生成中...</span>
                    {progress.geminiResponse && (
                      <span className="text-green-500">✓</span>
                    )}
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力フォーム */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="SAPについて質問してください..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default SAPChat;
