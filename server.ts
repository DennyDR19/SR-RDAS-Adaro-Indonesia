import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PETAK_UKUR, INITIAL_NOTIFICATIONS } from './src/data/defaultData';
import { PetakUkur, AppNotification } from './src/types';
import { calculateSurvivalRate } from './src/utils/survivalHelper';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory data store for live multi-user synchronization
let petakUkurStore: PetakUkur[] = JSON.parse(JSON.stringify(INITIAL_PETAK_UKUR));
let notificationStore: AppNotification[] = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

// Set of connected SSE clients
type SSEClient = {
  id: string;
  res: Response;
};
let sseClients: SSEClient[] = [];

// Helper to broadcast event to all connected team members
function broadcastEvent(eventType: string, data: any) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Peta Kinerja Rehabilitasi DAS',
    activeTeamClients: sseClients.length,
    totalPU: petakUkurStore.length,
    timestamp: new Date().toISOString(),
  });
});

// SSE endpoint for Real-Time synchronization
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, activeClients: sseClients.length })}\n\n`);

  // Broadcast team member presence
  broadcastEvent('presence', { activeClients: sseClients.length, message: 'Seorang anggota tim baru bergabung memantau peta.' });

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
    broadcastEvent('presence', { activeClients: sseClients.length });
  });
});

// GET all Petak Ukur
app.get('/api/pu', (req: Request, res: Response) => {
  res.json({
    data: petakUkurStore,
    total: petakUkurStore.length,
    updatedAt: new Date().toISOString(),
  });
});

// GET notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  res.json({
    data: notificationStore,
  });
});

// POST mark notification read
app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  const notifId = req.params.id;
  notificationStore = notificationStore.map((n) => (n.id === notifId ? { ...n, isRead: true } : n));
  broadcastEvent('notification_read', { id: notifId });
  res.json({ success: true });
});

// POST Mark all read
app.post('/api/notifications/read-all', (req: Request, res: Response) => {
  notificationStore = notificationStore.map((n) => ({ ...n, isRead: true }));
  broadcastEvent('notifications_all_read', {});
  res.json({ success: true });
});

// POST add new Petak Ukur
app.post('/api/pu', (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Automatic Validation
    if (!body.kodePU || !body.kodePU.trim()) {
      return res.status(400).json({ error: 'Kode Petak Ukur (PU) wajib diisi.' });
    }
    if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
      return res.status(400).json({ error: 'Koordinat Lintang (Latitude) dan Bujur (Longitude) harus berupa angka valid.' });
    }
    const tanamanAwal = Number(body.tanamanAwal);
    const tanamanHidup = Number(body.tanamanHidup);

    if (isNaN(tanamanAwal) || tanamanAwal <= 0) {
      return res.status(400).json({ error: 'Jumlah tanaman awal harus angka lebih besar dari 0.' });
    }
    if (isNaN(tanamanHidup) || tanamanHidup < 0) {
      return res.status(400).json({ error: 'Jumlah tanaman hidup tidak boleh bernilai negatif.' });
    }
    if (tanamanHidup > tanamanAwal) {
      return res.status(400).json({ error: 'Jumlah tanaman hidup tidak boleh melebihi jumlah tanaman awal.' });
    }

    // Auto-calculate survival rate and category
    const { rate, category } = calculateSurvivalRate(tanamanHidup, tanamanAwal);
    const tanamanMerana = Number(body.tanamanMerana) || 0;
    const kebutuhanPenyulaman = Math.max(0, tanamanAwal - tanamanHidup);

    const newPU: PetakUkur = {
      id: `pu-${Date.now()}`,
      kodePU: body.kodePU.trim().toUpperCase(),
      subDas: body.subDas || 'Sub-DAS Citarum Hulu',
      blok: body.blok || 'Blok Baru',
      desa: body.desa || '-',
      kecamatan: body.kecamatan || '-',
      latitude: body.latitude,
      longitude: body.longitude,
      luasHa: Number(body.luasHa) || 0.1,
      jenisTanaman: Array.isArray(body.jenisTanaman) && body.jenisTanaman.length > 0 ? body.jenisTanaman : ['Sengon', 'Alpukat'],
      tanamanAwal,
      tanamanHidup,
      tanamanMerana,
      survivalRate: rate,
      kategori: category,
      tinggiRataRataCm: Number(body.tinggiRataRataCm) || 120,
      tutupanTajukPersen: Number(body.tutupanTajukPersen) || 25,
      tahunTanam: Number(body.tahunTanam) || 2024,
      periodeEvaluasi: body.periodeEvaluasi || 'P1 (Tahun 1)',
      kesehatanTanaman: body.kesehatanTanaman || (rate >= 75 ? 'Baik & Sehat' : 'Terserang Hama/Gulma'),
      kebutuhanPenyulaman,
      rekomendasi: body.rekomendasi || (rate < 75 ? `Penyulaman ${kebutuhanPenyulaman} bibit dan penyiangan segera.` : 'Pertahankan pemeliharaan berkala.'),
      tanggalEvaluasi: body.tanggalEvaluasi || new Date().toISOString().split('T')[0],
      evaluator: body.evaluator || 'Tim Surveyor Rehabilitasi DAS',
      catatan: body.catatan || '',
      fotoUrl: body.fotoUrl,
      updatedAt: new Date().toISOString(),
    };

    // Prepend or add
    petakUkurStore.unshift(newPU);

    // Create automatic alert/notification for user and team
    let notifType: 'alert' | 'success' | 'warning' | 'info' = 'info';
    let notifTitle = `Penilaian Baru: ${newPU.kodePU} (${rate}%)`;
    let notifMsg = `Titik ${newPU.kodePU} di ${newPU.blok} (${newPU.subDas}) berhasil dicatat.`;

    if (category === 'hitam') {
      notifType = 'alert';
      notifTitle = `PERINGATAN KRITIS: ${newPU.kodePU} (Survival Rate ${rate}%)`;
      notifMsg = `Nilai berada pada zona HITAM (0-40%). Diperlukan instruksi penyulaman total ${kebutuhanPenyulaman} bibit.`;
    } else if (category === 'merah') {
      notifType = 'warning';
      notifTitle = `PERHATIAN: ${newPU.kodePU} di Bawah Target (${rate}%)`;
      notifMsg = `Nilai berada pada zona MERAH (>40-<75%). Perlu penyulaman ${kebutuhanPenyulaman} pohon.`;
    } else if (category === 'hijau') {
      notifType = 'success';
      notifTitle = `SUKSES: ${newPU.kodePU} Capai Kategori Hijau (${rate}%)`;
      notifMsg = `Tingkat kelangsungan hidup ${rate}% melampaui target nasional rehabilitasi DAS.`;
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      petakUkurId: newPU.id,
      isRead: false,
    };

    notificationStore.unshift(newNotif);

    // Real-time broadcast
    broadcastEvent('pu_created', { pu: newPU, notification: newNotif });

    return res.status(201).json({
      success: true,
      data: newPU,
      notification: newNotif,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal menyimpan data Petak Ukur.' });
  }
});

// POST bulk import Petak Ukur (Excel / CSV Batch)
app.post('/api/pu/bulk', (req: Request, res: Response) => {
  try {
    const { items, mode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Data items harus berupa array dan tidak kosong.' });
    }

    if (mode === 'replace') {
      petakUkurStore = [...items];
    } else {
      // Merge by kodePU: update if already exists, else insert
      const existingCodes = new Set(petakUkurStore.map((p) => p.kodePU.toUpperCase()));
      const toAdd: PetakUkur[] = [];

      for (const item of items) {
        const itemCode = (item.kodePU || '').toUpperCase();
        if (existingCodes.has(itemCode)) {
          const idx = petakUkurStore.findIndex((p) => p.kodePU.toUpperCase() === itemCode);
          if (idx !== -1) {
            petakUkurStore[idx] = { ...petakUkurStore[idx], ...item };
          }
        } else {
          toAdd.push(item);
        }
      }
      petakUkurStore = [...toAdd, ...petakUkurStore];
    }

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'success',
      title: `Impor Excel Selesai (${items.length} PU)`,
      message: `Berhasil mengimpor ${items.length} data Petak Ukur (${mode === 'replace' ? 'Gantikan database' : 'Gabungkan database'}).`,
      isRead: false,
    };
    notificationStore.unshift(newNotif);

    broadcastEvent('pu_bulk_imported', { count: items.length, total: petakUkurStore.length });

    return res.status(200).json({
      success: true,
      count: items.length,
      total: petakUkurStore.length,
      data: petakUkurStore,
      notification: newNotif,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal memproses impor massal.' });
  }
});

// PUT update existing Petak Ukur
app.put('/api/pu/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const index = petakUkurStore.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Petak Ukur tidak ditemukan.' });
    }

    const existing = petakUkurStore[index];
    const body = req.body;

    const tanamanAwal: number =
      body.tanamanAwal !== undefined
        ? Number(body.tanamanAwal)
        : existing.tanamanAwal ?? 50;
    const tanamanHidup: number =
      body.tanamanHidup !== undefined
        ? Number(body.tanamanHidup)
        : existing.tanamanHidup ??
          Math.round(((body.survivalRate || body.persentaseHidup || existing.survivalRate || 0) / 100) * tanamanAwal);

    if (tanamanHidup > tanamanAwal) {
      return res.status(400).json({ error: 'Jumlah tanaman hidup tidak boleh melebihi jumlah tanaman awal.' });
    }

    const { rate, category } = calculateSurvivalRate(tanamanHidup, tanamanAwal);
    const kebutuhanPenyulaman = Math.max(0, tanamanAwal - tanamanHidup);

    const oldCategory = existing.kategori;
    const oldRate = existing.survivalRate;

    const updatedPU: PetakUkur = {
      ...existing,
      ...body,
      id: existing.id,
      kodePU: body.kodePU ? body.kodePU.trim().toUpperCase() : existing.kodePU,
      tanamanAwal,
      tanamanHidup,
      survivalRate: body.survivalRate !== undefined ? Number(body.survivalRate) : rate,
      kategori: body.kategori || category,
      kebutuhanPenyulaman,
      updatedAt: new Date().toISOString(),
    };

    petakUkurStore[index] = updatedPU;

    // Trigger notification if category changed or significant change
    let newNotif: AppNotification | null = null;
    if (oldCategory !== category || Math.abs(oldRate - rate) >= 5) {
      let nType: 'alert' | 'warning' | 'success' | 'info' = 'info';
      if (category === 'hitam') nType = 'alert';
      else if (category === 'merah') nType = 'warning';
      else if (category === 'hijau') nType = 'success';

      newNotif = {
        id: `notif-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: nType,
        title: `Pembaruan Evaluasi: ${updatedPU.kodePU} (${oldRate}% → ${rate}%)`,
        message: `Kategori berubah menjadi ${category.toUpperCase()} (${updatedPU.blok}, ${updatedPU.subDas}).`,
        petakUkurId: updatedPU.id,
        isRead: false,
      };
      notificationStore.unshift(newNotif);
    }

    broadcastEvent('pu_updated', { pu: updatedPU, notification: newNotif });

    return res.json({
      success: true,
      data: updatedPU,
      notification: newNotif,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal memperbarui data Petak Ukur.' });
  }
});

// DELETE Petak Ukur
app.delete('/api/pu/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const deletedItem = petakUkurStore.find((p) => p.id === id);
  if (!deletedItem) {
    return res.status(404).json({ error: 'Petak Ukur tidak ditemukan.' });
  }

  petakUkurStore = petakUkurStore.filter((p) => p.id !== id);

  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    type: 'info',
    title: `Titik Dihapus: ${deletedItem.kodePU}`,
    message: `Data Petak Ukur ${deletedItem.kodePU} telah dihapus dari sistem oleh tim.`,
    isRead: false,
  };
  notificationStore.unshift(notif);

  broadcastEvent('pu_deleted', { id, kodePU: deletedItem.kodePU, notification: notif });

  res.json({ success: true, id, notification: notif });
});

// POST bulk delete Petak Ukur (Multiple IDs)
app.post('/api/pu/bulk-delete', (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array ids tidak boleh kosong.' });
    }

    const idSet = new Set(ids);
    const beforeCount = petakUkurStore.length;
    petakUkurStore = petakUkurStore.filter((p) => !idSet.has(p.id));
    const deletedCount = beforeCount - petakUkurStore.length;

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'warning',
      title: `Hapus Massal Selesai (${deletedCount} PU)`,
      message: `Sebanyak ${deletedCount} data Petak Ukur berhasil dihapus sekaligus dari sistem.`,
      isRead: false,
    };
    notificationStore.unshift(notif);

    broadcastEvent('pu_bulk_deleted', { ids, deletedCount, remaining: petakUkurStore.length, notification: notif });

    return res.json({ success: true, count: deletedCount, remaining: petakUkurStore.length, notification: notif });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal menghapus data secara massal.' });
  }
});

// POST clear all Petak Ukur (Empty database)
app.post('/api/pu/clear-all', (req: Request, res: Response) => {
  try {
    const totalDeleted = petakUkurStore.length;
    petakUkurStore = [];

    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: 'warning',
      title: `Database PU Dikosongkan (${totalDeleted} Titik)`,
      message: `Seluruh ${totalDeleted} data Petak Ukur telah dikosongkan. Anda dapat mengimpor data baru via Excel.`,
      isRead: false,
    };
    notificationStore.unshift(notif);

    broadcastEvent('pu_cleared', { totalDeleted, notification: notif });

    return res.json({ success: true, count: totalDeleted, notification: notif });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Gagal mengosongkan data.' });
  }
});

// Reset to default sample dataset
app.post('/api/pu/reset', (req: Request, res: Response) => {
  petakUkurStore = JSON.parse(JSON.stringify(INITIAL_PETAK_UKUR));
  notificationStore = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));

  broadcastEvent('pu_reset', { data: petakUkurStore, notifications: notificationStore });

  res.json({
    success: true,
    message: 'Data Petak Ukur berhasil direset ke dataset acuan standar BPDAS.',
    data: petakUkurStore,
  });
});

// Start Server with Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Peta Kinerja Rehabilitasi DAS Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
