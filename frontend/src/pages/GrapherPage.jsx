import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trash2, Plus, Info, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

// Math Expression Sanitizer & Evaluator
const evaluateMathExpression = (expr, x) => {
  if (!expr) return null;
  
  // 1. Clean expression: lower case, remove spaces
  let cleanExpr = expr.toLowerCase().replace(/\s+/g, '');
  
  // 2. Pre-processing rules to make user input friendlier
  // Insert explicit '*' between numbers and variables: e.g. 2x -> 2*x
  cleanExpr = cleanExpr.replace(/(\d)x/g, '$1*x');
  // E.g. 2sin -> 2*sin
  cleanExpr = cleanExpr.replace(/(\d)(sin|cos|tan|log|ln|sqrt|abs|exp|pi|π)/g, '$1*$2');
  // E.g. x( -> x*(
  cleanExpr = cleanExpr.replace(/x\(/g, 'x*(');
  // E.g. )x -> )*x
  cleanExpr = cleanExpr.replace(/\)x/g, ')*x');
  
  // 3. Strict whitelist check for mathematical safety (prevents arbitrary code execution)
  // We remove all allowed mathematical words and constants, then check if remaining characters only contain whitelisted symbols
  let testExpr = cleanExpr;
  const allowedWords = ['sin', 'cos', 'tan', 'sqrt', 'abs', 'ln', 'log', 'exp', 'pi', 'π', 'e'];
  allowedWords.forEach(word => {
    testExpr = testExpr.replaceAll(word, '');
  });

  const allowedPattern = /^[0-9x+\-*/().^]+$/;
  if (!allowedPattern.test(testExpr)) {
    return null;
  }

  // 4. Map symbols to Math object properties
  cleanExpr = cleanExpr
    .replace(/pi|π/g, 'Math.PI')
    .replace(/e/g, 'Math.E')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/log\(/g, 'Math.log(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/exp\(/g, 'Math.exp(')
    .replace(/\^/g, '**');

  // 5. Evaluate function safely using sandbox-like Function constructor
  try {
    const fn = new Function('x', `
      try {
        with (Math) {
          const result = ${cleanExpr};
          return typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
        }
      } catch (e) {
        return null;
      }
    `);
    return fn(x);
  } catch (err) {
    return null;
  }
};

const COLOR_PALETTES = [
  { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }, // Red
  { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)' }, // Blue
  { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }, // Green
];

const PRESETS = [
  { label: 'y = sin(x)', formula: 'sin(x)' },
  { label: 'y = cos(x)', formula: 'cos(x)' },
  { label: 'y = tan(x)', formula: 'tan(x)' },
  { label: 'y = x² - 4x + 3', formula: 'x^2 - 4x + 3' },
  { label: 'y = x³ - 3x', formula: 'x^3 - 3x' },
  { label: 'y = √x', formula: 'sqrt(x)' },
  { label: 'y = ln(x)', formula: 'ln(x)' },
  { label: 'y = |x|', formula: 'abs(x)' },
];

export default function GrapherPage() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // Math Graph States
  const [formulas, setFormulas] = useState([
    { id: 1, text: 'sin(x)', color: '#ef4444', active: true },
    { id: 2, text: 'x^2 - 4x', color: '#3b82f6', active: true },
  ]);
  const [activeInputId, setActiveInputId] = useState(1);
  
  // Coordinate Bounds
  const [bounds, setBounds] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -6,
    yMax: 6,
  });

  // Track hover coordinate
  const [hoverData, setHoverData] = useState(null);

  // Auto-resize and Draw loop
  useEffect(() => {
    drawGraph();
    window.addEventListener('resize', drawGraph);
    return () => window.removeEventListener('resize', drawGraph);
  }, [formulas, bounds, hoverData]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set actual rendering size for crispness on Retina screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Helper functions for coordinate translation
    const toCanvasX = (x) => ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * width;
    const toCanvasY = (y) => height - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * height;
    const toMathX = (cx) => bounds.xMin + (cx / width) * (bounds.xMax - bounds.xMin);
    const toMathY = (cy) => bounds.yMin + ((height - cy) / height) * (bounds.yMax - bounds.yMin);

    // Clear Canvas with a premium dark grid background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Grid Lines
    ctx.strokeStyle = '#334155'; // slate-700
    ctx.lineWidth = 0.5;
    ctx.font = '10px monospace';
    ctx.fillStyle = '#94a3b8'; // slate-400

    // X-Grid
    const xStep = Math.pow(10, Math.floor(Math.log10(bounds.xMax - bounds.xMin) - 0.7));
    const firstX = Math.ceil(bounds.xMin / xStep) * xStep;
    for (let x = firstX; x <= bounds.xMax; x += xStep) {
      if (Math.abs(x) < 0.0001) continue; // Skip axis
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Label X
      const zeroY = toCanvasY(0);
      const labelY = Math.min(Math.max(zeroY + 15, 15), height - 5);
      ctx.fillText(Number(x.toFixed(2)), cx - 8, labelY);
    }

    // Y-Grid
    const yStep = Math.pow(10, Math.floor(Math.log10(bounds.yMax - bounds.yMin) - 0.7));
    const firstY = Math.ceil(bounds.yMin / yStep) * yStep;
    for (let y = firstY; y <= bounds.yMax; y += yStep) {
      if (Math.abs(y) < 0.0001) continue; // Skip axis
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // Label Y
      const zeroX = toCanvasX(0);
      const labelX = Math.min(Math.max(zeroX + 5, 5), width - 35);
      ctx.fillText(Number(y.toFixed(2)), labelX, cy + 4);
    }

    // 2. Draw Main Axis Lines (X and Y Axes)
    ctx.strokeStyle = '#f1f5f9'; // slate-100
    ctx.lineWidth = 1.5;
    
    // Draw X Axis
    const zeroY = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(width, zeroY);
    ctx.stroke();

    // Draw Y Axis
    const zeroX = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(zeroX, 0);
    ctx.lineTo(zeroX, height);
    ctx.stroke();

    // Label Origin "0"
    ctx.fillText('0', zeroX - 10, zeroY + 12);

    // 3. Plot active formulas
    formulas.forEach((formula) => {
      if (!formula.active || !formula.text) return;

      ctx.strokeStyle = formula.color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      // Apply a glowing neon shadow effect to the graph path
      ctx.shadowBlur = 8;
      ctx.shadowColor = formula.color;

      ctx.beginPath();
      let firstPoint = true;

      // Iterate pixel by pixel for maximum curve smoothness
      for (let cx = 0; cx < width; cx++) {
        const x = toMathX(cx);
        const y = evaluateMathExpression(formula.text, x);

        if (y !== null && !isNaN(y)) {
          const cy = toCanvasY(y);
          if (cy >= -100 && cy <= height + 100) { // Limit points out of view to avoid draw bugs
            if (firstPoint) {
              ctx.moveTo(cx, cy);
              firstPoint = false;
            } else {
              ctx.lineTo(cx, cy);
            }
          } else {
            firstPoint = true;
          }
        } else {
          firstPoint = true;
        }
      }
      ctx.stroke();
      
      // Reset shadow effects so they don't leak to other elements
      ctx.shadowBlur = 0;
    });

    // 4. Draw Cursor Crosshair and Intersection points on Hover
    if (hoverData) {
      const cx = hoverData.cx;
      const x = toMathX(cx);

      // Draw vertical alignment reference line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'; // slate-400 semi-transparent
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // Calculate intersection and render coordinate dots
      formulas.forEach((formula) => {
        if (!formula.active || !formula.text) return;
        const y = evaluateMathExpression(formula.text, x);
        if (y !== null && !isNaN(y)) {
          const cy = toCanvasY(y);

          // Draw coordinate point circle
          ctx.fillStyle = formula.color;
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });
    }
  };

  // Zoom helpers
  const handleZoom = (factor) => {
    setBounds((prev) => {
      const xRange = (prev.xMax - prev.xMin) * factor;
      const yRange = (prev.yMax - prev.yMin) * factor;
      const xCenter = (prev.xMax + prev.xMin) / 2;
      const yCenter = (prev.yMax + prev.yMin) / 2;
      return {
        xMin: xCenter - xRange / 2,
        xMax: xCenter + xRange / 2,
        yMin: yCenter - yRange / 2,
        yMax: yCenter + yRange / 2,
      };
    });
  };

  const resetZoom = () => {
    setBounds({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
  };

  // Mouse Move over Canvas
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setHoverData({ cx, cy });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Handle Preset Click
  const applyPreset = (formulaText) => {
    setFormulas((prev) =>
      prev.map((f) => (f.id === activeInputId ? { ...f, text: formulaText } : f))
    );
  };

  const addFormula = () => {
    if (formulas.length >= 3) return;
    const nextId = formulas.length > 0 ? Math.max(...formulas.map(f => f.id)) + 1 : 1;
    setFormulas((prev) => [
      ...prev,
      { id: nextId, text: '', color: COLOR_PALETTES[prev.length] ? COLOR_PALETTES[prev.length].stroke : '#c084fc', active: true },
    ]);
    setActiveInputId(nextId);
  };

  const removeFormula = (id) => {
    setFormulas((prev) => prev.filter((f) => f.id !== id));
    if (activeInputId === id && formulas.length > 1) {
      const remaining = formulas.filter((f) => f.id !== id);
      setActiveInputId(remaining[0].id);
    }
  };

  const updateFormulaText = (id, text) => {
    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, text } : f))
    );
  };

  const toggleFormulaActive = (id) => {
    setFormulas((prev) =>
      prev.map((f) => (f.id === id ? { ...f, active: !f.active } : f))
    );
  };

  // Compute values for hover tooltip
  const getHoverMathCoords = () => {
    if (!hoverData || !canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = bounds.xMin + (hoverData.cx / rect.width) * (bounds.xMax - bounds.xMin);
    return {
      x: x.toFixed(2),
      values: formulas.map((f) => {
        if (!f.active || !f.text) return null;
        const y = evaluateMathExpression(f.text, x);
        return {
          color: f.color,
          text: f.text,
          y: y !== null && !isNaN(y) ? y.toFixed(2) : 'Undefined',
        };
      }).filter(Boolean),
    };
  };

  const hoverMath = getHoverMathCoords();

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/')} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '15px', fontWeight: 500 }}
        >
          <ArrowLeft size={16} /> Quay về Trang chủ
        </button>
        <div style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>Máy Vẽ Đồ Thị Tương Tác</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Trực quan hóa đồ thị và khảo sát hàm số lượng giác, đại số</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px' }} className="grapher-layout-grid">
          
          {/* Left panel: Control Controls */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Phương Trình Hàm Số</h3>
                {formulas.length < 3 && (
                  <button 
                    onClick={addFormula}
                    style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '4px 10px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Plus size={12} /> Thêm hàm
                  </button>
                )}
              </div>

              {/* Formula inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formulas.map((formula) => (
                  <div 
                    key={formula.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: activeInputId === formula.id ? 'rgba(43,85,222,0.04)' : 'transparent',
                      border: activeInputId === formula.id ? '1px solid rgba(43,85,222,0.2)' : '1px solid transparent',
                      borderRadius: '12px',
                      padding: '4px 8px'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={formula.active}
                      onChange={() => toggleFormulaActive(formula.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: formula.color }}
                    />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: formula.color }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8' }}>f{formula.id}(x) =</span>
                      <input 
                        type="text" 
                        value={formula.text}
                        onChange={(e) => updateFormulaText(formula.id, e.target.value)}
                        onFocus={() => setActiveInputId(formula.id)}
                        placeholder="Nhập biểu thức, ví dụ: sin(x)"
                        style={{
                          width: '100%',
                          border: 'none',
                          background: 'none',
                          outline: 'none',
                          fontSize: '15px',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          padding: '2px 0 4px'
                        }}
                      />
                    </div>
                    {formulas.length > 1 && (
                      <button 
                        onClick={() => removeFormula(formula.id)}
                        style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Symbols & Presets Panel */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-muted)' }}>Mẫu Hàm Số Nhanh (Presets)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => applyPreset(preset.formula)}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '8px',
                      fontSize: '12px',
                      color: 'var(--text-main)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.target.style.borderColor = 'var(--border)'}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Math Symbols Input Helpers */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-muted)' }}>Ký hiệu Đặc biệt</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {['π', '^2', '^3', 'sqrt()', 'abs()', 'sin()', 'cos()', 'tan()'].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      const curText = formulas.find(f => f.id === activeInputId)?.text || '';
                      updateFormulaText(activeInputId, curText + sym);
                    }}
                    style={{
                      background: 'var(--bg-page)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls sliders */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: 'var(--text-muted)' }}>Điều Chỉnh Toạ Độ (Zoom & Pan)</h4>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                <button 
                  onClick={() => handleZoom(0.8)} // Zoom In
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-page)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <ZoomIn size={14} /> Phóng to
                </button>
                <button 
                  onClick={() => handleZoom(1.2)} // Zoom Out
                  style={{ flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-page)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                >
                  <ZoomOut size={14} /> Thu nhỏ
                </button>
                <button 
                  onClick={resetZoom}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-page)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', cursor: 'pointer' }}
                  title="Đặt lại toạ độ"
                >
                  <RefreshCw size={14} />
                </button>
              </div>

              {/* Axis range info */}
              <div style={{ fontSize: '12px', background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Trục X (Ngang):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>[{bounds.xMin.toFixed(1)}, {bounds.xMax.toFixed(1)}]</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Trục Y (Dọc):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>[{bounds.yMin.toFixed(1)}, {bounds.yMax.toFixed(1)}]</span>
                </div>
              </div>
            </div>

            {/* Mathematical Guide */}
            <div style={{ display: 'flex', gap: '10px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.15)', borderRadius: '12px', padding: '12px' }}>
              <Info size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '12px', color: '#b45309', lineHeight: 1.5 }}>
                <strong>Hướng dẫn cú pháp:</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                  <li>Nhập lũy thừa bằng dấu mũ <code>^</code>. Ví dụ: <code>x^2</code></li>
                  <li>Phép nhân có thể viết liền hoặc dấu nhân <code>*</code>. Ví dụ: <code>2x</code> hoặc <code>2*x</code></li>
                  <li>Dùng dấu ngoặc đơn cho các hàm số. Ví dụ: <code>sin(x)</code>, <code>sqrt(x)</code>, <code>ln(x)</code></li>
                </ul>
              </div>
            </div>

          </div>

          {/* Right Panel: Canvas Plotter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative' }}>
            <div 
              style={{ 
                flex: 1, 
                position: 'relative', 
                border: '1px solid var(--border)', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-md)',
                minHeight: '480px',
                background: '#0f172a'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />

              {/* Hover Value Box overlay (HTML inside graph) */}
              {hoverMath && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '16px', 
                    left: '16px', 
                    background: 'rgba(15, 23, 42, 0.85)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    padding: '12px', 
                    color: '#f1f5f9',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)',
                    pointerEvents: 'none'
                  }}
                >
                  <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '6px', marginBottom: '6px', fontWeight: 'bold', color: '#3b82f6' }}>
                    Tọa độ: X = {hoverMath.x}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {hoverMath.values.map((v, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: v.color }} />
                        <span style={{ color: '#94a3b8' }}>y({v.text}) =</span>
                        <span style={{ fontWeight: 'bold', color: '#fff' }}>{v.y}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick status bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', padding: '0 8px' }}>
              <span>💡 Mẹo: Rê chuột lên bảng vẽ để phân tích chính xác tọa độ giao điểm.</span>
              <span>100% Client-side Rendering (GPU accelerated)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
