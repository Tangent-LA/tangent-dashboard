'use client';

import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StageChartProps {
  data: Record<string, number>;
  onClick?: (stage: string) => void;
}

export function StageChart({ data, onClick }: StageChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  const stageColors: Record<string, string> = {
    'SD DESIGN': 'rgba(0, 174, 239, 0.8)',
    'DD DESIGN': 'rgba(0, 150, 208, 0.8)',
    'REVISED DD': 'rgba(0, 119, 182, 0.8)',
    'TENDER DESIGN': 'rgba(255, 152, 0, 0.8)',
    'TENDER ADDENDUM': 'rgba(255, 193, 7, 0.8)',
    'BIM MLD SUBMISSION': 'rgba(156, 39, 176, 0.8)',
    'IFC': 'rgba(0, 200, 83, 0.8)',
  };

  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = labels.map(label => stageColors[label] || 'rgba(100, 100, 100, 0.8)');

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(c => c.replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(18, 18, 26, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(0, 174, 239, 0.3)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `${context.raw} projects`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          font: {
            size: 11,
          },
          stepSize: 1,
        },
        border: {
          display: false,
        },
      },
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0 && onClick) {
        const index = elements[0].index;
        onClick(labels[index]);
      }
    },
  };

  return <Bar ref={chartRef} data={chartData} options={options} />;
}
