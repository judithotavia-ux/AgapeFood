const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'empresas');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const sufixo = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, sufixo + path.extname(file.originalname).toLowerCase());
  }
});

function filtroImagem(req, file, cb) {
  const tiposPermitidos = /jpeg|jpg|png|webp|svg/;
  const extValida = tiposPermitidos.test(path.extname(file.originalname).toLowerCase());
  const mimeValido = /image\/(jpeg|jpg|png|webp|svg\+xml)/.test(file.mimetype);
  if (extValida && mimeValido) return cb(null, true);
  cb(new Error('Envie apenas imagens JPG, PNG, WEBP ou SVG.'));
}

const upload = multer({
  storage,
  fileFilter: filtroImagem,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Ate 4 slots de logo: principal (usado em todo canto por padrao) + 3 variantes opcionais que,
// quando enviadas, sobrepoem o logo principal so naquele contexto especifico.
const uploadLogos = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'logoImpressao', maxCount: 1 },
  { name: 'logoCardapio', maxCount: 1 },
  { name: 'logoRecibo', maxCount: 1 }
]);

module.exports = uploadLogos;
