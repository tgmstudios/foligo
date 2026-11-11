// Canonical public media delivery. Media objects live in a PRIVATE bucket and are
// always served through the API (/api/media/:id/file); stored URLs must never
// embed presigned or storage-provider hostnames.
const CANONICAL_API_URL = 'https://api.foligo.org';

function canonicalMediaUrl(id, apiUrl = process.env.API_URL || CANONICAL_API_URL) {
  return `${String(apiUrl).replace(/\/+$/, '')}/api/media/${id}/file`;
}

function createMediaFileHandler({ prisma, minioClient, bucketName, logger = console }) {
  return async function mediaFileHandler(req, res) {
    try {
      const media = await prisma.media.findUnique({ where: { id: req.params.id } });
      if (!media) {
        return res.status(404).json({ error: 'Media Not Found', message: 'The requested media file does not exist' });
      }

      let stat;
      let stream;
      try {
        stat = await minioClient.statObject(bucketName, media.objectName);
        if (req.method !== 'HEAD') stream = await minioClient.getObject(bucketName, media.objectName);
      } catch (storageError) {
        logger.error('Error fetching file from object storage:', storageError && storageError.code, storageError && storageError.message);
        if (storageError && (storageError.code === 'NoSuchKey' || storageError.code === 'NotFound')) {
          return res.status(404).json({ error: 'File Not Found', message: 'The stored file is missing' });
        }
        return res.status(502).json({ error: 'File Retrieval Failed', message: 'Unable to retrieve file from storage' });
      }

      res.setHeader('Content-Type', media.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${String(media.filename).replace(/["\r\n]/g, '_')}"`);
      // Object names are UUIDs and never overwritten, so the bytes behind a media id are immutable.
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      if (stat && stat.etag) res.setHeader('ETag', `"${String(stat.etag).replace(/"/g, '')}"`);
      if (stat && Number.isFinite(stat.size)) res.setHeader('Content-Length', String(stat.size));

      if (req.method === 'HEAD') return res.status(200).end();

      stream.on('error', (err) => {
        logger.error('Object storage stream error:', err && err.message);
        res.destroy(err);
      });
      stream.pipe(res);
    } catch (error) {
      logger.error('Get media file error:', error && error.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Media Retrieval Failed', message: 'Unable to retrieve media file' });
      }
    }
  };
}

module.exports = { createMediaFileHandler, canonicalMediaUrl, CANONICAL_API_URL };
