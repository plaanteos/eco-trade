const multer = require('multer');
const crypto = require('crypto');
const { getSupabaseAdmin } = require('../config/supabaseClient');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function getBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET || 'ecotrade.media';
}

function ensureSupabaseConfigured(res) {
  const client = getSupabaseAdmin();
  if (!client) {
    res.status(503).json({
      success: false,
      message: 'Supabase no está configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)',
    });
    return null;
  }
  return client;
}

function sanitizeExtFromMime(mime) {
  const m = String(mime || '').toLowerCase();
  if (m === 'image/jpeg' || m === 'image/jpg') return 'jpg';
  if (m === 'image/png') return 'png';
  if (m === 'image/webp') return 'webp';
  if (m === 'image/gif') return 'gif';
  return null;
}

exports.uploadMiddleware = upload.single('file');

exports.uploadImage = async (req, res) => {
  try {
    const supabase = ensureSupabaseConfigured(res);
    if (!supabase) return;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Falta archivo (field: file)' });
    }

    const ext = sanitizeExtFromMime(req.file.mimetype);
    if (!ext) {
      return res.status(400).json({ success: false, message: 'Formato no soportado. Usa jpg, png, webp o gif.' });
    }

    const folder = String(req.body?.folder || 'uploads').replace(/[^a-zA-Z0-9/_-]/g, '');
    const ownerId = String(req.userId || 'anon');

    const rand = crypto.randomBytes(8).toString('hex');
    const path = `${folder}/${ownerId}/${Date.now()}-${rand}.${ext}`;

    const bucket = getBucket();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      return res.status(500).json({ success: false, message: 'No se pudo subir la imagen', details: error.message });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return res.status(201).json({
      success: true,
      message: 'Imagen subida',
      data: {
        bucket,
        path,
        url: data?.publicUrl,
      },
    });
  } catch (error) {
    console.error('Error en uploadImage:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
