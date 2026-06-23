const express = require('express');
const cors = require('cors');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const YT_DLP = ['python', '-m', 'yt_dlp'];

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 200);
}

app.post('/api/info', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const args = [...YT_DLP, '--dump-json', '--no-download', url];
  const proc = execFile(args[0], args.slice(1), {
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024
  }, (err, stdout, stderr) => {
    if (err) {
      const msg = stderr.split('\n').filter(l => l.trim()).pop() || err.message;
      return res.status(400).json({ error: msg });
    }
    try {
      const data = JSON.parse(stdout);
      res.json({
        title: data.title || 'Untitled',
        thumbnail: data.thumbnail || '',
        duration: data.duration || null,
        resolution: data.resolution || data.height ? `${data.height}p` : null,
        ext: data.ext || 'mp4',
        formats: (data.formats || []).map(f => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.height ? `${f.height}p` : 'audio',
          filesize: f.filesize || f.filesize_approx || 0
        }))
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to parse media info.' });
    }
  });
});

app.post('/api/download', (req, res) => {
  const { url, type, format_id, filename } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const ext = type === 'audio' ? 'mp3' : 'mp4';
  const baseName = filename ? sanitizeFilename(filename) : 'download';
  const tmpFile = path.join(os.tmpdir(), `dl-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);

  let args;
  if (type === 'audio') {
    args = [...YT_DLP, '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', tmpFile, url];
  } else if (format_id) {
    args = [...YT_DLP, '-f', `${format_id}+bestaudio[ext=m4a]/best[ext=mp4]`, '--remux-video', 'mp4', '-o', tmpFile, url];
  } else {
    args = [...YT_DLP, '-f', 'best[ext=mp4]/best', '-o', tmpFile, url];
  }

  const proc = spawn(args[0], args.slice(1), {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 600000
  });

  let stderrBuf = '';
  proc.stderr.on('data', (chunk) => { stderrBuf += chunk.toString(); });

  proc.on('error', () => {
    res.status(500).json({ error: 'Failed to start download process.' });
    try { fs.unlinkSync(tmpFile); } catch (_) {}
  });

  proc.on('close', (code) => {
    if (code !== 0) {
      const msg = stderrBuf.split('\n').filter(l => l.trim()).pop() || 'Download failed';
      res.status(400).json({ error: msg });
      try { fs.unlinkSync(tmpFile); } catch (_) {}
      return;
    }
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${ext}"`);
    res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
    const stream = fs.createReadStream(tmpFile);
    stream.pipe(res);
    stream.on('end', () => {
      try { fs.unlinkSync(tmpFile); } catch (_) {}
    });
    stream.on('error', () => {
      try { fs.unlinkSync(tmpFile); } catch (_) {}
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
