import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CalculationEmptyState() {
  return (
    <Card className="border-dashed border-primary/25 bg-secondary/20">
      <CardHeader>
        <CardTitle>Henüz hesaplama yapılmadı</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          Değerlerini girip Hesapla butonuna bastığında sonuçların burada gösterilecek.
        </p>
      </CardContent>
    </Card>
  );
}
