interface ConfidenceGaugeProps {
  confidence: number;
  sentiment: "bullish" | "bearish" | "neutral";
  size?: number;
}

export function ConfidenceGauge({ confidence, sentiment, size = 200 }: ConfidenceGaugeProps) {
  // Normalize confidence to 0-100 range
  const normalizedConfidence = Math.max(0, Math.min(100, confidence));
  
  // Calculate the angle for the needle on upward-facing semicircle
  // For upward arc: 0% = 180° (left), 50% = 90° (top), 100% = 0° (right)
  // Since sin() values are negative below 0°, we need to map differently
  const angle = (normalizedConfidence / 100) * 180;
  
  // Color mappings based on confidence level
  const getConfidenceColor = (conf: number) => {
    if (conf >= 80) return "#22c55e"; // Green
    if (conf >= 60) return "#eab308"; // Yellow
    if (conf >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case "bullish":
        return "📈";
      case "bearish":
        return "📉";
      default:
        return "📊";
    }
  };

  const confidenceColor = getConfidenceColor(normalizedConfidence);
  
  // SVG dimensions and positioning for upward-facing semicircle
  const svgSize = size;
  const svgHeight = size * 0.65; 
  const radius = size * 0.35;
  const centerX = svgSize / 2;
  const centerY = svgHeight - 20; // Position center near bottom for upward arc
  const needleLength = radius * 0.8;

  // Calculate needle end position for upward arc
  const needleEndX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleEndY = centerY - needleLength * Math.sin((angle * Math.PI) / 180);

  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700" data-testid="confidence-gauge">
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
        <span>{getSentimentIcon()}</span>
        <span>Confidence Index</span>
      </div>
      
      <svg width={svgSize} height={svgHeight} viewBox={`0 0 ${svgSize} ${svgHeight}`} className="mb-2">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        
        {/* Background arc - upward-facing semicircle */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        
        {/* Colored gradient arc - upward-facing semicircle */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.9"
        />
        
        {/* Needle */}
        <g>
          {/* Needle shadow */}
          <line
            x1={centerX + 2}
            y1={centerY + 2}
            x2={needleEndX + 2}
            y2={needleEndY + 2}
            stroke="rgba(0,0,0,0.2)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleEndX}
            y2={needleEndY}
            stroke="#374151"
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          {/* Needle center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="6"
            fill="#374151"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r="3"
            fill="white"
          />
        </g>
        
        {/* Scale markers at key points - upward semicircle */}
        {[0, 25, 50, 75, 100].map((value, index) => {
          const markerAngle = (value / 100) * 180;
          const markerStartX = centerX + (radius - 10) * Math.cos((markerAngle * Math.PI) / 180);
          const markerStartY = centerY - (radius - 10) * Math.sin((markerAngle * Math.PI) / 180);
          const markerEndX = centerX + (radius + 6) * Math.cos((markerAngle * Math.PI) / 180);
          const markerEndY = centerY - (radius + 6) * Math.sin((markerAngle * Math.PI) / 180);
          
          return (
            <line
              key={index}
              x1={markerStartX}
              y1={markerStartY}
              x2={markerEndX}
              y2={markerEndY}
              stroke="#374151"
              strokeWidth={value % 50 === 0 ? "3" : "2"}
            />
          );
        })}
        
        {/* Scale labels for upward semicircle - positioned on upward arc */}
        {[
          { value: 0, label: "0" },
          { value: 50, label: "50" },
          { value: 100, label: "100" }
        ].map(({ value, label }) => {
          const labelAngle = (value / 100) * 180;
          const labelDistance = radius + 25;
          const labelX = centerX + labelDistance * Math.cos((labelAngle * Math.PI) / 180);
          const labelY = centerY - labelDistance * Math.sin((labelAngle * Math.PI) / 180);
          
          return (
            <text
              key={value}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="#374151"
              className="font-bold"
            >
              {label}
            </text>
          );
        })}
      </svg>
      
      {/* Confidence value */}
      <div className="text-center">
        <div 
          className="text-3xl font-bold mb-1"
          style={{ color: confidenceColor }}
          data-testid="confidence-value"
        >
          {normalizedConfidence}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Confidence
        </div>
      </div>
      
      {/* Confidence level indicator */}
      <div className="mt-3 text-center">
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{ 
            backgroundColor: `${confidenceColor}20`,
            color: confidenceColor 
          }}
          data-testid="confidence-level"
        >
          {normalizedConfidence >= 80 ? "Very High" :
           normalizedConfidence >= 60 ? "High" :
           normalizedConfidence >= 40 ? "Medium" : "Low"}
        </span>
      </div>
    </div>
  );
}