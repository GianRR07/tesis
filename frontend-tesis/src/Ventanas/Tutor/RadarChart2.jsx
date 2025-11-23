import React from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);


export default function RadarChart2({ datos = [] }) {
  const labels = datos.map((d) => d.curso);
  const valores = datos.map((d) => d.promedio ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Promedio por curso",
        data: valores,
        backgroundColor: "rgba(0, 77, 143, 0.2)",
        borderColor: "#004d8f",
        borderWidth: 2,
        pointBackgroundColor: "#004d8f",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#004d8f",
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 20,
        ticks: { stepSize: 2 },
        pointLabels: { color: "#004d8f", font: { size: 14 } },
        grid: { color: "#e5e7eb" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#004d8f", font: { size: 14 } },
      },
      tooltip: {
        callbacks: {
          label: (item) => `Promedio: ${item.formattedValue}`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
