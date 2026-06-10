import type { PaymentScheduleRow } from "@/lib/finance";
import { formatCurrency } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentScheduleTableProps = {
  data: PaymentScheduleRow[];
};

export function PaymentScheduleTable({ data }: PaymentScheduleTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ay</TableHead>
          <TableHead>Aylık ödeme</TableHead>
          <TableHead>Faiz</TableHead>
          <TableHead>Anapara</TableHead>
          <TableHead>Kalan borç</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.month}>
            <TableCell>{row.month}</TableCell>
            <TableCell>{formatCurrency(row.installment)}</TableCell>
            <TableCell>{formatCurrency(row.interest)}</TableCell>
            <TableCell>{formatCurrency(row.principal)}</TableCell>
            <TableCell>{formatCurrency(row.remainingBalance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
