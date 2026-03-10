'use client';

import { useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PriorityChartProps {
  data: Record<string, number>;
  onClick?: (priority: string) => void;
}

export function PriorityChart({ data, onClick }: PriorityChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  const priorityColors: Record<string, string> = {
    critical: 'rgba(255, 82, 82, 0.9)',
    high: 'rgba(255, 152, 0, 0.9)',
    medium: 'rgba(255, 193, 7, 0.9)',
    low: 'rgba(0, 200, 83, 0.9)',
  };

  const priorityLabels: Record<string, string> = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const labels = Object.keys(data).map(key => priorityLabels[key] || key);
  const values = Object.values(data);
  const colors = Object.keys(data).map(key => priorityColors[key] || 'rgba(100, 100, 100, 0.8)');

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.9', '1')),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 16,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 174, 239, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.raw} projects (${percentage}%)`;
          },
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0 && onClick) {
        const index = elements[0].index;
        const originalKeys = Object.keys(data);
        onClick(originalKeys[index]);
      }
    },
  };

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="relative h-full">
      <Doughnut ref={chartRef} data={chartData} options={options} />
      {/* Center text */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none" style={{ marginTop: '-20px' }}>
        <p className="text-3xl font-bold">{total}</p>
        <p className="text-xs text-gray-500">Total</p>
      </div>
    </div>
  );
}
