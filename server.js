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
  const { url, type, format_id } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  let args;
  if (type === 'audio') {
    args = [...YT_DLP, '-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', '-', url];
  } else if (format_id) {
    args = [...YT_DLP, '-f', `${format_id}+bestaudio[ext=m4a]/best[ext=mp4]`, '-o', '-', url];
  } else {
    args = [...YT_DLP, '-f', 'best[ext=mp4]/best', '-o', '-', url];
  }

  const proc = spawn(args[0], args.slice(1), {
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 300000
  });

  proc.on('error', (err) => {
    res.status(500).json({ error: 'Failed to start download process.' });
  });

  let headersSent = false;
  let stderrBuf = '';

  proc.stderr.on('data', (chunk) => {
    stderrBuf += chunk.toString();
    const match = stderrBuf.match(/Destination:\s+(.+)/);
    if (!headersSent && match) {
      headersSent = true;
      const ext = type === 'audio' ? 'mp3' : path.extname(match[1]).replace('.', '') || 'mp4';
      const titleLine = stderrBuf.match(/\[download\]\s+(.+?)\s+has already been downloaded/);
      const baseName = titleLine ? sanitizeFilename(titleLine[1].trim()) : `download.${ext}`;
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}.${ext}"`);
      res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
    }
  });

  proc.stdout.pipe(res);

  proc.on('close', (code) => {
    if (code !== 0 && !headersSent) {
      const msg = stderrBuf.split('\n').filter(l => l.trim()).pop() || 'Download failed';
      res.status(400).json({ error: msg });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
