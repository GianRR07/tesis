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

export default function RadarChart({ cursos, puntajes }) {
  const data = {
    labels: cursos,
    datasets: [
      {
        label: "Promedio de notas",
        data: puntajes,
        backgroundColor: "rgba(0, 77, 143, 0.4)",
        borderColor: "#004d8f",
        borderWidth: 2,
        pointBackgroundColor: "#004d8f",
      },
    ],
  };

  const options = {
    scales: {
      r: {
        min: 0,
        max: 20, // Asumiendo nota sobre 20
        ticks: {
          stepSize: 2,
          color: "#666",
        },
        grid: {
          color: "#ccc",
        },
        pointLabels: {
          color: "#004d8f",
          font: {
            size: 14,
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#004d8f",
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
