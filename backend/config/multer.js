const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsDir = path.join(__dirname, "../uploads");
const imageUploadDir = path.join(uploadsDir, "images");
const paymentUploadDir = path.join(uploadsDir, "payments");

const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

ensureDirectoryExists(uploadsDir);
ensureDirectoryExists(imageUploadDir);
ensureDirectoryExists(paymentUploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "paymentScreenshot") {
      return cb(null, paymentUploadDir);
    }

    if (file.fieldname === "image") {
      return cb(null, imageUploadDir);
    }

    return cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

const allowedMimes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, webp)"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = upload;
