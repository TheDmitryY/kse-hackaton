const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { Readable } = require('stream');
const { pool, runMigrations } = require('./db');

const app = express();
const PORT = Number(process.env.NODE_PORT || 3001);
const GROQ_API_KEY =
  process.env.GROQ_API_KEY ||
  process.env.GROQ_API ||
  process.env.GEMINI_API ||
  process.env.GEMINI_API_KEY ||
  '';
const GROQ_MODEL = process.env.GROQ_MODEL || process.env.GEMINI_MODEL || 'llama-3.3-70b-versatile';
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://voice:8001';

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

function buildGroqMessages(history, message) {
  const messages = [];
  if (Array.isArray(history)) {
    for (const item of history) {
      if (!item || typeof item.text !== 'string') {
        continue;
      }
      const role = item.role === 'assistant' ? 'assistant' : 'user';
      messages.push({ role, content: item.text });
    }
  }
  messages.push({ role: 'user', content: message });
  return messages;
}

function extractGroqText(payload) {
  return payload?.choices?.[0]?.message?.content?.trim() || '';
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.post('/api/ai/stream', async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured' });
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: buildGroqMessages(history, message.trim()),
      }),
    });

    if (!groqResponse.ok) {
      const details = await groqResponse.text();
      let parsed = null;
      try {
        parsed = JSON.parse(details);
      } catch (_error) {
        parsed = null;
      }
      const providerMessage = parsed?.error?.message || details;
      const statusCode = groqResponse.status === 429 ? 429 : 502;
      return res.status(statusCode).json({ error: 'Groq request failed', details: providerMessage });
    }

    const groqPayload = await groqResponse.json();
    const answerText =
      extractGroqText(groqPayload) ||
      'Вибачте, я не зміг сформувати відповідь. Спробуйте ще раз.';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const chunks = answerText.split(/(\s+)/).filter((chunk) => chunk.length > 0);
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      await wait(20);
    }
    res.write(`data: ${JSON.stringify({ type: 'done', text: answerText })}\n\n`);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/voice', async (req, res) => {
  const { text, language = 'uk' } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const voiceResponse = await fetch(`${VOICE_SERVICE_URL}/synthesize-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), language }),
    });

    if (!voiceResponse.ok) {
      const details = await voiceResponse.text();
      return res.status(502).json({ error: 'Voice service request failed', details });
    }

    res.setHeader('Content-Type', 'audio/mpeg');

    if (voiceResponse.body) {
      Readable.fromWeb(voiceResponse.body).pipe(res);
      return;
    }

    const audioBuffer = Buffer.from(await voiceResponse.arrayBuffer());
    res.send(audioBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courses', async (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO courses (title, description) VALUES ($1, $2) RETURNING *',
      [title, description ?? null]
    );
    res.json({ success: true, course: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    success: true,
    filePath: `/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
  });
});

app.get('/api/tests', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT tests.*, courses.title AS course_title
      FROM tests
      JOIN courses ON tests.course_id = courses.id
      ORDER BY tests.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tests/:id', async (req, res) => {
  const testId = Number(req.params.id);
  if (!Number.isInteger(testId)) {
    return res.status(400).json({ error: 'Invalid test id' });
  }

  try {
    const testResult = await pool.query('SELECT * FROM tests WHERE id = $1', [testId]);
    if (testResult.rowCount === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const questionsResult = await pool.query(
      'SELECT * FROM test_questions WHERE test_id = $1 ORDER BY id',
      [testId]
    );
    const questions = questionsResult.rows;

    if (questions.length === 0) {
      return res.json({ ...testResult.rows[0], questions: [] });
    }

    const questionIds = questions.map((q) => q.id);
    const optionsResult = await pool.query(
      'SELECT * FROM question_options WHERE question_id = ANY($1::int[]) ORDER BY id',
      [questionIds]
    );

    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: optionsResult.rows
        .filter((o) => o.question_id === q.id)
        .map((o) => ({ id: o.id, text: o.option_text, is_correct: o.is_correct })),
    }));

    res.json({ ...testResult.rows[0], questions: questionsWithOptions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tests', async (req, res) => {
  const { course_id, title, description, timeLimit, questions } = req.body;
  if (!course_id || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const testResult = await client.query(
      'INSERT INTO tests (course_id, title, description, "timeLimit") VALUES ($1, $2, $3, $4) RETURNING id',
      [course_id, title, description ?? null, timeLimit ?? null]
    );
    const testId = testResult.rows[0].id;

    if (Array.isArray(questions)) {
      for (const q of questions) {
        const questionResult = await client.query(
          'INSERT INTO test_questions (test_id, question_text) VALUES ($1, $2) RETURNING id',
          [testId, q.question_text]
        );
        const questionId = questionResult.rows[0].id;

        if (Array.isArray(q.options)) {
          for (const opt of q.options) {
            await client.query(
              'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
              [questionId, opt.text, Boolean(opt.is_correct)]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, id: testId });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete('/api/tests/:id', async (req, res) => {
  const testId = Number(req.params.id);
  if (!Number.isInteger(testId)) {
    return res.status(400).json({ error: 'Invalid test id' });
  }

  try {
    const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING id', [testId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tests/:id/submit', async (req, res) => {
  const testId = Number(req.params.id);
  const { student_id, answers } = req.body;
  if (!Number.isInteger(testId) || !student_id || typeof answers !== 'object' || !answers) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const questionIds = Object.keys(answers)
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id));

  if (questionIds.length === 0) {
    return res.json({ success: true, score: 0, total: 0 });
  }

  try {
    const correctResult = await pool.query(
      'SELECT question_id, id FROM question_options WHERE question_id = ANY($1::int[]) AND is_correct = TRUE',
      [questionIds]
    );

    let score = 0;
    for (const row of correctResult.rows) {
      const selectedOption = Number(answers[row.question_id] ?? answers[String(row.question_id)]);
      if (selectedOption === row.id) {
        score += 1;
      }
    }

    const totalQuestions = questionIds.length;
    await pool.query(
      'INSERT INTO test_results (test_id, student_id, score, total_questions) VALUES ($1, $2, $3, $4)',
      [testId, student_id, score, totalQuestions]
    );

    res.json({ success: true, score, total: totalQuestions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/results', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.student_id, r.score, r.total_questions, r.submitted_at,
             t.title AS test_title, c.title AS course_title
      FROM test_results r
      JOIN tests t ON r.test_id = t.id
      JOIN courses c ON t.course_id = c.id
      ORDER BY r.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enroll', async (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) {
    return res.status(400).json({ error: 'Missing student_id or course_id' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO course_enrollments (student_id, course_id) VALUES ($1, $2) RETURNING id',
      [student_id, course_id]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/enrollments/:student_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT course_id FROM course_enrollments WHERE student_id = $1 ORDER BY enrolled_at',
      [req.params.student_id]
    );
    res.json(result.rows.map((r) => r.course_id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/activities', async (req, res) => {
  const { course_id, type, title, description, content } = req.body;
  if (!course_id || !type || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO activities (course_id, type, title, description, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [course_id, type, title, description ?? null, content ?? null]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activities ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/activities/:course_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE course_id = $1 ORDER BY created_at ASC',
      [req.params.course_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function submitEssay(req, res) {
  const { activity_id, student_id, response_text } = req.body;
  if (!activity_id || !student_id || !response_text) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO essay_submissions (activity_id, student_id, response_text)
       VALUES ($1, $2, $3) RETURNING id`,
      [activity_id, student_id, response_text]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

app.post('/api/essay_submissions', submitEssay);
app.post('/api/essays', submitEssay);

async function start() {
  try {
    await runMigrations();
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize backend:', error);
    process.exit(1);
  }
}

start();
