import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import type { SolveResponse, RodInput } from "./types";

/**
 * Structured PDF Export
 * Order: Title → Problem → Inputs → Steps → Results → Graphs
 */
export async function exportPDF(
  result: SolveResponse,
  rods: RodInput[],
  totalLoad: number,
  length: number,
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const margin = 14;
  let y = 0;

  // ═══════════════════════════════════════════════════
  // 1. TITLE HEADER
  // ═══════════════════════════════════════════════════
  doc.setFillColor(15, 15, 26);
  doc.rect(0, 0, W, 35, "F");

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("THREE COMPOSITE BARS", margin, 16);

  doc.setFontSize(10);
  doc.setTextColor(200, 200, 220);
  doc.setFont("helvetica", "normal");
  doc.text("PROJECT — Composite Bar Analyzer", margin, 24);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 31);
  doc.text("Done by SENAPATHI YASWANTH (RA17)", W - margin, 31, { align: "right" });

  y = 42;

  // ═══════════════════════════════════════════════════
  // 2. PROBLEM STATEMENT
  // ═══════════════════════════════════════════════════
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, W - 2 * margin, 22, 3, 3, "F");

  doc.setTextColor(30, 30, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Problem Statement", margin + 4, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70, 80, 100);
  doc.text(
    `A composite bar system of ${rods.length} rod(s) is subjected to a total axial load of ` +
    `${totalLoad.toLocaleString()} N. Each rod has length ${length} m. ` +
    `Determine the load shared by each rod, individual stresses, strains, and the common deformation.`,
    margin + 4, y + 14, { maxWidth: W - 2 * margin - 8 }
  );

  y += 28;

  // ═══════════════════════════════════════════════════
  // 3. INPUT VALUES
  // ═══════════════════════════════════════════════════
  doc.setTextColor(30, 30, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Input Values", margin, y + 6);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [["Rod", "Material", "Area [m²]", "Modulus E [GPa]"]],
    body: rods.map((r) => [
      r.name,
      r.material,
      r.area.toExponential(3),
      (r.modulus / 1e9).toFixed(1),
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 60] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    styles: { cellPadding: 2.5 },
    margin: { left: margin, right: margin },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable?.finalY ?? y + 30;

  // Add global params below table
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 80, 100);
  doc.text(`Total Load (P): ${totalLoad.toLocaleString()} N`, margin, y);
  doc.text(`Length (L): ${length} m`, margin + 70, y);
  y += 8;

  // ═══════════════════════════════════════════════════
  // 4. STEP-BY-STEP SOLUTION
  // ═══════════════════════════════════════════════════
  if (result.steps && result.steps.length > 0) {
    // Check if we need a new page
    if (y > 230) { doc.addPage(); y = 20; }

    doc.setTextColor(30, 30, 60);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Step-by-Step Solution", margin, y);
    y += 8;

    for (let i = 0; i < result.steps.length; i++) {
      const raw = result.steps[i];
      const nl = raw.indexOf("\n");
      const title = nl === -1 ? raw.trim() : raw.slice(0, nl).trim();
      const body = nl === -1 ? "" : raw.slice(nl + 1).trim();

      // New page check
      if (y > 260) { doc.addPage(); y = 20; }

      // Step number + title
      doc.setFillColor(99, 102, 241);
      doc.circle(margin + 3, y + 1, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}`, margin + 3, y + 2, { align: "center" });

      doc.setTextColor(30, 30, 60);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title.replace(/^###\s*/, ""), margin + 10, y + 2);
      y += 7;

      // Step body (cleaned of LaTeX markers for PDF)
      if (body) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(70, 80, 100);

        const cleanBody = body
          .replace(/\$\$([^$]+)\$\$/g, "$1")
          .replace(/\$([^$]+)\$/g, "$1")
          .replace(/\*\*([^*]+)\*\*/g, "$1");

        const lines = doc.splitTextToSize(cleanBody, W - 2 * margin - 12);
        for (const line of lines) {
          if (y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin + 10, y);
          y += 4;
        }
        y += 3;
      }
    }
  }

  // ═══════════════════════════════════════════════════
  // 5. FINAL RESULTS
  // ═══════════════════════════════════════════════════
  if (y > 200) { doc.addPage(); y = 20; }

  doc.setTextColor(30, 30, 60);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Final Results", margin, y);
  y += 4;

  // Summary values
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(70, 80, 100);
  y += 4;
  doc.text(`Common Deformation (δ): ${result.common_deformation.toExponential(4)} m`, margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Rod", "Material", "Load [N]", "Stress [MPa]", "Strain [×10⁻⁶]", "δ [m]"]],
    body: result.rods.map((r) => [
      r.name,
      r.material,
      r.load.toFixed(2),
      (r.stress / 1e6).toFixed(4),
      (r.strain * 1e6).toFixed(4),
      r.deformation.toExponential(3),
    ]),
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 60] },
    alternateRowStyles: { fillColor: [240, 255, 248] },
    styles: { cellPadding: 2.5 },
    margin: { left: margin, right: margin },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable?.finalY ?? y + 30;

  // ═══════════════════════════════════════════════════
  // 6. GRAPHS (captured as images)
  // ═══════════════════════════════════════════════════
  const chartsEl = document.getElementById("charts-full-container");
  if (chartsEl) {
    try {
      const canvas = await html2canvas(chartsEl, {
        backgroundColor: "#0a0a1a",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const imgW = W - 2 * margin;
      const imgH = (canvas.height / canvas.width) * imgW;

      doc.addPage();
      y = 20;
      doc.setTextColor(30, 30, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Graphs & Visualizations", margin, y);
      y += 8;

      if (y + imgH > 280) {
        // Scale down if too tall
        const scale = (280 - y) / imgH;
        doc.addImage(imgData, "PNG", margin, y, imgW * scale, imgH * scale);
      } else {
        doc.addImage(imgData, "PNG", margin, y, imgW, imgH);
      }
    } catch {
      // Charts not available on current page
      doc.addPage();
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text("Graphs are available in the Graph View tab of the web interface.", margin, 30);
    }
  } else {
    // No charts element on current page
    if (y > 240) { doc.addPage(); y = 20; }
    y += 8;
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(
      "* Graphs are available in the Graph View tab of the web interface.",
      margin, y
    );
  }

  doc.save(`Three_Composite_Bars_Solution_${Date.now()}.pdf`);
}

/** Capture a DOM element as a PNG download. */
export async function exportChartPNG(elementId: string): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, {
    backgroundColor: "#0a0a1a",
    scale: 2,
  });
  const link = document.createElement("a");
  link.download = `three_composite_bars_chart_${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
