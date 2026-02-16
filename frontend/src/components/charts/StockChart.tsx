import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StockChartProps {
  data: {
    name: string;
    quantity: number;
    min_quantity: number;
  }[];
}

export default function StockChart({ data }: StockChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>Nenhum produto com estoque baixo</p>
      </div>
    );
  }

  const chartData = data.slice(0, 10).map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    atual: item.quantity,
    mínimo: item.min_quantity
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="atual" fill="#EF4444" name="Estoque Atual" />
        <Bar dataKey="mínimo" fill="#F59E0B" name="Estoque Mínimo" />
      </BarChart>
    </ResponsiveContainer>
  );
}