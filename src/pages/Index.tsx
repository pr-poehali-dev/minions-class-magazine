import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const handlePrint = () => {
  const style = document.createElement("style");
  style.innerHTML = `
    @media print {
      @page { size: A4; margin: 0; }
      body > * { display: none !important; }
      #print-root { display: block !important; }
      #print-root .journal-page {
        width: 210mm;
        min-height: 297mm;
        page-break-after: always;
        break-after: page;
        box-shadow: none !important;
        border-radius: 0 !important;
      }
    }
  `;
  style.id = "print-style";
  document.head.appendChild(style);
  window.print();
  setTimeout(() => {
    const el = document.getElementById("print-style");
    if (el) el.remove();
  }, 1000);
};

const MINION_IMG = "https://cdn.poehali.dev/projects/4ab47706-7f9b-4757-94bf-a86b2d3f7574/files/0715fb77-d953-437f-9bcc-626611463b1e.jpg";
const PATTERN_IMG = "https://cdn.poehali.dev/projects/4ab47706-7f9b-4757-94bf-a86b2d3f7574/files/fed835f0-7143-431a-b228-b2534f22fd7b.jpg";

const Deco = ({ type, style }: { type: string; style?: React.CSSProperties }) => {
  const decos: Record<string, string> = {
    star: "⭐", banana: "🍌", heart: "💛", sparkle: "✨",
    pencil: "✏️", book: "📚", paint: "🎨", glasses: "🥽",
    ribbon: "🎀", music: "🎵", ball: "⚽", butterfly: "🦋",
    rainbow: "🌈", sun: "☀️", flower: "🌻", leaf: "🍃",
    balloon: "🎈",
  };
  return <span style={{ fontSize: 22, position: "absolute", userSelect: "none", ...style }}>{decos[type] || "⭐"}</span>;
};

const PhotoBox = ({ label, wide, tall }: { label?: string; wide?: boolean; tall?: boolean }) => (
  <div style={{
    background: "rgba(255,255,255,0.55)",
    border: "3px dashed #F5C518",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: tall ? 220 : 130,
    width: wide ? "100%" : undefined,
    flex: wide ? undefined : 1,
    position: "relative",
    padding: 10,
  }}>
    <span style={{ fontSize: 36 }}>📷</span>
    <span style={{ fontFamily: "Caveat, cursive", fontSize: 15, color: "#8B6914", textAlign: "center" }}>
      {label || "фото"}
    </span>
  </div>
);

const TextBox = ({ label, lines, wide }: { label?: string; lines?: number; wide?: boolean }) => (
  <div style={{
    background: "rgba(255,255,255,0.55)",
    border: "3px dashed #60B8E0",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "12px 14px",
    minHeight: (lines || 3) * 28 + 30,
    width: wide ? "100%" : undefined,
    flex: wide ? undefined : 1,
  }}>
    {label && <span style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#2670A0", fontWeight: 700, marginBottom: 4 }}>{label}</span>}
    {Array.from({ length: lines || 3 }).map((_, i) => (
      <div key={i} style={{ height: 22, borderBottom: "1.5px solid #C8E6F5", width: "100%" }} />
    ))}
  </div>
);

interface PageProps {
  pageNum: number;
  children: React.ReactNode;
  bg?: string;
  accent?: string;
}

const Page = ({ pageNum, children, bg = "#FFFBEA", accent = "#F5C518" }: PageProps) => (
  <div style={{
    width: 794,
    minHeight: 1123,
    background: bg,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
    borderRadius: 6,
    display: "flex",
    flexDirection: "column",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 8,
      background: `linear-gradient(90deg, ${accent}, #60B8E0, ${accent})`,
    }} />
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: 8,
      background: `linear-gradient(90deg, #60B8E0, ${accent}, #60B8E0)`,
    }} />
    {children}
    <div style={{
      position: "absolute", bottom: 18, right: 28,
      fontFamily: "Caveat, cursive", fontSize: 16, color: "#B0A060", fontWeight: 700,
    }}>{pageNum}</div>
  </div>
);

const SectionTitle = ({ children, color = "#2670A0", emoji }: { children: React.ReactNode; color?: string; emoji?: string }) => (
  <div style={{ textAlign: "center", margin: "18px 0 10px" }}>
    <span style={{
      fontFamily: "Pacifico, cursive",
      fontSize: 28,
      color,
      textShadow: "2px 2px 0px rgba(0,0,0,0.08)",
      letterSpacing: 1,
    }}>
      {emoji && <span style={{ marginRight: 10 }}>{emoji}</span>}
      {children}
    </span>
  </div>
);

const Divider = ({ color = "#F5C518" }: { color?: string }) => (
  <div style={{ height: 4, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${color}, transparent)`, margin: "8px 40px" }} />
);

export default function Index() {
  const [currentPage, setCurrentPage] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRootRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const printRoot = document.getElementById("print-root");
      if (!printRoot) return;

      printRoot.style.display = "block";
      printRoot.style.position = "fixed";
      printRoot.style.left = "-9999px";
      printRoot.style.top = "0";

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageEls = printRoot.querySelectorAll<HTMLElement>(".journal-page");

      for (let i = 0; i < pageEls.length; i++) {
        const el = pageEls[i];
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#FFFBEA",
          width: 794,
          height: 1123,
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      printRoot.style.display = "none";
      printRoot.style.position = "";
      printRoot.style.left = "";
      printRoot.style.top = "";

      pdf.save('Миньоны_В_класса_2022-2026.pdf');
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const pages = [
    // ============ СТРАНИЦА 1 — ОБЛОЖКА ============
    <Page key={1} pageNum={1} bg="linear-gradient(135deg, #FFF8DC 0%, #E8F4FD 50%, #FFF3B0 100%)" accent="#F5C518">
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${PATTERN_IMG})`, backgroundSize: "cover", opacity: 0.12 }} />
      <Deco type="star" style={{ top: 50, left: 40 }} />
      <Deco type="banana" style={{ top: 80, right: 60 }} />
      <Deco type="sparkle" style={{ top: 160, left: 80 }} />
      <Deco type="heart" style={{ bottom: 180, left: 50 }} />
      <Deco type="star" style={{ bottom: 120, right: 70 }} />
      <Deco type="pencil" style={{ top: 300, right: 40 }} />
      <Deco type="balloon" style={{ bottom: 240, right: 100 }} />
      <Deco type="flower" style={{ top: 440, left: 30 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 50px", position: "relative", zIndex: 2 }}>
        <div style={{
          background: "rgba(245,197,24,0.2)",
          border: "4px solid #F5C518",
          borderRadius: 30,
          padding: "14px 40px",
          marginBottom: 20,
          fontFamily: "Nunito, sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#8B6914",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}>
          🍌 ШКОЛЬНЫЙ ЖУРНАЛ 🍌
        </div>

        <img src={MINION_IMG} alt="Миньон" style={{
          width: 220, height: 220,
          objectFit: "cover",
          borderRadius: "50%",
          border: "6px solid #F5C518",
          boxShadow: "0 8px 30px rgba(245,197,24,0.4), 0 0 0 3px white",
          marginBottom: 28,
        }} />

        <h1 style={{
          fontFamily: "Pacifico, cursive",
          fontSize: 48,
          color: "#2670A0",
          textAlign: "center",
          lineHeight: 1.2,
          textShadow: "3px 3px 0px rgba(245,197,24,0.5)",
          margin: "0 0 8px",
        }}>
          Миньоны<br />"В" класса
        </h1>

        <div style={{
          fontFamily: "Caveat, cursive",
          fontSize: 34,
          color: "#F5C518",
          fontWeight: 700,
          textShadow: "1px 1px 0 #8B6914",
          margin: "8px 0 30px",
        }}>
          2022 – 2026
        </div>

        <div style={{
          background: "white",
          border: "3px solid #60B8E0",
          borderRadius: 20,
          padding: "20px 40px",
          textAlign: "center",
          boxShadow: "0 4px 16px rgba(96,184,224,0.2)",
          width: "100%",
          maxWidth: 400,
        }}>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#666", marginBottom: 6 }}>Школа:</div>
          <div style={{ height: 2, background: "#60B8E0", borderRadius: 2, marginBottom: 14 }} />
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#666", marginBottom: 6 }}>Классный руководитель:</div>
          <div style={{ height: 2, background: "#60B8E0", borderRadius: 2 }} />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 2 — НАШ КЛАСС ============
    <Page key={2} pageNum={2} bg="#F0F9FF" accent="#60B8E0">
      <Deco type="star" style={{ top: 50, right: 40 }} />
      <Deco type="heart" style={{ top: 80, left: 60 }} />
      <Deco type="pencil" style={{ bottom: 200, left: 40 }} />
      <Deco type="book" style={{ bottom: 200, right: 40 }} />
      <Deco type="sparkle" style={{ top: 200, right: 70 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle color="#2670A0" emoji="🏫">Наш класс</SectionTitle>
        <Divider color="#60B8E0" />

        <PhotoBox label="групповое фото класса" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="📍 Наша школа" lines={3} />
          <TextBox label="👩‍🏫 Наш классный руководитель" lines={3} />
        </div>

        <div style={{
          background: "rgba(245,197,24,0.15)",
          border: "3px dashed #F5C518",
          borderRadius: 18,
          padding: "14px 18px",
        }}>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 16, color: "#8B6914", fontWeight: 700, marginBottom: 10 }}>
            👥 Список нашего класса:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px 20px" }}>
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: "Caveat, cursive", fontSize: 13, color: "#F5C518", fontWeight: 700 }}>{i + 1}.</span>
                <div style={{ flex: 1, height: 1.5, background: "#DDD", borderRadius: 2 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 3 — НАШИ ДНИ В ШКОЛЕ 1 ============
    <Page key={3} pageNum={3} bg="#FFFBEA" accent="#F5C518">
      <Deco type="sun" style={{ top: 50, left: 50 }} />
      <Deco type="rainbow" style={{ top: 60, right: 55 }} />
      <Deco type="sparkle" style={{ bottom: 220, right: 40 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle color="#E8860A" emoji="📅">Наши дни в начальной школе</SectionTitle>
        <Divider color="#F5C518" />

        <div style={{ fontFamily: "Pacifico, cursive", fontSize: 18, color: "#F5C518", textAlign: "center", marginBottom: 4 }}>
          1 класс — 2022/2023
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="первый день в школе" tall />
          <PhotoBox label="наш класс" tall />
        </div>

        <TextBox label="✏️ Самый запоминающийся момент первого класса:" lines={4} wide />

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            flex: 1,
            background: "rgba(96,184,224,0.12)",
            border: "3px dashed #60B8E0",
            borderRadius: 18,
            padding: "12px 14px",
          }}>
            <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#2670A0", fontWeight: 700, marginBottom: 8 }}>⭐ Что мы узнали в 1 классе:</div>
            {["", "", "", ""].map((_, i) => (
              <div key={i} style={{ height: 22, borderBottom: "1.5px solid #C8E6F5", marginBottom: 4 }} />
            ))}
          </div>
          <PhotoBox label="фото" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 4 — НАШИ ДНИ В ШКОЛЕ 2 ============
    <Page key={4} pageNum={4} bg="#F0FFF4" accent="#5CB85C">
      <Deco type="leaf" style={{ top: 55, left: 45 }} />
      <Deco type="flower" style={{ top: 60, right: 55 }} />
      <Deco type="butterfly" style={{ bottom: 230, right: 50 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#5CB85C", textAlign: "center" }}>
          2 класс — 2023/2024 🌿
        </div>
        <Divider color="#5CB85C" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото урока" tall />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <TextBox label="📚 Любимые предметы:" lines={3} />
            <TextBox label="🏆 Наши достижения:" lines={3} />
          </div>
        </div>

        <PhotoBox label="большое фото — яркий момент года" wide />

        <TextBox label="💬 Слово о нашем классе:" lines={3} wide />
      </div>
    </Page>,

    // ============ СТРАНИЦА 5 — НАШИ ДНИ В ШКОЛЕ 3 ============
    <Page key={5} pageNum={5} bg="#FFF5F8" accent="#E91E8C">
      <Deco type="heart" style={{ top: 55, left: 45 }} />
      <Deco type="ribbon" style={{ top: 60, right: 60 }} />
      <Deco type="sparkle" style={{ bottom: 230, left: 50 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#E91E8C", textAlign: "center" }}>
          3 класс — 2024/2025 🎀
        </div>
        <Divider color="#E91E8C" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото 1" />
          <PhotoBox label="фото 2" />
          <PhotoBox label="фото 3" />
        </div>

        <TextBox label="🌟 Чем запомнился этот год:" lines={5} wide />

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            flex: 1,
            background: "rgba(233,30,140,0.07)",
            border: "3px dashed #E91E8C",
            borderRadius: 18, padding: "12px 14px",
          }}>
            <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#E91E8C", fontWeight: 700, marginBottom: 8 }}>Кто стал лучшим в этом году:</div>
            {["", "", ""].map((_, i) => (
              <div key={i} style={{ height: 22, borderBottom: "1.5px solid #FAC8DD", marginBottom: 4 }} />
            ))}
          </div>
          <PhotoBox label="победитель года" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 6 — НАШИ ДНИ В ШКОЛЕ 4 ============
    <Page key={6} pageNum={6} bg="#F5F0FF" accent="#7B4FCC">
      <Deco type="star" style={{ top: 55, left: 45 }} />
      <Deco type="music" style={{ top: 60, right: 60 }} />
      <Deco type="balloon" style={{ bottom: 230, left: 50 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Pacifico, cursive", fontSize: 22, color: "#7B4FCC", textAlign: "center" }}>
          4 класс — 2025/2026 🎓
        </div>
        <Divider color="#7B4FCC" />

        <PhotoBox label="выпускное фото класса" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="💎 Самые яркие воспоминания:" lines={4} />
          <TextBox label="🚀 Наши мечты о будущем:" lines={4} />
        </div>

        <div style={{
          background: "rgba(123,79,204,0.1)",
          border: "3px solid #7B4FCC",
          borderRadius: 18, padding: "14px 18px",
          fontFamily: "Caveat, cursive", fontSize: 17, color: "#4A2A8A",
          textAlign: "center", lineHeight: 1.6,
        }}>
          ✨ До свидания, начальная школа! Впереди — новые приключения! ✨
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 7 — НАШИ МЕРОПРИЯТИЯ 1 ============
    <Page key={7} pageNum={7} bg="#FFFBEA" accent="#FF9800">
      <Deco type="star" style={{ top: 50, left: 50 }} />
      <Deco type="balloon" style={{ top: 55, right: 55 }} />
      <Deco type="sparkle" style={{ bottom: 230, right: 45 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle color="#FF6F00" emoji="🎉">Наши мероприятия</SectionTitle>
        <Divider color="#FF9800" />

        <div style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: "#FF6F00", fontWeight: 700, textAlign: "center" }}>
          🎄 Новогодний праздник
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото мероприятия" tall />
          <PhotoBox label="наши костюмы" tall />
        </div>

        <TextBox label="📝 Как это было:" lines={4} wide />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото 1" />
          <PhotoBox label="фото 2" />
          <PhotoBox label="фото 3" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 8 — НАШИ МЕРОПРИЯТИЯ 2 ============
    <Page key={8} pageNum={8} bg="#FFF3E0" accent="#FF9800">
      <Deco type="sun" style={{ top: 50, left: 50 }} />
      <Deco type="flower" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: "#E65100", fontWeight: 700, textAlign: "center" }}>
          🌸 День знаний & Последний звонок
        </div>
        <Divider color="#FF9800" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="1 сентября" tall />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <TextBox label="🍎 День знаний — что запомнилось:" lines={4} />
            <TextBox label="🔔 Последний звонок:" lines={4} />
          </div>
        </div>

        <PhotoBox label="большое фото праздника" wide tall />
      </div>
    </Page>,

    // ============ СТРАНИЦА 9 — НАШИ МЕРОПРИЯТИЯ 3 ============
    <Page key={9} pageNum={9} bg="#F0FFF4" accent="#4CAF50">
      <Deco type="leaf" style={{ top: 50, left: 50 }} />
      <Deco type="ball" style={{ top: 55, right: 55 }} />
      <Deco type="sparkle" style={{ bottom: 240, right: 45 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: "#2E7D32", fontWeight: 700, textAlign: "center" }}>
          ⚽ Спортивные соревнования
        </div>
        <Divider color="#4CAF50" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="на старте" />
          <PhotoBox label="победа!" />
        </div>

        <TextBox label="🏅 Наши результаты:" lines={4} wide />

        <div style={{ display: "flex", gap: 14 }}>
          <div style={{
            flex: 1, background: "rgba(76,175,80,0.1)",
            border: "3px dashed #4CAF50", borderRadius: 18, padding: "12px 16px",
          }}>
            <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#2E7D32", fontWeight: 700, marginBottom: 8 }}>🥇 Наши чемпионы:</div>
            {["", "", "", ""].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>🎖</span>
                <div style={{ flex: 1, height: 1.5, background: "#B2DFDB" }} />
              </div>
            ))}
          </div>
          <PhotoBox label="фото победителей" tall />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 10 — НАШИ МЕРОПРИЯТИЯ 4 ============
    <Page key={10} pageNum={10} bg="#FFF5F8" accent="#E91E8C">
      <Deco type="heart" style={{ top: 50, left: 50 }} />
      <Deco type="ribbon" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: "#C2185B", fontWeight: 700, textAlign: "center" }}>
          🎭 Театральные постановки & Концерты
        </div>
        <Divider color="#E91E8C" />

        <PhotoBox label="наш спектакль" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="🎤 Кто выступал:" lines={3} />
          <TextBox label="💫 Самый яркий номер:" lines={3} />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото 1" />
          <PhotoBox label="фото 2" />
          <PhotoBox label="фото 3" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 11 — НАШЕ ТВОРЧЕСТВО 1 ============
    <Page key={11} pageNum={11} bg="#F5F0FF" accent="#9C27B0">
      <Deco type="paint" style={{ top: 50, left: 50 }} />
      <Deco type="sparkle" style={{ top: 55, right: 55 }} />
      <Deco type="star" style={{ bottom: 240, left: 50 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle color="#7B1FA2" emoji="🎨">Наше творчество</SectionTitle>
        <Divider color="#9C27B0" />

        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#7B1FA2", fontWeight: 700, textAlign: "center" }}>
          🖼 Наши рисунки
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="рисунок" tall />
          <PhotoBox label="рисунок" tall />
          <PhotoBox label="рисунок" tall />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="рисунок" />
          <PhotoBox label="рисунок" />
        </div>

        <TextBox label="✏️ О нашем творческом пути:" lines={3} wide />
      </div>
    </Page>,

    // ============ СТРАНИЦА 12 — НАШЕ ТВОРЧЕСТВО 2 ============
    <Page key={12} pageNum={12} bg="#FFF8E1" accent="#FFC107">
      <Deco type="pencil" style={{ top: 50, left: 50 }} />
      <Deco type="sparkle" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#F57F17", fontWeight: 700, textAlign: "center" }}>
          ✏️ Наши стихи и рассказы
        </div>
        <Divider color="#FFC107" />

        <div style={{
          background: "rgba(255,193,7,0.12)",
          border: "3px dashed #FFC107",
          borderRadius: 18, padding: "16px 20px", minHeight: 160,
        }}>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#F57F17", fontWeight: 700, marginBottom: 12 }}>📜 Наш любимый стих / рассказ:</div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: 24, borderBottom: "1.5px solid #FFE082", marginBottom: 4 }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="🌟 Автор:" lines={2} />
          <PhotoBox label="иллюстрация к тексту" tall />
        </div>

        <div style={{
          background: "rgba(255,193,7,0.12)",
          border: "3px dashed #FFC107",
          borderRadius: 18, padding: "16px 20px", minHeight: 120,
        }}>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#F57F17", fontWeight: 700, marginBottom: 10 }}>📜 Ещё один текст:</div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ height: 24, borderBottom: "1.5px solid #FFE082", marginBottom: 4 }} />
          ))}
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 13 — НАШЕ ТВОРЧЕСТВО 3 ============
    <Page key={13} pageNum={13} bg="#F0FFF4" accent="#4CAF50">
      <Deco type="music" style={{ top: 50, left: 50 }} />
      <Deco type="sparkle" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#2E7D32", fontWeight: 700, textAlign: "center" }}>
          🎵 Наши музыкальные таланты
        </div>
        <Divider color="#4CAF50" />

        <PhotoBox label="наш хор / выступление" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="🎤 Кто поёт у нас:" lines={4} />
          <TextBox label="🎹 Музыкальные инструменты:" lines={4} />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="солист" />
          <PhotoBox label="ансамбль" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 14 — НАШЕ ТВОРЧЕСТВО 4 ============
    <Page key={14} pageNum={14} bg="#FFF5F8" accent="#E91E8C">
      <Deco type="paint" style={{ top: 50, left: 50 }} />
      <Deco type="ribbon" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#C2185B", fontWeight: 700, textAlign: "center" }}>
          🎭 Поделки и аппликации
        </div>
        <Divider color="#E91E8C" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="поделка" tall />
          <PhotoBox label="поделка" tall />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="аппликация" />
          <PhotoBox label="аппликация" />
          <PhotoBox label="поделка" />
        </div>

        <TextBox label="💬 Что мы создавали:" lines={3} wide />
      </div>
    </Page>,

    // ============ СТРАНИЦА 15 — НАШЕ ТВОРЧЕСТВО 5 ============
    <Page key={15} pageNum={15} bg="#F5F0FF" accent="#7B4FCC">
      <Deco type="star" style={{ top: 50, left: 50 }} />
      <Deco type="sparkle" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#4A148C", fontWeight: 700, textAlign: "center" }}>
          🏆 Наши награды и дипломы
        </div>
        <Divider color="#7B4FCC" />

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="грамота / диплом" tall />
          <PhotoBox label="грамота / диплом" tall />
          <PhotoBox label="грамота / диплом" tall />
        </div>

        <div style={{
          background: "rgba(123,79,204,0.08)",
          border: "3px dashed #7B4FCC",
          borderRadius: 18, padding: "14px 18px",
        }}>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#4A148C", fontWeight: 700, marginBottom: 10 }}>
            🥇 Наши призовые места:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏅</span>
                <div style={{ flex: 1, height: 1.5, background: "#D1C4E9" }} />
              </div>
            ))}
          </div>
        </div>

        <TextBox label="💎 Наши самые гордые достижения:" lines={3} wide />
      </div>
    </Page>,

    // ============ СТРАНИЦА 16 — НАШЕ ТВОРЧЕСТВО 6 ============
    <Page key={16} pageNum={16} bg="#FFFBEA" accent="#F5C518">
      <Deco type="pencil" style={{ top: 50, left: 50 }} />
      <Deco type="book" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#8B6914", fontWeight: 700, textAlign: "center" }}>
          📚 Наши книжные проекты
        </div>
        <Divider color="#F5C518" />

        <PhotoBox label="наш проект / презентация" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="📖 Тема проекта:" lines={3} />
          <TextBox label="🌟 Что нам понравилось:" lines={3} />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="в процессе работы" />
          <PhotoBox label="результат" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 17 — НАШЕ ТВОРЧЕСТВО 7 ============
    <Page key={17} pageNum={17} bg="#F0F9FF" accent="#60B8E0">
      <Deco type="sun" style={{ top: 50, left: 50 }} />
      <Deco type="rainbow" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#2670A0", fontWeight: 700, textAlign: "center" }}>
          🌈 Творческая страничка — рисуем сами!
        </div>
        <Divider color="#60B8E0" />

        <div style={{
          background: "rgba(255,255,255,0.7)",
          border: "3px dashed #60B8E0",
          borderRadius: 20,
          flex: 1,
          minHeight: 420,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 12,
        }}>
          <span style={{ fontSize: 60 }}>🎨</span>
          <span style={{ fontFamily: "Caveat, cursive", fontSize: 20, color: "#60B8E0", textAlign: "center" }}>
            Здесь можно нарисовать<br />что угодно!
          </span>
          <span style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "#90CAE8" }}>
            место для рисунка или коллажа
          </span>
        </div>

        <TextBox label="✍️ Подпись к творческой работе:" lines={2} wide />
      </div>
    </Page>,

    // ============ СТРАНИЦА 18 — ВНЕКЛАССНЫЕ ЗАНЯТИЯ 1 ============
    <Page key={18} pageNum={18} bg="#FFF8E1" accent="#FF9800">
      <Deco type="ball" style={{ top: 50, left: 50 }} />
      <Deco type="music" style={{ top: 55, right: 55 }} />
      <Deco type="sparkle" style={{ bottom: 240, right: 45 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle color="#E65100" emoji="🏃">Наши внеклассные занятия</SectionTitle>
        <Divider color="#FF9800" />

        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#E65100", fontWeight: 700, textAlign: "center" }}>
          ⚽ Спортивные секции
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="тренировка" tall />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <TextBox label="🏅 Какие секции посещаем:" lines={4} />
            <TextBox label="🥇 Наши результаты:" lines={3} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="фото 1" />
          <PhotoBox label="фото 2" />
          <PhotoBox label="фото 3" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 19 — ВНЕКЛАССНЫЕ ЗАНЯТИЯ 2 ============
    <Page key={19} pageNum={19} bg="#F5F0FF" accent="#9C27B0">
      <Deco type="paint" style={{ top: 50, left: 50 }} />
      <Deco type="book" style={{ top: 55, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#6A1B9A", fontWeight: 700, textAlign: "center" }}>
          🎨 Творческие кружки
        </div>
        <Divider color="#9C27B0" />

        <PhotoBox label="занятие в кружке" tall wide />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="🖌 Кружки и студии:" lines={3} />
          <TextBox label="🌟 Что мы там делаем:" lines={3} />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="наша работа" />
          <PhotoBox label="наша работа" />
        </div>
      </div>
    </Page>,

    // ============ СТРАНИЦА 20 — ФИНАЛ ============
    <Page key={20} pageNum={20} bg="linear-gradient(135deg, #FFF8DC 0%, #E8F4FD 50%, #FFF3B0 100%)" accent="#F5C518">
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${PATTERN_IMG})`, backgroundSize: "cover", opacity: 0.1 }} />
      <Deco type="star" style={{ top: 50, left: 50 }} />
      <Deco type="banana" style={{ top: 55, right: 55 }} />
      <Deco type="heart" style={{ bottom: 220, left: 50 }} />
      <Deco type="sparkle" style={{ bottom: 260, right: 55 }} />

      <div style={{ padding: "40px 50px 50px", flex: 1, display: "flex", flexDirection: "column", gap: 16, position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#8B6914", fontWeight: 700, textAlign: "center" }}>
          📚 Дополнительное образование
        </div>
        <Divider color="#F5C518" />

        <div style={{ display: "flex", gap: 14 }}>
          <TextBox label="🏫 Где ещё мы учимся:" lines={3} />
          <TextBox label="🌟 Наши успехи:" lines={3} />
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <PhotoBox label="внеклассное мероприятие" tall />
          <PhotoBox label="наш коллектив" tall />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.85)",
          border: "4px solid #F5C518",
          borderRadius: 24,
          padding: "24px 36px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(245,197,24,0.3)",
          marginTop: "auto",
        }}>
          <div style={{ fontFamily: "Pacifico, cursive", fontSize: 26, color: "#2670A0", marginBottom: 10 }}>
            🍌 До свидания, Миньоны! 🍌
          </div>
          <div style={{ fontFamily: "Caveat, cursive", fontSize: 18, color: "#8B6914", lineHeight: 1.7 }}>
            Эти четыре года были самыми яркими и весёлыми!<br />
            Мы всегда будем помнить наш дружный "В" класс!
          </div>
          <div style={{ fontSize: 28, marginTop: 10 }}>⭐🍌💛🥽🍌⭐</div>
        </div>
      </div>
    </Page>,
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      padding: "30px 20px",
      fontFamily: "Nunito, sans-serif",
    }}>
      {/* Шапка */}
      <div style={{
        maxWidth: 860, margin: "0 auto 24px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div style={{
          fontFamily: "Pacifico, cursive", fontSize: 20, color: "#F5C518",
          textShadow: "0 2px 8px rgba(245,197,24,0.4)",
        }}>
          🍌 Миньоны "В" класса
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handlePrint}
            style={{
              background: "linear-gradient(135deg, #F5C518, #FF9800)",
              color: "#1a1a2e",
              border: "none", borderRadius: 12, padding: "8px 18px",
              fontFamily: "Nunito, sans-serif", fontSize: 15, fontWeight: 800,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 2px 10px rgba(245,197,24,0.4)",
            }}
          >🖨 Распечатать</button>

          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            style={{
              background: isGeneratingPdf
                ? "rgba(255,255,255,0.15)"
                : "linear-gradient(135deg, #60B8E0, #2670A0)",
              color: isGeneratingPdf ? "#888" : "white",
              border: "none", borderRadius: 12, padding: "8px 18px",
              fontFamily: "Nunito, sans-serif", fontSize: 15, fontWeight: 800,
              cursor: isGeneratingPdf ? "default" : "pointer", transition: "all 0.2s",
              boxShadow: isGeneratingPdf ? "none" : "0 2px 10px rgba(96,184,224,0.4)",
              minWidth: 160,
            }}
          >
            {isGeneratingPdf ? "⏳ Создаю PDF..." : "📥 Скачать PDF"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            style={{
              background: currentPage === 0 ? "rgba(255,255,255,0.1)" : "#F5C518",
              color: currentPage === 0 ? "#555" : "#1a1a2e",
              border: "none", borderRadius: 12, padding: "8px 18px",
              fontFamily: "Nunito, sans-serif", fontSize: 15, fontWeight: 800,
              cursor: currentPage === 0 ? "default" : "pointer", transition: "all 0.2s",
            }}
          >← Назад</button>

          <div style={{
            fontFamily: "Caveat, cursive", fontSize: 20, color: "white",
            background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "6px 18px",
          }}>
            {currentPage + 1} / {pages.length}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
            disabled={currentPage === pages.length - 1}
            style={{
              background: currentPage === pages.length - 1 ? "rgba(255,255,255,0.1)" : "#60B8E0",
              color: currentPage === pages.length - 1 ? "#555" : "white",
              border: "none", borderRadius: 12, padding: "8px 18px",
              fontFamily: "Nunito, sans-serif", fontSize: 15, fontWeight: 800,
              cursor: currentPage === pages.length - 1 ? "default" : "pointer", transition: "all 0.2s",
            }}
          >Вперёд →</button>
        </div>
      </div>

      {/* Миниатюры */}
      <div style={{
        maxWidth: 860, margin: "0 auto 20px",
        display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center",
      }}>
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: i === currentPage ? "2px solid #F5C518" : "2px solid rgba(255,255,255,0.2)",
              background: i === currentPage ? "#F5C518" : "rgba(255,255,255,0.1)",
              color: i === currentPage ? "#1a1a2e" : "rgba(255,255,255,0.7)",
              fontFamily: "Caveat, cursive", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >{i + 1}</button>
        ))}
      </div>

      {/* Страница */}
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", justifyContent: "center" }}>
        {pages[currentPage]}
      </div>

      <div style={{
        maxWidth: 860, margin: "16px auto 0", textAlign: "center",
        fontFamily: "Caveat, cursive", fontSize: 13, color: "rgba(255,255,255,0.35)",
      }}>
        Кликните по номеру для быстрого перехода между страницами
      </div>

      {/* Скрытый блок для печати всех страниц */}
      <div id="print-root" style={{ display: "none" }}>
        {pages.map((page, i) => (
          <div key={i} className="journal-page">{page}</div>
        ))}
      </div>
    </div>
  );
}