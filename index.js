const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const printer = require("pdf-to-printer");
const { jsPDF } = require("jspdf");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("."));

// 🔹 Endpoint untuk daftar printer
app.get("/printers", async (req, res) => {
  try {
    const printers = await printer.getPrinters();
    res.json(printers);
  } catch (err) {
    res.status(500).send("Gagal ambil daftar printer: " + err.message);
  }
});

// 🔹 Endpoint untuk print otomatis
app.post("/print", upload.array("pages"), async (req, res) => {
  try {
    const printerName = req.query.printer || null;

    // buat PDF sementara
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    req.files.forEach((file, i) => {
      const imgData = fs.readFileSync(file.path).toString("base64");
      const base64 = `data:image/jpeg;base64,${imgData}`;
      if (i > 0) pdf.addPage();
      pdf.addImage(base64, "JPEG", 0, 0, 210, 297);
    });

    const outputPath = path.join(__dirname, "output.pdf");
    pdf.save(outputPath);

    // kirim ke printer yang dipilih
    const options = printerName ? { printer: printerName } : {};
    await printer.print(outputPath, options);

    // hapus file sementara
    req.files.forEach(f => fs.unlinkSync(f.path));
    fs.unlinkSync(outputPath);

    res.send(`✅ Berhasil dicetak${printerName ? " ke printer " + printerName : ""}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Gagal print: " + err.message);
  }
});

app.listen(3000, () => console.log("🚀 Server jalan di http://localhost:3000"));
