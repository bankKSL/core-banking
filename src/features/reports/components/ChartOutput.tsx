import { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { RunReportData } from "../api/reports";

const COLORS = [
  "#D32F2F", "#1976D2", "#388E3C", "#F57C00", "#7B1FA2",
  "#0097A7", "#C2185B", "#5D4037", "#455A64", "#AFB42B",
  "#E64A19", "#00796B", "#303F9F", "#689F38", "#FBC02D",
];

interface ChartOutputProps {
  dataObject: {
    formData: Record<string, string>;
    report: { name: string; type: string };
    decimalChoice: string;
  };
  reportData: RunReportData | undefined;
  isLoading: boolean;
  hasError: boolean;
}

export function ChartOutput({ reportData, isLoading, hasError }: ChartOutputProps) {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  const chartData = useMemo(() => {
    if (!reportData || reportData.data.length === 0 || reportData.columnHeaders.length < 2) return [];
    return reportData.data.map((item) => ({
      name: String(item.row[0] ?? ""),
      value: Number(item.row[1] ?? 0),
    }));
  }, [reportData]);

  const label = reportData?.columnHeaders[0]?.columnName ?? "Category";
  const valueLabel = reportData?.columnHeaders[1]?.columnName ?? "Value";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500">Failed to load chart data</div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No chart data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setChartType("pie")}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            chartType === "pie"
              ? "bg-[#D32F2F] text-white border-[#D32F2F]"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Pie
        </button>
        <button
          type="button"
          onClick={() => setChartType("bar")}
          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
            chartType === "bar"
              ? "bg-[#D32F2F] text-white border-[#D32F2F]"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
        >
          Bar
        </button>
      </div>

      <div className="border rounded-lg p-4 bg-white">
        <ResponsiveContainer width="100%" height={400}>
          {chartType === "pie" ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={140}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }: { name?: string; percent?: number }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#D32F2F" name={valueLabel} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-500 text-center">
        {label} vs {valueLabel}
      </p>
    </div>
  );
}
