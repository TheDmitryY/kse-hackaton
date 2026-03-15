const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Configure Multer for PDF uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize SQLite database
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    
    // Create tables
    db.serialize(() => {
      // Courses
      db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT
      )`);

      // Tests
      db.run(`CREATE TABLE IF NOT EXISTS tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        timeLimit INTEGER,
        FOREIGN KEY(course_id) REFERENCES courses(id)
      )`);

      // Questions
      db.run(`CREATE TABLE IF NOT EXISTS test_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER,
        question_text TEXT NOT NULL,
        FOREIGN KEY(test_id) REFERENCES tests(id)
      )`);

      // Options
      db.run(`CREATE TABLE IF NOT EXISTS question_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question_id INTEGER,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT 0,
        FOREIGN KEY(question_id) REFERENCES test_questions(id)
      )`);

      // Results
      db.run(`CREATE TABLE IF NOT EXISTS test_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER,
        student_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(test_id) REFERENCES tests(id)
      )`);

      // Course Enrollments
      db.run(`CREATE TABLE IF NOT EXISTS course_enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id),
        UNIQUE(student_id, course_id)
      )`);

      // Activities (Polymorphic: Test, PDF, Essay)
      db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'test', 'pdf', 'essay'
        title TEXT NOT NULL,
        description TEXT,
        content TEXT, -- stores test_id if type='test', filepath if type='pdf', prompt if type='essay'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(course_id) REFERENCES courses(id)
      )`);

      // Essay Submissions
      db.run(`CREATE TABLE IF NOT EXISTS essay_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        response_text TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(activity_id) REFERENCES activities(id)
      )`);
      
      // Insert mock courses if empty
      db.get("SELECT count(*) as count FROM courses", (err, row) => {
        if (row.count === 0) {
          const stmt = db.prepare("INSERT INTO courses (title, description) VALUES (?, ?)");
          stmt.run("Основи Машинного Навчання", "Вступ до ML");
          stmt.run("Нейромережі та Глибоке Навчання", "Основи DL");
          stmt.run("Аналіз Даних та Візуалізація", "Робота з даними");
          stmt.run("Обробка Природної Мови (NLP)", "Аналіз тексту та трансформери");
          stmt.run("Комп'ютерний Зір", "Розпізнавання образів та CNN");
          stmt.run("Основи Штучного Інтелекту", "Символьний ШІ та пошукові алгоритми");
          stmt.finalize();
        }
      });
    });
  }
});

// GET /api/courses
app.get('/api/courses', (req, res) => {
  db.all("SELECT * FROM courses", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/courses
app.post('/api/courses', (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run("INSERT INTO courses (title, description) VALUES (?, ?)", [title, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    // Return the inserted course for frontend state updates
    db.get("SELECT * FROM courses WHERE id = ?", [this.lastID], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, course: row });
    });
  });
});

// POST /api/upload - Handle file uploads
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ success: true, filePath: `/uploads/${req.file.filename}`,  originalName: req.file.originalname});
});

// GET /api/tests - list all tests
app.get('/api/tests', (req, res) => {
  db.all("SELECT tests.*, courses.title as course_title FROM tests JOIN courses ON tests.course_id = courses.id", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET /api/tests/:id - get specific test with questions and options
app.get('/api/tests/:id', (req, res) => {
  const testId = req.params.id;
  
  db.get("SELECT * FROM tests WHERE id = ?", [testId], (err, testData) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!testData) return res.status(404).json({ error: 'Test not found' });
    
    // Ensure we don't send `is_correct` logic to frontend yet if it's a student (though we could refine later)
    db.all("SELECT * FROM test_questions WHERE test_id = ?", [testId], (err, questions) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const questionIds = questions.map(q => q.id);
      if (questionIds.length === 0) {
         return res.json({ ...testData, questions: [] });
      }

      db.all(`SELECT * FROM question_options WHERE question_id IN (${questionIds.join(',')})`, [], (err, options) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const questionsWithOptions = questions.map(q => ({
          ...q,
          options: options.filter(o => o.question_id === q.id).map(o => ({
             id: o.id, text: o.option_text, is_correct: o.is_correct // remove is_correct for real prod, fine for demo
          }))
        }));
        
        res.json({ ...testData, questions: questionsWithOptions });
      });
    });
  });
});

// POST /api/tests - teacher creating a test
app.post('/api/tests', (req, res) => {
  const { course_id, title, description, timeLimit, questions } = req.body;
  
  db.run("INSERT INTO tests (course_id, title, description, timeLimit) VALUES (?, ?, ?, ?)", [course_id, title, description, timeLimit], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    const testId = this.lastID;
    
    // Insert questions and options
    if (questions && questions.length > 0) {
      questions.forEach(q => {
        db.run("INSERT INTO test_questions (test_id, question_text) VALUES (?, ?)", [testId, q.question_text], function(err) {
          if (!err) {
            const questionId = this.lastID;
            if (q.options && q.options.length > 0) {
              q.options.forEach(opt => {
                db.run("INSERT INTO question_options (question_id, option_text, is_correct) VALUES (?, ?, ?)", [questionId, opt.text, opt.is_correct ? 1 : 0]);
              });
            }
          }
        });
      });
    }
    
    res.json({ success: true, id: testId });
  });
});

// POST /api/tests/:id/submit - student submitting
app.post('/api/tests/:id/submit', (req, res) => {
  const testId = req.params.id;
  const { student_id, answers } = req.body; // answers: { questionId: selectedOptionId }
  
  // To calculate score, we need right answers
  const questionIds = Object.keys(answers).join(',');
  if (!questionIds) return res.json({ success: true, score: 0 });

  db.all(`SELECT * FROM question_options WHERE question_id IN (${questionIds}) AND is_correct = 1`, [], (err, correctOptions) => {
     if (err) return res.status(500).json({ error: err.message });
     
     let score = 0;
     correctOptions.forEach(opt => {
        if (answers[opt.question_id] === opt.id) {
           score++;
        }
     });

     const totalQuestions = Object.keys(answers).length;

     db.run("INSERT INTO test_results (test_id, student_id, score, total_questions) VALUES (?, ?, ?, ?)", [testId, student_id, score, totalQuestions], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, score, total: totalQuestions });
     });
  });
});

// GET /api/results - teacher views results
app.get('/api/results', (req, res) => {
  db.all(`
    SELECT r.id, r.student_id, r.score, r.total_questions, r.submitted_at, 
           t.title as test_title, c.title as course_title
    FROM test_results r
    JOIN tests t ON r.test_id = t.id
    JOIN courses c ON t.course_id = c.id
    ORDER BY r.submitted_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/enroll - student enrolls in a course
app.post('/api/enroll', (req, res) => {
  const { student_id, course_id } = req.body;
  if (!student_id || !course_id) return res.status(400).json({ error: 'Missing student_id or course_id' });
  
  db.run("INSERT INTO course_enrollments (student_id, course_id) VALUES (?, ?)", [student_id, course_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// GET /api/enrollments/:student_id
app.get('/api/enrollments/:student_id', (req, res) => {
  db.all("SELECT course_id FROM course_enrollments WHERE student_id = ?", [req.params.student_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.course_id));
  });
});

// POST /api/activities
app.post('/api/activities', (req, res) => {
  const { course_id, type, title, description, content } = req.body;
  if (!course_id || !type || !title) return res.status(400).json({ error: 'Missing required fields' });
  
  db.run("INSERT INTO activities (course_id, type, title, description, content) VALUES (?, ?, ?, ?, ?)", 
    [course_id, type, title, description, content], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
  });
});

// GET /api/activities/:course_id
app.get('/api/activities/:course_id', (req, res) => {
  db.all("SELECT * FROM activities WHERE course_id = ? ORDER BY created_at ASC", [req.params.course_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST /api/essays - student submits essay
app.post('/api/essays', (req, res) => {
  const { activity_id, student_id, response_text } = req.body;
  if (!activity_id || !student_id || !response_text) return res.status(400).json({ error: 'Missing fields' });
  
  db.run("INSERT INTO essay_submissions (activity_id, student_id, response_text) VALUES (?, ?, ?)", 
    [activity_id, student_id, response_text], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
