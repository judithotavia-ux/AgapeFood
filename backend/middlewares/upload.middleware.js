const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { caminhoUploads } = require('../utils/uploadsDir');

const UPLOAD_DIR = caminhoUploads('produtos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const sufixo = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, sufixo + path.extname(file.originalname).toLowerCase());
  }
});

function filtroImagem(req, file, cb) {
  const tiposPermitidos = /jpeg|jpg|png|webp/;
  const extValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeValido = tiposPermitidos.test(file.mimetype);
  if (extValida && mimeValido) return cb(null, true);
  cb(new Error('Envie apenas imagens JPG, PNG ou WEBP.'));
}

const upload = multer({
  storage,
  fileFilter: filtroImagem,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

module.exports = upload;
