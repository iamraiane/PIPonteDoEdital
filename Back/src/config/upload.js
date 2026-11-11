import multer from "multer";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

export const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2 MB para foto de perfil
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error("TIPO_INVALIDO"));
    }
    cb(null, true);
  },
});