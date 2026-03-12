'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WeeklyChartProps {
  data: { week: string; count: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const labels = data.map(d => d.week);
  const values = data.map(d => d.count);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Submissions',
        data: values,
        fill: true,
        backgroundColor: 'rgba(0, 174, 239, 0.1)',
        borderColor: 'rgba(0, 174, 239, 1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(0, 174, 239, 1)',
        pointBorderColor: '#12121a',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        tension: 0.4,
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
          label: (context: any) => `${context.raw} submissions`,
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
            size: 12,
          },
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
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return <Line data={chartData} options={options} />;
}
