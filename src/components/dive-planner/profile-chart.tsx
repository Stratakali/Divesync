import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { DiveSegment } from "@/lib/gas-planner";

interface ProfileChartProps {
  segments: DiveSegment[];
  decompression: DiveSegment[];
}

interface DataPoint {
  time: number;
  depth: number;
}

export function ProfileChart({ segments, decompression }: ProfileChartProps) {
  // Convert segments to chart data points
  const data: DataPoint[] = [];
  let currentTime = 0;
  
  // Start at surface
  data.push({ time: 0, depth: 0 });
  
  // Add descent
  segments.forEach(segment => {
    // Add descent point
    data.push({ time: currentTime, depth: segment.startDepth });
    // Add bottom time point
    currentTime += segment.duration;
    data.push({ time: currentTime, depth: segment.endDepth });
  });
  
  // Add deco stops
  if (decompression.length > 0) {
    decompression.forEach(stop => {
      data.push({ time: currentTime, depth: stop.startDepth });
      currentTime += stop.duration;
      data.push({ time: currentTime, depth: stop.endDepth });
    });
  }
  
  // Return to surface
  data.push({ time: currentTime, depth: 0 });

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            label={{ value: 'Time (min)', position: 'bottom' }}
          />
          <YAxis 
            reversed 
            label={{ value: 'Depth (m)', angle: -90, position: 'left' }}
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'depth') return [`${value}m`, 'Depth'];
              return [value, name];
            }}
            labelFormatter={(label) => `Time: ${label} min`}
          />
          <Area
            type="stepAfter"
            dataKey="depth"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
