import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './App.css';

export default function MarketForecastChart() {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  
  // フォーム入力の状態
  const [formData, setFormData] = useState({
    company: '',
    service: '',
    market: ''
  });

  // サンプルJSON
  const sampleJson = {
    "2019": 1200,
    "2020": 1150,
    "2021": 1180,
    "2022": 1220,
    "2023": 1250,
    "2024": 1280,
    "2025": 1310,
    "2026": 1340,
    "2027": 1375,
    "y-axis_units": "億円",
    "market_predict_summary": "婦人靴市場は2023年の1,250億円から、2027年には1,375億円へと成長が見込まれています。年平均成長率は約2.4%となり、安定した成長が期待されます。",
    "market_summary": "国内婦人靴市場は、EC化の進展と高付加価値商品の需要増により堅調に推移しています。特に機能性とファッション性を両立した商品カテゴリーが市場を牽引しています。",
    "source_url": ["https://example.com/market-report", "https://example2.com/fashion-data"]
  };

  // フォーム入力の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // JSONテストモードでの処理
  const handleTestSubmit = () => {
    try {
      if (!jsonInput.trim()) {
        setError('JSONデータを入力してください。');
        return;
      }

      const parsedData = JSON.parse(jsonInput);
      setMarketData(parsedData);
      setShowChart(true);
      setError(null);
    } catch (err) {
      setError('無効なJSON形式です。正しいJSON形式で入力してください。');
    }
  };

  // フォーム送信の処理
  const handleSubmit = async () => {
    if (!formData.company || !formData.service || !formData.market) {
      setError('すべての項目を入力してください。');
      return;
    }

    setLoading(true);
    setError(null);
    setShowChart(false);

    try {
      const response = await fetch('https://satyr-teaching-ghastly.ngrok-free.app/api/search_market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company: formData.company,
          service: formData.service,
          market: formData.market
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMarketData(data);
      setShowChart(true);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // リセット処理
  const handleReset = () => {
    setFormData({ company: '', service: '', market: '' });
    setMarketData(null);
    setShowChart(false);
    setError(null);
    setJsonInput('');
  };

  // サンプルJSONを挿入
  const insertSampleJson = () => {
    setJsonInput(JSON.stringify(sampleJson, null, 2));
  };

  // グラフデータの準備
  const prepareChartData = () => {
    if (!marketData) return [];

    const years = Object.keys(marketData)
      .filter(key => /^\d{4}$/.test(key))
      .sort();
    
    const actualYearIndex = years.indexOf('2023');
    
    return years.map((year, index) => ({
      year,
      actual: index <= actualYearIndex ? marketData[year] : null,
      forecast: index > actualYearIndex ? marketData[year] : null
    }));
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const units = marketData?.['y-axis_units'] || '億円';
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}年`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="tooltip-item">
              {`${entry.dataKey === 'actual' ? '実績' : '予測'}: ${entry.value?.toLocaleString()} ${units}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* モード切替 */}
        <div className="mode-toggle-container">
          <div className="mode-toggle-group" role="group">
            <button
              type="button"
              onClick={() => {setTestMode(false); handleReset();}}
              className={`mode-toggle-button mode-toggle-left ${!testMode ? 'active' : ''}`}
            >
              通常モード（API）
            </button>
            <button
              type="button"
              onClick={() => {setTestMode(true); handleReset();}}
              className={`mode-toggle-button mode-toggle-right ${testMode ? 'active' : ''}`}
            >
              テストモード（JSON入力）
            </button>
          </div>
        </div>

        {/* 入力フォーム */}
        <div className="form-card">
          <h1 className="main-title">
            市場予測分析システム
          </h1>
          
          <div>
            {!testMode ? (
              // 通常モード
              <>
                <div className="input-grid">
                  <div className="input-group">
                    <label htmlFor="company" className="input-label">
                      会社名
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="例: ダイアナ"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="service" className="input-label">
                      サービス・商品
                    </label>
                    <input
                      type="text"
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="例: 靴"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label htmlFor="market" className="input-label">
                      市場
                    </label>
                    <input
                      type="text"
                      id="market"
                      name="market"
                      value={formData.market}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="例: 婦人靴"
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="button-container">
                  <button
                    onClick={handleSubmit}
                    className="button button-primary"
                    disabled={loading}
                  >
                    分析開始
                  </button>
                  
                  {showChart && (
                    <button
                      onClick={handleReset}
                      className="button button-secondary"
                    >
                      リセット
                    </button>
                  )}
                </div>
              </>
            ) : (
              // テストモード
              <>
                <div className="json-input-container">
                  <div className="json-input-header">
                    <label className="input-label">
                      JSONデータ入力
                    </label>
                    <button
                      onClick={insertSampleJson}
                      className="sample-json-button"
                    >
                      サンプルJSON挿入
                    </button>
                  </div>
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="json-textarea"
                    placeholder='JSONデータを入力してください。例：
{
  "2019": 1200,
  "2020": 1150,
  "2021": 1180,
  "2022": 1220,
  "2023": 1250,
  "2024": 1280,
  "2025": 1310,
  "y-axis_units": "億円",
  "market_predict_summary": "市場予測の要約",
  "market_summary": "市場の概要",
  "source_url": ["https://example.com"]
}'
                  />
                </div>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="button-container">
                  <button
                    onClick={handleTestSubmit}
                    className="button button-primary"
                  >
                    グラフ表示
                  </button>
                  
                  {showChart && (
                    <button
                      onClick={handleReset}
                      className="button button-secondary"
                    >
                      リセット
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* チャート表示 */}
        {showChart && marketData && (
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">
                市場規模の推移と将来予測
              </h2>
              {!testMode && (
                <p className="chart-subtitle">
                  {formData.company} - {formData.service} - {formData.market}
                </p>
              )}
            </div>

            <div className="chart-content-area">
              {marketData?.market_predict_summary && (
                <p className="summary-box">
                  {marketData.market_predict_summary}
                </p>
              )}

              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString()}
                      label={{ 
                        value: `市場規模（${marketData?.['y-axis_units'] || '億円'}）`, 
                        angle: -90, 
                        position: 'insideLeft' 
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar 
                      dataKey="actual" 
                      fill="rgba(229, 9, 20, 0.8)" 
                      name="市場規模（実績）"
                    />
                    <Bar 
                      dataKey="forecast" 
                      fill="rgba(229, 9, 20, 0.4)" 
                      name="市場規模（予測）"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {marketData?.source_url && marketData.source_url.length > 0 && (
                <div className="source-info">
                  <p>
                    出典: 
                    {marketData.source_url.map((url, index) => (
                      <span key={index}>
                        {index > 0 && ', '}
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="source-link"
                        >
                          {new URL(url).hostname}
                        </a>
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 市場サマリー情報 */}
        {showChart && marketData?.market_summary && (
          <div className="summary-card">
            <h3 className="summary-title">市場概況</h3>
            <p className="summary-text">
              {marketData.market_summary}
            </p>
            {marketData['y-axis_units'] && (
              <p className="summary-note">
                ※ 数値の単位: {marketData['y-axis_units']}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
