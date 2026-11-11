/**
 * Configuração de upload de avatar de usuário com o multer,
 * usando armazenamento em memória e filtro de tipos de arquivo.
 */
import multer from "multer";

/** MIME types aceitos para a foto de perfil: JPG, PNG e WebP. */
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

/**
 * Instância do multer para upload de avatar: guarda o arquivo em memória,
 * limita a 1 arquivo de no máximo 2 MB e rejeita tipos fora dos permitidos
 * com o erro "TIPO_INVALIDO".
 * @type {import("multer").Multer}
 */
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