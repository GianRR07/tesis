import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Props esperadas:
 *  datos = [
 *    { curso: "Matemática", examen: "Examen Bimestral 1", nota: 15, veredicto: "Aprobado" },
 *    { curso: "Comunicación", examen: "Evaluación Final", nota: 18, veredicto: "Excelente" },
 *  ]
 */
export default function RadarChart({ datos = [] }) {
  console.log("📊 Datos recibidos en RadarChart:", datos); // 👈 agrega esta línea

  // Etiquetas (eje X) y valores (eje Y)
  const labels = datos.map((d) => `${d.curso} — ${d.examen}`);
  const valores = datos.map((d) => d.nota ?? 0);
  const veredictos = datos.map((d) => d.veredicto ?? null);

  const data = {
    labels,
    datasets: [
      {
        label: "Progreso del alumno",
        data: valores,
        fill: false,
        borderColor: "#004d8f",
        backgroundColor: "#004d8f",
        tension: 0.3,            // suaviza la línea
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,

    // Mejora el comportamiento del hover/tooltip
    interaction: {
      mode: "nearest",
      intersect: true,
    },

    plugins: {
      legend: {
        labels: {
          color: "#004d8f",
          font: { size: 14 },
        },
      },
      tooltip: {
        displayColors: false, // tooltip más limpio
        callbacks: {
          title: (items) => labels[items[0].dataIndex],
          // Devuelve varias líneas en el mismo tooltip
          label: (item) => {
            const v = veredictos[item.dataIndex];
            if (v) return [`Nota: ${item.formattedValue}`, `Veredicto: ${v}`];
            return `Nota: ${item.formattedValue}`;
          },
        },
      },
    },

    scales: {
      y: {
        min: 0,
        max: 20, // escala de notas en 0-20
        ticks: {
          stepSize: 2,
          color: "#666",
        },
        title: {
          display: true,
          text: "Nota",
          color: "#004d8f",
          font: { size: 14, weight: "bold" },
        },
        grid: {
          color: "#e5e7eb",
        },
      },
      x: {
        ticks: {
          color: "#004d8f",
          font: { size: 12 },
          maxRotation: 60,
          minRotation: 30,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: { display: false },
      },
    },
  };

  return <Line data={data} options={options} />;
}
