import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          color: "#F8FAFC",
          background:
            "radial-gradient(circle at top right, rgba(56,189,248,0.24), transparent 38%), linear-gradient(135deg, #0F172A 0%, #111827 52%, #1F2937 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 720 }}>
            <div
              style={{
                display: "inline-flex",
                width: "fit-content",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                background: "rgba(15, 23, 42, 0.65)",
                border: "1px solid rgba(148, 163, 184, 0.24)",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Finans Pusula
            </div>
            <div
              style={{
                fontSize: 64,
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: -2,
              }}
            >
              Kredi, birikim ve yatırım kararını tek ekranda gör.
            </div>
            <div
              style={{
                maxWidth: 760,
                fontSize: 28,
                lineHeight: 1.35,
                color: "#CBD5E1",
              }}
            >
              Enflasyon etkisini, referans oranları ve metodolojiyi açıkça gösteren sade hesaplayıcı.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              minWidth: 240,
            }}
          >
            {[
              ["Kredi", "Nominal ve bugünkü maliyet"],
              ["Birikim", "Katkı zamanı ve getiri modeli"],
              ["Yatırım", "Örnek hesaplama ve senin girdin"],
            ].map(([title, body]) => (
              <div
                key={title}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  padding: "18px 20px",
                  borderRadius: 24,
                  background: "rgba(15, 23, 42, 0.45)",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                }}
              >
                <div style={{ fontSize: 26, fontWeight: 800 }}>{title}</div>
                <div style={{ fontSize: 18, lineHeight: 1.35, color: "#CBD5E1" }}>{body}</div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              fontSize: 20,
              color: "#CBD5E1",
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "#38BDF8",
                display: "inline-flex",
              }}
            />
            Kaynak ve metodoloji görünür, varsayımlar açık.
          </div>
          <div style={{ fontSize: 22, color: "#E2E8F0", fontWeight: 700 }}>finanspusula.app</div>
        </div>
      </div>
    ),
    size,
  );
}
