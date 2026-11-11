import { BlobServiceClient } from "@azure/storage-blob";
import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

/**
 * Valida se o buffer enviado é uma imagem de tipo permitido.
 * @param {Buffer} buffer - Conteúdo bruto do arquivo enviado.
 * @returns {Promise<string|null>} MIME type da imagem (ex.: "image/png") ou null se não for permitida.
 */
export async function validarImagem(buffer) {
  const tipo = await fileTypeFromBuffer(buffer);
  const permitidos = ["image/jpeg", "image/png", "image/webp"];
  return tipo && permitidos.includes(tipo.mime) ? tipo.mime : null;
}

/** Mapa de MIME type de imagem -> extensão de arquivo correspondente. */
const EXTENSOES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

/** Cliente do serviço de blobs do Azure Storage. */
const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
/** Cliente do container de armazenamento configurado no ambiente. */
const container = blobService.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER
);

/**
 * Envia um avatar (imagem) para o Azure Blob Storage.
 * @param {{ buffer: Buffer, mimetype: string }} file - Arquivo já validado (buffer e tipo MIME).
 * @returns {Promise<{nomeBlob: string, url: string}>} Nome do blob criado e URL pública dele.
 */
export async function enviarAvatar(file) {
  // A extensão vem do mimetype validado, não do nome enviado pelo usuário
  const nomeBlob = `avatares/${crypto.randomUUID()}${EXTENSOES[file.mimetype]}`;
  const blockBlob = container.getBlockBlobClient(nomeBlob);

  await blockBlob.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
      blobCacheControl: "public, max-age=31536000", // cache de 1 ano (o nome muda a cada troca)
    },
  });

  return { nomeBlob, url: blockBlob.url };
}

/**
 * Remove um blob do Azure Storage pelo nome, se ele existir.
 * @param {string} [nomeBlob] - Nome (caminho) do blob a apagar.
 * @returns {Promise<void>} Não retorna valor; silenciosamente ignora se o blob não existir.
 */
export async function apagarBlob(nomeBlob) {
  if (!nomeBlob) return;
  await container.getBlockBlobClient(nomeBlob).deleteIfExists();
}