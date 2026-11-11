import { BlobServiceClient } from "@azure/storage-blob";
import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

export async function validarImagem(buffer) {
  const tipo = await fileTypeFromBuffer(buffer);
  const permitidos = ["image/jpeg", "image/png", "image/webp"];
  return tipo && permitidos.includes(tipo.mime) ? tipo.mime : null;
}

const EXTENSOES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const blobService = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);
const container = blobService.getContainerClient(
  process.env.AZURE_STORAGE_CONTAINER
);

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

export async function apagarBlob(nomeBlob) {
  if (!nomeBlob) return;
  await container.getBlockBlobClient(nomeBlob).deleteIfExists();
}