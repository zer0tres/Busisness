import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AppointmentsChartProps {
  data: {
    status: string;
    count: number;
  }[];
}

const COLORS = {
  pending: '#EAB308',
  confirmed: '#3B82F6',
  in_progress: '#A855F7',
  completed: '#22C55E',
  cancelled: '#EF4444',
  no_show: '#6B7280'
};

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu'
};

export default function AppointmentsChart({ data }: AppointmentsChartProps) {
  const chartData = data.map(item => ({
    name: STATUS_LABELS[item.status as keyof typeof STATUS_LABELS] || item.status,
    value: item.count,
    color: COLORS[item.status as keyof typeof COLORS] || '#6B7280'
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Nenhum agendamento encontrado</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}