import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePrescriptionReport = (prescription: any) => {
  return new Promise<string>((resolve, reject) => {

    const reportsDir = path.join(process.cwd(), "reports");

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    const filePath = path.join(
      reportsDir,
      `report-${prescription._id}.pdf`
    );

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("Prescription Safety Report", {
      align: "center"
    });

    doc.moveDown();

    doc.fontSize(12).text(`Patient ID: ${prescription.patient}`);
    doc.text(`Risk Level: ${prescription.riskLevel}`);
    doc.text(`Severity Score: ${prescription.severityScore}`);

    doc.moveDown();

    doc.text("Detected Drugs:");

    if (prescription.nlpResult?.matchedDrugs?.length) {
      prescription.nlpResult.matchedDrugs.forEach((drug: string) => {
        doc.text(`- ${drug}`);
      });
    } else {
      doc.text("None detected");
    }

    doc.moveDown();

    doc.text("Alerts:");

    if (prescription.alerts?.length) {
      prescription.alerts.forEach((alert: any) => {
        doc.text(`- ${alert.description || alert.severity}`);
      });
    } else {
      doc.text("No alerts detected");
    }

    doc.moveDown();

    doc.text("Doctor Review:");
    doc.text(
      prescription.doctorReviewed
        ? prescription.doctorReviewStatus
        : "Pending"
    );

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};