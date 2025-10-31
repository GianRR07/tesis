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

/**
 * Props esperadas:
 *  datos = [
 *    { curso: "Matemática", examen: "Examen Bimestral 1", nota: 15 },
 *    { curso: "Comunicación", examen: "Evaluación Final", nota: 18 },
 *  ]
 */
export default function RadarChart({ datos = [] }) {
  // Generar etiquetas y datos
  const labels = datos.map(d => `${d.curso} — ${d.examen}`);
  const valores = datos.map(d => d.nota ?? 0);

  const data = {
    labels,
    datasets: [
      {
        label: "Promedio de notas",
        data: valores,
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
        max: 20, // Escala de notas (0-20)
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
            size: 13,
          },
          // Permite cortar texto largo
          callback: function (label) {
            if (label.length > 25) {
              return label.substring(0, 25) + "...";
            }
            return label;
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
      tooltip: {
        callbacks: {
          title: (items) => labels[items[0].dataIndex],
          label: (item) => `Nota: ${item.formattedValue}`,
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}
