import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WeekChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export default function WeekChart({ data }: WeekChartProps) {
  // Gerar últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return format(date, 'yyyy-MM-dd');
  });

  const chartData = last7Days.map(date => {
    const found = data.find(d => d.date === date);
    return {
      date: format(new Date(date), 'dd/MM', { locale: ptBR }),
      agendamentos: found ? found.count : 0
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="agendamentos" 
          stroke="#3B82F6" 
          strokeWidth={2}
          name="Agendamentos"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}