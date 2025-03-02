import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DailyStats } from '@/types/profile';

interface WeeklyChartProps {
  weeklyStats: DailyStats[];
}

const WeeklyChart: React.FC<WeeklyChartProps> = ({ weeklyStats }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold mb-4">Son 7 Gün Performansı</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weeklyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(date) => {
                const d = new Date(date);
                return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="correct" 
              stroke="#4CAF50" 
              name="Doğru"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="wrong" 
              stroke="#f44336" 
              name="Yanlış"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyChart;
