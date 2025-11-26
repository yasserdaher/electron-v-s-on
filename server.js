const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// تجهيز السيرفر
const app = express();

// اتصال قاعدة البيانات
async function startDB() {
  try {
mongoose.connect("mongodb://127.0.0.1:27017/elvi_files");

    console.log("Database connected");
  } catch (err) {
    console.error("DB error:", err);
  }
}
startDB();

// موديل الملفات
const FileSchema = new mongoose.Schema({
  name: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now }
});
const File = mongoose.model("File", FileSchema);

// ميدل وير
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// اذا مافي مجلد رفع… انشئو
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// تخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

// رفع ملف
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const newFile = new File({
      name: req.file.originalname,
      filePath: req.file.filename
    });
    await newFile.save();
    res.json({ message: "تم رفع الملف وتسجيله بنجاح" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "تعذّر الرفع" });
  }
});

// جلب الملفات للمستخدم
app.get("/files", async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "تعذّر جلب الملفات" });
  }
});

// تحميل ملف
app.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "الملف غير موجود" });

    const filePath = path.join(__dirname, "uploads", file.filePath);
    res.download(filePath);
  } catch (err) {
    res.status(500).json({ error: "تعذّر التحميل" });
  }
});

// تشغيل السيرفر
app.listen(3000, () => console.log("http://localhost:3000 شغّال"));
