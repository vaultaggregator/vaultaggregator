interface ConfidenceGaugeProps {
  confidence: number;
  sentiment: "bullish" | "bearish" | "neutral";
  size?: number;
}

export function ConfidenceGauge({ confidence, sentiment, size = 200 }: ConfidenceGaugeProps) {
  // Normalize confidence to 0-100 range
  const normalizedConfidence = Math.max(0, Math.min(100, confidence));
  
  // Calculate the angle for the needle (180 degrees total semicircle, from -90 to +90)
  // 0% confidence = -90° (left), 50% = 0° (top), 100% = +90° (right)
  const angle = (normalizedConfidence / 100) * 180 - 90;
  
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
  
  // SVG dimensions and positioning for proper semicircle
  const svgSize = size;
  const svgHeight = size * 0.65; // Taller to accommodate full semicircle
  const radius = size * 0.32;
  const centerX = svgSize / 2;
  const centerY = svgHeight * 0.85; // Position circle lower to show full arc
  const needleLength = radius * 0.75;

  // Calculate needle end position
  const needleEndX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleEndY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

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
        
        {/* Background arc - full semicircle */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          strokeLinecap="round"
        />
        
        {/* Colored gradient arc - full semicircle */}
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth="10"
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
        
        {/* Scale markers every 20% */}
        {[0, 20, 40, 60, 80, 100].map((value, index) => {
          const markerAngle = (value / 100) * 180 - 90;
          const markerStartX = centerX + (radius - 6) * Math.cos((markerAngle * Math.PI) / 180);
          const markerStartY = centerY + (radius - 6) * Math.sin((markerAngle * Math.PI) / 180);
          const markerEndX = centerX + (radius + 3) * Math.cos((markerAngle * Math.PI) / 180);
          const markerEndY = centerY + (radius + 3) * Math.sin((markerAngle * Math.PI) / 180);
          
          return (
            <line
              key={index}
              x1={markerStartX}
              y1={markerStartY}
              x2={markerEndX}
              y2={markerEndY}
              stroke="#374151"
              strokeWidth="2"
            />
          );
        })}
        
        {/* Scale labels positioned correctly for 0-100 range */}
        {[
          { value: 0, label: "0" },
          { value: 50, label: "50" },
          { value: 100, label: "100" }
        ].map(({ value, label }) => {
          const labelAngle = (value / 100) * 180 - 90;
          const labelX = centerX + (radius + 20) * Math.cos((labelAngle * Math.PI) / 180);
          const labelY = centerY + (radius + 20) * Math.sin((labelAngle * Math.PI) / 180);
          
          return (
            <text
              key={value}
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
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