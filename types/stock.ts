export type ChartDataPoint = {
  timestamp: number;
  price: number;
};

export type StockPrice = {
  symbol: string;
  price: number;
  currency: string;
  updateTime: Date;
  high: number;
  low: number;
  open: number;
  volume: number;
  chartData: ChartDataPoint[];
};
