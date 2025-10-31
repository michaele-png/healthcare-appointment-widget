// src/routes/providers.js
import { Router } from 'express';
const router = Router();

// quick mount check
router.get('/__ping', (req, res) => res.json({ ok: true, where: 'providers' }));

// temporary stub so we can test the URL path
router.get('/locations', (req, res) => {
  res.json([{ id: 'stub_loc', name: 'Stub Location' }]);
});

export default router;
