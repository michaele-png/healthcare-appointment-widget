import { Router } from 'express';
const router = Router();

// If NH provides signature verification, add it later.
// For now, parse JSON and return 200 so retries stop.
router.post('/', async (req, res) => {
  try {
    // console.log('NH webhook:', req.body);
    res.sendStatus(200);
  } catch {
    res.sendStatus(200);
  }
});

export default router;
