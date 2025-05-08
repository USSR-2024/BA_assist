const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Проверка работоспособности сервиса
 * @access Public
 */
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
