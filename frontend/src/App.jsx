import { useState, useEffect } from 'react'
import {
  BookOpen,
  BrainCircuit,
  FileText,
  Users,
  BarChart,
  ChevronDown,
  MoreVertical,
  Calendar,
  Clock,
  Hourglass,
  CheckCircle2,
  BookA,
  PanelRightClose,
  PanelRightOpen,
  ArrowRightToLine,
  ArrowLeftFromLine,
  Mic,
  LayoutDashboard,
  Search
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [currentView, setCurrentView] = useState('courses') // 'tests' | 'courses' | 'checking' | 'students' | 'course_details' | 'teacher_tests' | 'take_test'
  const [role, setRole] = useState(null); // 'student' | 'teacher'
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Data from backend
  const [courses, setCourses] = useState([]);
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);

  // Navigation State
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  
  // Test Taking State
  const [selectedTest, setSelectedTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});

  // Essay Submission State
  const [essayContent, setEssayContent] = useState('');

  // AI Tutor State
  const [isAiTutorModalOpen, setIsAiTutorModalOpen] = useState(false);

  // Anti-Cheating State
  const [blurWarningCount, setBlurWarningCount] = useState(0);

  // Search & Grading State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradingResult, setSelectedGradingResult] = useState(null);

  // Course Creation State
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: ''
  });

  // Activity Creation State
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityForm, setActivityForm] = useState({
    course_id: '',
    type: 'pdf', // 'pdf', 'test', 'essay'
    title: '',
    description: '',
    timeLimit: 30,
    questions: [
      { question_text: '', options: [{text: '', is_correct: true}, {text: '', is_correct: false}] }
    ],
    pdfFile: null,
    essayPrompt: ''
  });

  // Enrollments State
  const [enrollments, setEnrollments] = useState([]);

  // Activities State
  const [courseActivities, setCourseActivities] = useState([]);

  useEffect(() => {
    // Fetch courses
    fetch('http://localhost:3001/api/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error("Failed to load courses", err));

    // Fetch tests
    fetch('http://localhost:3001/api/tests')
      .then(res => res.json())
      .then(data => setTests(data))
      .catch(err => console.error("Failed to load tests", err));

    // Fetch results
    fetch('http://localhost:3001/api/results')
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(err => console.error("Failed to load results", err));
  }, []);

  // Fetch enrollments on login change
  useEffect(() => {
    if (isAuthenticated && role === 'student' && username) {
      fetch(`http://localhost:3001/api/enrollments/${username}`)
        .then(res => res.json())
        .then(data => setEnrollments(data))
        .catch(err => console.error(err));
    }
  }, [isAuthenticated, role, username]);

  // Fetch activities when a course is selected
  useEffect(() => {
    if (selectedCourseId) {
      fetch(`http://localhost:3001/api/activities/${selectedCourseId}`)
        .then(res => res.json())
        .then(data => setCourseActivities(data))
        .catch(err => console.error(err));
    }
  }, [selectedCourseId]);



  // Anti-Cheating effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if ((currentView === 'take_test' || currentView === 'take_essay') && selectedTest && document.visibilityState === 'hidden') {
        const newCount = blurWarningCount + 1;
        setBlurWarningCount(newCount);
        if (newCount === 1) {
          const finish = window.confirm("Ви впевнені що хочете завершити завдання? При повторному переході на іншу вкладку воно буде завершено автоматично.");
          if (finish) {
            if (currentView === 'take_test') submitTest();
            else if (currentView === 'take_essay') submitEssay();
          }
        } else if (newCount >= 2) {
          alert("Система зафіксувала повторне перемикання вкладок. Завдання завершено автоматично.");
          if (currentView === 'take_test') submitTest();
          else if (currentView === 'take_essay') submitEssay();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [currentView, selectedTest, blurWarningCount, testAnswers, essayContent]);

  const submitEssay = () => {
    fetch('http://localhost:3001/api/essay_submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: username,
        course_id: selectedTest.course_id,
        activity_id: selectedTest.id,
        content: essayContent
      })
    })
    .then(res => res.json())
    .then(res => {
      if(res.success) {
        alert("Есе успішно відправлено!");
        setCurrentView('course_details');
        setEssayContent('');
        setSelectedTest(null);
        setBlurWarningCount(0);
      }
    });
  };

  const submitTest = () => {
    if (!selectedTest) return;
    fetch(`http://localhost:3001/api/tests/${selectedTest.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: username, // Dynamic from login state
        answers: testAnswers
      })
    })
    .then(res => res.json())
    .then(res => {
      if (res.success) {
        alert(`Тест завершено! Ваш результат: ${res.score} / ${res.total}`);
        setCurrentView('course_details');
        setBlurWarningCount(0); // reset counter
      }
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (username === 'student' && password === 'student') {
      setIsAuthenticated(true);
      setRole('student');
      setCurrentView('student_dashboard');
    } else if (username === 'lecturer' && password === 'lecturer') {
      setIsAuthenticated(true);
      setRole('teacher');
      setCurrentView('teacher_dashboard');
    } else {
      setLoginError('Невірний логін або пароль');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(null);
    setUsername('');
    setPassword('');
  };
  
  const chartData = [
    { name: 'Mon', score: 20 },
    { name: 'Tue', score: 45 },
    { name: 'Wed', score: 40 },
    { name: 'Thu', score: 65 },
    { name: 'Fri', score: 55 },
    { name: 'Sat', score: 90 },
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-md animate-in fade-in duration-300">
          <div className="flex flex-col items-center mb-8">
            <BookA className="w-12 h-12 text-[#1e5dd8] mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 text-center">Вхід у LearnAI Portal</h1>
            <p className="text-gray-500 text-sm mt-2 text-center">Оберіть свою роль для початку роботи</p>
          </div>

          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Ім'я користувача</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors"
                placeholder="student або lecturer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors"
                placeholder="Введіть пароль"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm mt-2"
            >
              Увійти
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 font-medium">
              Дані для входу:<br/>
              Студент: <b>student</b> / <b>student</b><br/>
              Вчитель: <b>lecturer</b> / <b>lecturer</b>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-sm text-text-secondary">
      {/* Header */}
      <header className="sticky top-0 flex items-center justify-between px-6 py-3 bg-white border-b border-border shadow-sm z-30">
        <div className="flex items-center gap-2">
          <BookA className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-text-primary tracking-tight">LearnAI Portal</span>
        </div>
        <div className="flex items-center gap-4">
            {/* Logout Button */}
            <div className="hidden sm:flex mx-2">
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors shadow-sm"
              >
                Вийти
              </button>
            </div>

            <button 
              onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
              className="text-gray-400 hover:text-gray-600 hidden sm:flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors ml-1"
              title={isRightSidebarOpen ? "Сховати бічну панель" : "Показати бічну панель"}
            >
              {isRightSidebarOpen ? <ArrowRightToLine className="w-5 h-5" /> : <ArrowLeftFromLine className="w-5 h-5" />}
            </button>
            
          </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-100 flex-col hidden lg:flex sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
          <div className="p-4 py-6 text-xs uppercase font-bold text-gray-400 tracking-wider">
            {role === 'teacher' ? 'Вчитель' : 'Студент'}
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {role === 'student' && (
              <>
                <button 
                  onClick={() => setCurrentView('student_dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'student_dashboard' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Дашборд</span>
                </button>
                <button 
                  onClick={() => setCurrentView('courses')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'courses' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Мої Курси</span>
                </button>
                <button 
                  onClick={() => setCurrentView('all_courses')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'all_courses' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Search className="w-5 h-5" />
                  <span className="font-medium">Усі курси</span>
                </button>
                <button 
                  onClick={() => setIsAiTutorModalOpen(true)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-left"
                >
                  <BrainCircuit className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium block">Тренування ШІ</span>
                    <span className="text-xs text-gray-400">Діалог з Тьютором</span>
                  </div>
                </button>
                <button 
                  onClick={() => setCurrentView('tests')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'tests' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <FileText className="w-5 h-5" />
                  <span>Тести</span>
                </button>
              </>
            )}

            {role === 'teacher' && (
              <>
                <button 
                  onClick={() => setCurrentView('teacher_dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'teacher_dashboard' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="font-medium">Дашборд</span>
                </button>
                <button 
                  onClick={() => setCurrentView('courses')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'courses' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Мої курси</span>
                </button>
                <button 
                  onClick={() => setCurrentView('checking')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'checking' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Перевірка тестів</span>
                </button>
                <button 
                  onClick={() => setCurrentView('students')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${currentView === 'students' ? 'bg-blue-50 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Студенти</span>
                </button>
              </>
            )}
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <BarChart className="w-5 h-5" />
              <span className="font-medium">Звіти</span>
            </button>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 bg-[#f4f7fe] min-h-[100vh]">
          
          {currentView === 'student_dashboard' && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Мій профіль</h1>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f4f7fe] shrink-0">
                  <img src="/api/placeholder/96/96" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{username || "Студент"}</h2>
                  <p className="text-[#1e5dd8] font-medium mb-2">Студент</p>
                  <p className="text-sm text-gray-500 max-w-lg">
                    Ентузіаст машинного навчання та штучного інтелекту. Активно вивчає нейромережі та програмування.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-gray-500">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-bold text-sm">Час на платформі</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">24<span className="text-lg text-gray-400 font-medium">год</span> 15<span className="text-lg text-gray-400 font-medium">хв</span></div>
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    +12% з минулого тижня
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-gray-500">
                    <BookOpen className="w-5 h-5 text-orange-500" />
                    <span className="font-bold text-sm">Активні курси</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{courses.length}</div>
                  <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                    2 нових курси
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-gray-500">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-sm">Пройдено тестів</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{results.filter(r => r.student_id === username).length}</div>
                  <div className="text-xs font-bold text-gray-400">Всього на платформі</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 text-gray-500">
                    <BarChart className="w-5 h-5 text-purple-500" />
                    <span className="font-bold text-sm">Середній бал</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {() => {
                      const studentResults = results.filter(r => r.student_id === username);
                      if (studentResults.length === 0) return '0%';
                      const avg = studentResults.reduce((acc, r) => acc + (r.score / r.total_questions), 0) / studentResults.length;
                      return `${Math.round(avg * 100)}%`;
                    }}
                    {/* fallback mock */}
                    88%
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '88%'}}></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Progress Chart */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Ваш Прогрес</h2>
                  <div className="h-64 w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                        <CartesianGrid vertical={false} stroke="#f3f4f6" />
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="score" stroke="#1e5dd8" strokeWidth={3} dot={{r:4, fill: '#1e5dd8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Останні результати</h2>
                {results.filter(r => r.student_id === username).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Ви ще не здавали жодних тестів.</div>
                ) : (
                  <div className="space-y-4">
                    {results.filter(r => r.student_id === username).slice(0, 5).map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div>
                          <h3 className="font-bold text-gray-900">{r.test_title}</h3>
                          <p className="text-sm text-gray-500">{r.course_title} • {new Date(r.submitted_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-xl font-bold text-[#1e5dd8]">{Math.round((r.score / r.total_questions) * 100)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {currentView === 'teacher_dashboard' && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Профіль Викладача</h1>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#f4f7fe] shrink-0">
                  <img src="/api/placeholder/96/96" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">{username || "Викладач"}</h2>
                  <p className="text-[#1e5dd8] font-medium mb-2">Викладач</p>
                  <p className="text-sm text-gray-500 max-w-lg">
                    Професор комп'ютерних наук. Викладає архітектуру комп'ютерів та машинне навчання. Куратор AI-лабораторії.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 text-[#1e5dd8] flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-500 mb-1">Кількість курсів</div>
                    <div className="text-2xl font-bold text-gray-900">{courses.length}</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-500 mb-1">Студентів на курсах</div>
                    {/* Mocked metric, can calculate from DB if we had enrollments */}
                    <div className="text-2xl font-bold text-gray-900">124</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <BarChart className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-500 mb-1">Середня успішність</div>
                    <div className="text-2xl font-bold text-gray-900">
                       {results.length > 0 ? `${Math.round(results.reduce((acc, r) => acc + (r.score / r.total_questions), 0) / results.length * 100)}%` : '0%'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Прогрес Груп</h2>
                <div className="h-64 w-full -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dx={-10} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
                      <CartesianGrid vertical={false} stroke="#f3f4f6" />
                      <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="score" stroke="#1e5dd8" strokeWidth={3} dot={{r:4, fill: '#1e5dd8', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Успішність вивчення курсів</h2>
                {courses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Немає створених курсів.</div>
                ) : (
                  <div className="space-y-4">
                    {courses.map(course => {
                      const courseResults = results.filter(r => r.course_title === course.title);
                      const avg = courseResults.length > 0 
                        ? Math.round(courseResults.reduce((acc, r) => acc + (r.score / r.total_questions), 0) / courseResults.length * 100)
                        : 0;

                      return (
                        <div key={course.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <h3 className="font-bold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-500 font-medium">Зданих тестів: {courseResults.length}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-2.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                              <div className="h-full bg-[#1e5dd8]" style={{ width: `${avg}%` }}></div>
                            </div>
                            <span className="font-bold text-gray-900 min-w-[3rem] text-right">{avg}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'all_courses' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Усі Курси</h1>
                <div className="relative w-full sm:max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors"
                    placeholder="Пошук за назвою..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {courses
                  .filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(course => {
                  const courseTests = tests.filter(t => t.course_id === course.id).length;
                  return (
                    <div key={course.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-[19px] leading-tight pr-4 whitespace-pre-line">{course.title}</h3>
                      </div>
                      <p className="text-[13px] text-gray-900 font-medium mb-6 leading-relaxed whitespace-pre-line line-clamp-3">
                        {course.description || 'Опис відсутній'}
                      </p>
                      
                      <div className="flex items-center gap-6 mb-6 mt-auto">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-1">
                             <FileText className="w-4 h-4 text-gray-500" />
                             {courseTests || 0}
                           </div>
                           <span className="text-xs font-semibold text-gray-900">Тестів</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        {role === 'student' && !enrollments.includes(course.id) ? (
                          <button 
                            onClick={() => {
                              fetch('http://localhost:3001/api/enroll', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ student_id: username, course_id: course.id })
                              })
                              .then(r => r.json())
                              .then(res => {
                                if (res.success) {
                                  alert("Ви успішно записалися на курс!");
                                  setEnrollments([...enrollments, course.id]);
                                }
                              });
                            }}
                            className="w-full bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors text-[13px] border border-[#1e5dd8]"
                          >
                            Записатись на курс
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setCurrentView('course_details');
                            }}
                            className="w-full bg-white hover:bg-gray-50 text-[#1e5dd8] font-bold py-2.5 rounded-lg transition-colors text-[13px] border border-[#1e5dd8]"
                          >
                            Перейти до курсу
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {courses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">За вашим запитом нічого не знайдено.</div>
                )}
              </div>
            </div>
          )}

          {currentView === 'all_courses' && (
            <div className="animate-in fade-in duration-300">
              {/* ... */}
              {/* All courses UI remains here unaffected, inserting below it */}
            </div>
          )}

          {currentView === 'create_course' && (
            <div className="animate-in fade-in duration-300 max-w-3xl mx-auto">
              <button 
                onClick={() => setCurrentView('courses')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
              >
                <ChevronDown className="w-5 h-5 rotate-90" /> Назад до списку
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1e5dd8] flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  Створити новий курс
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Назва курсу <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors"
                      placeholder="Наприклад: Вступ до Нейромереж"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Опис курсу</label>
                    <textarea 
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors resize-none h-32"
                      placeholder="Короткий опис про що цей курс..."
                    ></textarea>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => {
                        fetch('http://localhost:3001/api/courses', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(courseForm)
                        })
                        .then(res => res.json())
                        .then(res => {
                          if (res.success) {
                            alert("Курс успішно створено!");
                            // refresh courses
                            fetch('http://localhost:3001/api/courses')
                              .then(r => r.json())
                              .then(data => setCourses(data));
                            setCourseForm({ title: '', description: '' });
                            setCurrentView('courses');
                          } else {
                            alert(`Помилка: ${res.error || 'Заповніть всі поля.'}`);
                          }
                        });
                      }}
                      className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
                    >
                      Створити курс
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'courses' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Мої Курси</h1>
                {role === 'teacher' && (
                  <button 
                    onClick={() => setCurrentView('create_course')}
                    className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                  >
                    <span className="text-xl leading-none mb-0.5">+</span> Створити новий курс
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {courses.filter(c => role === 'teacher' || enrollments.includes(c.id)).length === 0 ? (
                  <div className="col-span-full py-12 text-center text-gray-500">{courses.length === 0 ? 'Завантаження курсів...' : 'Ви ще не записані на жоден курс.'}</div>
                ) : courses.filter(c => role === 'teacher' || enrollments.includes(c.id)).map(course => {
                  const courseTests = tests.filter(t => t.course_id === course.id).length;
                  return (
                    <div key={course.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold text-gray-900 text-[19px] leading-tight pr-4 whitespace-pre-line">{course.title}</h3>
                        <button className="text-gray-400 hover:text-gray-600 mt-1">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-[13px] text-gray-900 font-medium mb-6 leading-relaxed whitespace-pre-line">
                        {course.description || 'Опис відсутній'}
                      </p>
                      
                      <div className="flex items-center gap-6 mb-6 mt-auto">
                        <div className="flex flex-col">
                           <div className="flex items-center gap-2 text-gray-800 font-bold text-lg mb-1">
                             <FileText className="w-4 h-4 text-gray-500" />
                             {courseTests || 0}
                           </div>
                           <span className="text-xs font-semibold text-gray-900">Тестів</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 rounded-xl p-3 mb-6 flex items-start gap-3 border border-emerald-100/50">
                         <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                           <div className="w-3 h-3 rounded-full bg-emerald-500/40 flex items-center justify-center">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                           </div>
                         </div>
                         <span className="text-[13px] font-bold text-gray-900 leading-tight pt-0.5 whitespace-pre-line">AI-Аналіз активний</span>
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        <button 
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setCurrentView('course_details');
                          }}
                          className="w-full bg-[#1e5dd8] hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors text-[13px]"
                        >
                          Перейти до курсу
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {currentView === 'course_details' && (
            <div className="animate-in fade-in duration-300">
               <button onClick={() => setCurrentView('courses')} className="text-gray-500 hover:text-[#1e5dd8] hover:underline font-bold mb-6 flex items-center gap-2 text-sm transition-colors">
                 <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                 Назад до списку курсів
               </button>
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                 <h1 className="text-3xl font-bold text-gray-900">{courses.find(c => c.id === selectedCourseId)?.title || "Курс"}</h1>
                 {role === 'teacher' && (
                   <button 
                     onClick={() => {
                       setActivityForm(prev => ({ ...prev, course_id: selectedCourseId, type: 'pdf' }));
                       setIsActivityModalOpen(true);
                     }}
                     className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                   >
                     <span className="text-xl leading-none mb-0.5">+</span> Додати активність
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8">
                       <h2 className="text-xl font-bold text-gray-900 mb-6">Матеріали курсу</h2>
                       <ul className="space-y-3">
                         {courseActivities.map(activity => (
                           <li 
                             key={activity.id} 
                             onClick={() => {
                               if (activity.type === 'pdf') {
                                 window.open(`http://localhost:3001${activity.content}`, '_blank');
                               } else if (activity.type === 'essay') {
                                 setSelectedTest(activity); // reuse selectedTest for essay active state
                                 setCurrentView('take_essay');
                               }
                             }}
                             className="flex items-center gap-4 p-4 hover:bg-blue-50/50 rounded-xl transition-colors border border-gray-100 cursor-pointer group shadow-sm"
                           >
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${activity.type === 'pdf' ? 'bg-red-50 text-red-600 border-red-100/50 group-hover:bg-red-600 group-hover:text-white' : 'bg-purple-50 text-purple-600 border-purple-100/50 group-hover:bg-purple-600 group-hover:text-white'}`}>
                               {activity.type === 'pdf' ? <FileText className="w-6 h-6"/> : <BookOpen className="w-6 h-6" />}
                             </div>
                             <div className="flex-1">
                               <div className="font-bold text-gray-900 group-hover:text-[#1e5dd8] transition-colors leading-tight mb-0.5">{activity.title}</div>
                               <div className="text-xs text-gray-500 font-medium">{activity.type === 'pdf' ? 'PDF Документ' : 'Есе'}</div>
                             </div>
                             <button className="text-gray-400 group-hover:text-blue-600"><MoreVertical className="w-5 h-5"/></button>
                           </li>
                         ))}
                        {tests.filter(t => t.course_id === selectedCourseId).map(test => (
                          <li key={test.id} onClick={() => {
                              setSelectedTest(test);
                              fetch(`http://localhost:3001/api/tests/${test.id}`)
                                .then(res => res.json())
                                .then(data => {
                                  setTestQuestions(data.questions || []);
                                  setTestAnswers({});
                                  setCurrentView('take_test');
                                });
                            }} 
                            className="flex items-center gap-4 p-4 hover:bg-blue-50/50 rounded-xl transition-colors border border-gray-100 cursor-pointer group shadow-sm"
                          >
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Calendar className="w-6 h-6"/>
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-gray-900 leading-tight mb-0.5">{test.title}</div>
                              <div className="text-xs text-gray-500 font-medium">{test.timeLimit ? `Час: ${test.timeLimit} хв` : 'Без обмежень'}</div>
                            </div>
                            <button className="px-4 py-2 bg-[#1e5dd8] text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">Почати</button>
                          </li>
                        ))}
                       </ul>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8">
                       <h2 className="text-xl font-bold text-gray-900 mb-6">Тренування з ШІ-Тьютором</h2>
                       <p className="text-gray-600 text-sm font-medium mb-6">
                         Підвищуйте рівень знань проходячи інтерактивні тренування з розумним помічником.
                       </p>
                       <button className="w-full bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                         <BrainCircuit className="w-5 h-5" />
                         Почати нове тренування
                       </button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 xl:p-8">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                         <Hourglass className="w-6 h-6 text-orange-500" />
                         Тести
                       </h2>
                       <ul className="space-y-4">
                         <li className="p-4 rounded-xl border-2 border-orange-200 bg-orange-50/30">
                           <div className="flex justify-between items-start mb-3">
                             <div className="font-bold text-gray-900 text-base leading-tight">Тест 1. Основи алгоритмів</div>
                           </div>
                           <div className="flex items-center gap-3 text-xs text-orange-800 font-bold mb-4">
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/> Дедлайн: Сьогодні</span>
                              <span>• 20 питань</span>
                           </div>
                           <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
                             Пройти зараз
                           </button>
                         </li>
                         <li className="p-4 rounded-xl border border-gray-200">
                           <div className="flex justify-between items-start mb-3">
                             <div className="font-bold text-gray-900 text-[15px] leading-tight opacity-70">Тест 2. Регуляризація</div>
                           </div>
                           <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mb-4">
                              <span>Відкриється 16.10</span>
                           </div>
                           <button className="w-full bg-gray-100 text-gray-400 font-bold px-3 py-2.5 rounded-lg text-sm cursor-not-allowed">
                             Пройти
                           </button>
                         </li>
                       </ul>
                    </div>
                  </div>
               </div>
            </div>
          )}

          {currentView === 'tests' && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Тести та Аналіз LearnAI</h1>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: Current Tests */}
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Поточні тести</h2>
                  
                  {tests.length === 0 ? (
                    <div className="py-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">Немає доступних тестів.</div>
                  ) : tests.map(test => {
                    const testResult = results.find(r => r.test_id === test.id && r.student_id === username);
                    
                    return (
                      <div key={test.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 rounded-lg text-primary">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-gray-900 text-base">{test.course_title}</span>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <h3 className="font-bold text-gray-900 text-lg mb-4">{test.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-medium">
                            <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> {test.timeLimit ? `${test.timeLimit} хв` : 'Без обмежень'}</div>
                          </div>
                        </div>

                        {testResult ? (
                          <div className="mt-auto">
                            <div className="bg-green-50 text-green-700 font-bold p-3 rounded-xl flex items-center justify-between border border-green-100">
                              <span>Завершено</span>
                              <span className="text-lg">{testResult.score}/{testResult.total_questions}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-auto">
                            <button 
                              onClick={() => {
                                setSelectedTest(test);
                                fetch(`http://localhost:3001/api/tests/${test.id}`)
                                  .then(res => res.json())
                                  .then(data => {
                                    setTestQuestions(data.questions || []);
                                    setTestAnswers({});
                                    setCurrentView('take_test');
                                  });
                              }}
                              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors"
                            >
                              ПОЧАТИ ТЕСТ
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: AI Feedback */}
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Ваш Результат & ШІ Фідбек</h2>
                  
                  <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100/50 rounded-lg text-green-700">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900 text-base leading-tight">Машинне навчання<br/>(Модуль 3)</span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-gray-600">Результат: </span>
                      <span className="font-bold text-green-600 text-lg">92/100 (A)</span>
                    </div>
                    
                    <div className="space-y-4 text-gray-800 border-t border-green-200/60 pt-6">
                      <p className="font-semibold text-[15px]">ШІ Оцінка (Натреновано проф. І. Коваленко):</p>
                      <p className="text-[15px] leading-relaxed">Відмінне розуміння градієнтного спуску (10/10).</p>
                      <p className="text-[15px] leading-relaxed mb-4">Помилка в питанні 7<br/>(регуляризація L2) - перегляньте лекцію 6.</p>
                      <p className="font-medium text-[15px] mt-4 opacity-90">Рекомендації: Перечитати розділ "Оптимізація моделі".</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Section 1: AI Voice Tutor */}
              <section className="mt-10">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 shrink-0 rounded-full bg-blue-50 flex items-center justify-center relative shadow-[0_0_0_15px_rgba(239,246,255,0.5),0_0_0_30px_rgba(239,246,255,0.2)]">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white z-10 shadow-lg">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">ШІ Голосовий Тьютор</h2>
                    <p className="text-gray-600 text-[15px] leading-relaxed mb-5">
                      Потребуєте детального пояснення помилок? Активуйте ШІ-Тьютора для голосового розбору ваших відповідей у "Тесті #4". Він також може придумати нові адаптивні запитання на основі ваших відповідей для глибшого розуміння.
                    </p>
                    <button className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors inline-flex items-center gap-2 text-sm shadow-sm">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                      Активувати голосовий розбір
                    </button>
                  </div>
                </div>
              </section>

              {/* New Section 2: AI Reinforcement Tests */}
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">ШІ-тести для закріплення</h2>
                <p className="text-gray-600 text-[15px] mb-6">Автоматичний генерований матери тестам основі найчастіших ваших помилок.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 rounded-lg text-primary">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">Тест для повторення:<br/>Регуляризація &<br/>Градієнтний спуск</h3>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-4 mb-6">На основі ваших останніх помилок</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm text-gray-900 mb-2 font-medium">
                        <span>Прогрес: 0/15</span>
                        <span className="text-gray-400 font-normal">0/15</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6"></div>
                      
                      <button className="w-full bg-[#1e5dd8] hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors text-sm">
                        Генерувати і почати
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {/* no icon on second card in design */}
                          <h3 className="font-bold text-gray-900 text-lg leading-tight ml-2">Тест для повторення:<br/>Конфігурація Нейромереж</h3>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-4 mb-6 ml-2">На основі ваших останніх помилок</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm text-gray-900 mb-2 font-medium">
                        <span className="ml-2">Прогрес: 0/15</span>
                        <span className="text-gray-400 font-normal">0/15</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-6"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* New Section 3: Teacher Monitoring Panel */}
              <section className="mt-12 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Учительська Панель Моніторингу Прогресу</h2>
                <p className="text-gray-600 text-[15px] mb-6">Подивися таблиці класу групи:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-6">Поточний прогрес групи</h3>
                    <div className="h-64 w-full">
                      {/* Simplified mock of the stacked bar chart */}
                      <div className="flex h-full items-end gap-4 px-2 pb-6 relative pt-4">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 w-6 font-medium">
                          <span>125</span><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                        </div>
                        <div className="absolute left-8 right-0 top-0 bottom-6 border-b border-gray-100">
                            {/* grid lines */}
                            <div className="border-b border-gray-50 h-1/5"></div>
                            <div className="border-b border-gray-50 h-1/5"></div>
                            <div className="border-b border-gray-50 h-1/5"></div>
                            <div className="border-b border-gray-50 h-1/5"></div>
                        </div>
                        
                        <div className="flex justify-around items-end w-full h-full ml-8 z-10 gap-2">
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[20%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[25%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[35%] rounded-b-sm"></div>
                          </div>
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[30%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[20%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[25%] rounded-b-sm"></div>
                          </div>
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[15%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[40%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[35%] rounded-b-sm"></div>
                          </div>
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[25%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[35%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[15%] rounded-b-sm"></div>
                          </div>
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[10%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[45%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[40%] rounded-b-sm"></div>
                          </div>
                          <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                            <div className="w-full bg-[#f97316] h-[35%] rounded-t-sm"></div>
                            <div className="w-full bg-[#22c55e] h-[25%]"></div>
                            <div className="w-full bg-[#1e5dd8] h-[25%] rounded-b-sm"></div>
                          </div>
                        </div>

                        <div className="absolute left-8 right-0 bottom-0 flex justify-around text-xs text-gray-400 font-medium">
                          <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-4">ШІ-рекомендації для<br/>повторення вчителем</h3>
                    <p className="text-gray-800 text-[15px] mb-8 font-medium">Основи до групи-wide слабкостей в групах.</p>
                    
                    <ul className="space-y-4 flex-1">
                      <li className="flex items-start gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-2 shrink-0"></span>
                        <span className="text-[15px] text-gray-800 font-medium leading-relaxed">ШІ-рекомендації для повторення<br/>вчителем "Регуляризація<br/>поведінки"</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentView === 'checking' && (
            <div className="animate-in fade-in duration-300">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Перевірка текстів та Аналіз</h1>
              
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column: Required Checks */}
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">Результати тестів</h2>
                  
                  {results.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-100">
                      Ще немає зданих тестів.
                    </div>
                  ) : results.map((result, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-white rounded-2xl p-5 shadow-sm border ${selectedGradingResult === result.id ? 'border-[#1e5dd8] ring-1 ring-[#1e5dd8]' : 'border-gray-100 hover:border-gray-200 cursor-pointer'} transition-all flex flex-col justify-between`}
                      onClick={() => { if(selectedGradingResult !== result.id) setSelectedGradingResult(result.id); }}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 rounded-lg text-primary">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-gray-900 text-base">{result.course_title}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-400">{new Date(result.submitted_at).toLocaleDateString()}</span>
                        </div>
                        
                        <h3 className="font-bold text-gray-900 text-lg mb-2">{result.test_title}</h3>
                        <p className="text-gray-600 text-sm mb-4 font-medium flex justify-between">
                          <span>Студент Логін: {result.student_id}</span>
                          <span className="text-[#1e5dd8] font-bold text-lg">{result.score}/{result.total_questions}</span>
                        </p>
                      </div>

                      {selectedGradingResult === result.id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Результуюча Оцінка (у %)</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] outline-none transition-all" 
                            defaultValue={Math.round((result.score/result.total_questions)*100)} 
                          />
                          <label className="block text-sm font-bold text-gray-700 mb-1.5">Коментар / Відгук</label>
                          <textarea 
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-4 h-24 resize-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] outline-none transition-all" 
                            placeholder="Напишіть відгук студенту щодо його помилок..."
                          ></textarea>
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedGradingResult(null); }} 
                              className="px-4 py-2 font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors border border-transparent"
                            >
                              Скасувати
                            </button>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                alert('Оцінку та коментар збережено та надіслано студенту!'); 
                                setSelectedGradingResult(null); 
                              }} 
                              className="px-5 py-2 font-bold bg-[#1e5dd8] hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                            >
                              Зберегти Оцінку
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Right Column: AI Auto Grade */}
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-gray-900">ШІ-Премодерація Здач</h2>
                  
                  <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-200 h-[calc(112px+224px+1.5rem)] flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100/50 rounded-lg text-green-700">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-900 text-base leading-tight">Автоперевірка завершена<br/>Тест #4: Нейромережі</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <span className="text-gray-600">Опрацьовано: </span>
                      <span className="font-bold text-green-600 text-lg">45/45 робіт</span>
                    </div>
                    
                    <div className="space-y-4 text-gray-800 border-t border-green-200/60 pt-6 flex-1">
                      <p className="font-semibold text-[15px]">Огляд від ШІ:</p>
                      <p className="text-[15px] leading-relaxed">Системно проаналізувавши здачі, середній бал групи становить 82/100.</p>
                      <p className="text-[15px] leading-relaxed mb-4">Слабкі місця виявлено у питанні №7 (регуляризація L2) — 40% помилок серед студентів.</p>
                      <div className="bg-white/60 p-3 rounded-lg border border-green-200/50">
                        <p className="font-medium text-[15px] text-green-800">Рекомендація: Зробити детальний розбір L2 на лекції завтра.</p>
                      </div>
                    </div>
                    
                    <button className="w-full bg-white border-2 border-green-300 hover:bg-green-100 text-green-700 font-bold py-3 mt-4 rounded-xl transition-colors shrink-0">
                      Затвердити оцінки в журнал
                    </button>
                  </div>
                </div>
              </div>

               {/* Teacher Monitoring Panel */}
               <section className="mt-12 mb-8">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Загальний Прогрес Студентів</h2>
                    <p className="text-gray-600 text-[15px]">Панель моніторингу успішності класів за останні місяці:</p>
                  </div>
                  <button className="text-[#1e5dd8] font-bold hover:underline hidden sm:block">Експорт звіту →</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-6">
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 text-lg mb-6">Поточний прогрес групи А-1</h3>
                    <div className="h-64 w-full">
                       {/* Simplified mock of the stacked bar chart */}
                       <div className="flex h-full items-end gap-4 px-2 pb-6 relative pt-4">
                         {/* Y-axis labels */}
                         <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-gray-400 w-6 font-medium">
                           <span>125</span><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                         </div>
                         <div className="absolute left-8 right-0 top-0 bottom-6 border-b border-gray-100">
                             {/* grid lines */}
                             <div className="border-b border-gray-50 h-1/5"></div>
                             <div className="border-b border-gray-50 h-1/5"></div>
                             <div className="border-b border-gray-50 h-1/5"></div>
                             <div className="border-b border-gray-50 h-1/5"></div>
                         </div>
                         
                         <div className="flex justify-around items-end w-full h-full ml-8 z-10 gap-2">
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[20%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[25%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[35%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[30%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[20%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[25%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[15%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[40%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[35%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[25%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[35%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[15%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[10%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[45%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[40%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                           <div className="w-full max-w-[40px] flex flex-col justify-end h-full group">
                             <div className="w-full bg-[#f97316] h-[35%] rounded-t-sm group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#22c55e] h-[25%] group-hover:opacity-80 transition-opacity"></div>
                             <div className="w-full bg-[#1e5dd8] h-[25%] rounded-b-sm group-hover:opacity-80 transition-opacity"></div>
                           </div>
                         </div>

                         <div className="absolute left-8 right-0 bottom-0 flex justify-around text-xs text-gray-400 font-medium pt-2">
                           <span>Вер</span><span>Жов</span><span>Лис</span><span>Гру</span><span>Січ</span><span>Лют</span>
                         </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-4">Аналіз Групи (ШІ)</h3>
                    <p className="text-gray-800 text-[15px] mb-8 font-medium">Ключові патерни серед студентів:</p>
                    
                    <ul className="space-y-5 flex-1 overflow-y-auto pr-2">
                      <li className="flex items-start gap-3 pb-4 border-b border-gray-50">
                        <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-bold text-gray-900 mb-0.5">Високий ризик відрахування</span>
                           <span className="text-[13px] text-gray-600 leading-relaxed">3 студенти не здали останні 4 роботи.</span>
                        </div>
                      </li>
                      <li className="flex items-start gap-3 pb-4 border-b border-gray-50">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                        <div className="flex flex-col">
                           <span className="text-[14px] font-bold text-gray-900 mb-0.5">Покращення динаміки</span>
                           <span className="text-[13px] text-gray-600 leading-relaxed">Група Б-2 підвищила успішність на 12%.</span>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
               </section>
            </div>
          )}

          {currentView === 'students' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                 <h1 className="text-3xl font-bold text-gray-900">Студенти та Групи</h1>
                 <div className="bg-white border border-gray-200 rounded-lg p-1 hidden md:flex text-sm font-medium">
                    <button className="px-4 py-1.5 bg-blue-50 text-primary rounded-md">Мої Групи</button>
                    <button className="px-4 py-1.5 text-gray-500 hover:text-gray-900">Всі Студенти</button>
                 </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                 <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="relative w-full max-w-sm">
                       <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                       <input 
                         type="text" 
                         placeholder="Пошук студента..." 
                         className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] text-sm"
                       />
                    </div>
                    <button className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                       </svg>
                       Фільтр
                    </button>
                 </div>
                 
                 <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse text-sm">
                       <thead>
                          <tr className="border-b border-gray-100 text-gray-500 bg-white">
                             <th className="font-semibold py-4 px-6 uppercase text-xs tracking-wider">Студент</th>
                             <th className="font-semibold py-4 px-6 uppercase text-xs tracking-wider">Група</th>
                             <th className="font-semibold py-4 px-6 uppercase text-xs tracking-wider">Успішність</th>
                             <th className="font-semibold py-4 px-6 uppercase text-xs tracking-wider">Останній вхід</th>
                             <th className="font-semibold py-4 px-6 uppercase text-xs tracking-wider text-right">Дії</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                          <tr className="hover:bg-gray-50/50 transition-colors">
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">ІП</div>
                                   <div>
                                      <div className="font-bold text-gray-900">Іван Петренко</div>
                                      <div className="text-xs text-gray-500">ivan.p@student.ua</div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-gray-700 font-medium">А-1</td>
                             <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                   Висока (92%)
                                </span>
                             </td>
                             <td className="py-4 px-6 text-gray-500">Сьогодні, 10:45</td>
                             <td className="py-4 px-6 text-right">
                                <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-blue-50">
                                   <MoreVertical className="w-4 h-4" />
                                </button>
                             </td>
                          </tr>
                          <tr className="hover:bg-gray-50/50 transition-colors">
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">МК</div>
                                   <div>
                                      <div className="font-bold text-gray-900">Марія Коваленко</div>
                                      <div className="text-xs text-gray-500">maria.k@student.ua</div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-gray-700 font-medium">А-1</td>
                             <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                   Середня (75%)
                                </span>
                             </td>
                             <td className="py-4 px-6 text-gray-500">Вчора, 18:20</td>
                             <td className="py-4 px-6 text-right">
                                <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-blue-50">
                                   <MoreVertical className="w-4 h-4" />
                                </button>
                             </td>
                          </tr>
                          <tr className="hover:bg-gray-50/50 transition-colors">
                             <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">ОС</div>
                                   <div>
                                      <div className="font-bold text-gray-900">Олег Сидоренко</div>
                                      <div className="text-xs text-red-500 font-medium w-full flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Увага ШІ
                                      </div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-4 px-6 text-gray-700 font-medium">Б-2</td>
                             <td className="py-4 px-6">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                   Критична (45%)
                                </span>
                             </td>
                             <td className="py-4 px-6 text-gray-500">5 днів тому</td>
                             <td className="py-4 px-6 text-right">
                                <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-blue-50">
                                   <MoreVertical className="w-4 h-4" />
                                </button>
                             </td>
                          </tr>
                       </tbody>
                    </table>
                 </div>
                  <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>Показано 3 з 34 студентів</span>
                    <div className="flex items-center gap-2">
                       <button className="px-2 py-1 rounded hover:bg-gray-100 text-gray-400 cursor-not-allowed">Назад</button>
                       <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">1</span>
                       <button className="px-2 py-1 rounded hover:bg-gray-100">2</button>
                       <button className="px-2 py-1 rounded hover:bg-gray-100">3</button>
                       <button className="px-2 py-1 rounded hover:bg-gray-100">Далі</button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {isActivityModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
               <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 p-6 xl:p-8 relative">
                 <button 
                   onClick={() => setIsActivityModalOpen(false)}
                   className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors"
                 >
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                 </button>
                 <h2 className="text-3xl font-bold text-gray-900 mb-8">Додати Активність</h2>
                 
                 <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-bold text-gray-900 mb-2">Назва активності</label>
                       <input 
                         type="text" 
                         value={activityForm.title}
                         onChange={e => setActivityForm({...activityForm, title: e.target.value})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-all"
                         placeholder="Введіть назву..."
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-bold text-gray-900 mb-2">Тип активності</label>
                       <select 
                         value={activityForm.type}
                         onChange={e => setActivityForm({...activityForm, type: e.target.value})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-all"
                       >
                         <option value="pdf">PDF Документ</option>
                         <option value="test">Тест</option>
                         <option value="essay">Есе (відкрита відповідь)</option>
                       </select>
                     </div>
                   </div>
                   
                   <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Опис (опціонально)</label>
                     <textarea 
                       value={activityForm.description}
                       onChange={e => setActivityForm({...activityForm, description: e.target.value})}
                       className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-all"
                       placeholder="Короткий опис або інструкція..."
                     ></textarea>
                   </div>
                   
                   <hr className="border-gray-100 my-8"/>

                   {/* PDF Upload Section */}
                   {activityForm.type === 'pdf' && (
                     <div>
                       <label className="block text-sm font-bold text-gray-900 mb-2">Файл PDF</label>
                       <input 
                         type="file" 
                         accept=".pdf"
                         onChange={e => setActivityForm({...activityForm, pdfFile: e.target.files[0]})}
                         className="w-full p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20"
                       />
                     </div>
                   )}

                   {/* Essay Details Section */}
                   {activityForm.type === 'essay' && (
                     <div>
                       <label className="block text-sm font-bold text-gray-900 mb-2">Завдання до есе</label>
                       <textarea 
                         value={activityForm.essayPrompt}
                         onChange={e => setActivityForm({...activityForm, essayPrompt: e.target.value})}
                         className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-all"
                         placeholder="Опишіть, що саме студент повинен написати..."
                       ></textarea>
                     </div>
                   )}

                   {/* Test Creation Section */}
                   {activityForm.type === 'test' && (
                     <>
                       <div className="mb-4">
                         <label className="block text-sm font-bold text-gray-900 mb-2">Обмеження часу (хв)</label>
                         <input 
                           type="number" 
                           value={activityForm.timeLimit}
                           onChange={e => setActivityForm({...activityForm, timeLimit: parseInt(e.target.value)})}
                           className="w-full sm:w-1/2 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-all"
                         />
                       </div>
                       
                       <div className="flex items-center justify-between mb-6">
                         <h2 className="text-xl font-bold text-gray-900">Запитання</h2>
                         <button 
                           onClick={() => setActivityForm(prev => ({
                             ...prev, 
                             questions: [...prev.questions, { question_text: '', options: [{text: '', is_correct: true}, {text: '', is_correct: false}] }]
                           }))}
                           className="px-4 py-2 bg-blue-50 text-blue-600 font-bold rounded-lg hover:bg-blue-100 transition-colors text-sm"
                         >
                           + Додати запитання
                         </button>
                       </div>

                       <div className="space-y-8">
                         {activityForm.questions.map((q, qIndex) => (
                           <div key={qIndex} className="p-6 border border-gray-200 rounded-xl bg-gray-50/50">
                             <div className="flex justify-between items-start mb-4">
                                <span className="font-bold text-gray-900">Запитання {qIndex + 1}</span>
                                {activityForm.questions.length > 1 && (
                                  <button 
                                    onClick={() => setActivityForm(prev => ({
                                       ...prev,
                                       questions: prev.questions.filter((_, i) => i !== qIndex)
                                    }))}
                                    className="text-rose-500 text-sm hover:underline font-bold"
                                  >
                                    Видалити
                                  </button>
                                )}
                             </div>
                             <input 
                               type="text" 
                               value={q.question_text}
                               onChange={e => {
                                 const newQs = [...activityForm.questions];
                                 newQs[qIndex].question_text = e.target.value;
                                 setActivityForm({...activityForm, questions: newQs});
                               }}
                               className="w-full p-3 mb-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8]"
                               placeholder="Введіть текст запитання..."
                             />
                             
                             <div className="space-y-3 pl-4">
                                {q.options.map((opt, oIndex) => (
                                  <div key={oIndex} className="flex items-center gap-3">
                                    <input 
                                      type="radio" 
                                      name={`correct-${qIndex}`} 
                                      checked={opt.is_correct}
                                      onChange={() => {
                                        const newQs = [...activityForm.questions];
                                        newQs[qIndex].options.forEach((o, i) => o.is_correct = (i === oIndex));
                                        setActivityForm({...activityForm, questions: newQs});
                                      }}
                                      className="w-4 h-4 text-[#1e5dd8] focus:ring-[#1e5dd8]"
                                    />
                                    <input 
                                      type="text"
                                      value={opt.text}
                                      onChange={e => {
                                        const newQs = [...activityForm.questions];
                                        newQs[qIndex].options[oIndex].text = e.target.value;
                                        setActivityForm({...activityForm, questions: newQs});
                                      }}
                                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#1e5dd8]"
                                      placeholder={`Варіант ${oIndex + 1}`}
                                    />
                                    {q.options.length > 2 && (
                                      <button 
                                        onClick={() => {
                                          const newQs = [...activityForm.questions];
                                          newQs[qIndex].options = newQs[qIndex].options.filter((_, i) => i !== oIndex);
                                          setActivityForm({...activityForm, questions: newQs});
                                        }}
                                        className="text-gray-400 hover:text-rose-500"
                                      >×</button>
                                    )}
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    const newQs = [...activityForm.questions];
                                    newQs[qIndex].options.push({text: '', is_correct: false});
                                    setActivityForm({...activityForm, questions: newQs});
                                  }}
                                  className="text-sm text-[#1e5dd8] font-bold hover:underline mt-2 inline-block"
                                >
                                  + Додати варіант
                                </button>
                             </div>
                           </div>
                         ))}
                       </div>
                     </>
                   )}

                   <div className="pt-6 border-t border-gray-100 flex justify-end">
                     <button 
                       onClick={async () => {
                         if (!activityForm.course_id || activityForm.course_id === '') {
                           alert("Помилка: Необхідно обрати курс або зберегти контекст курсу.");
                           return;
                         }

                         try {
                           if (activityForm.type === 'test') {
                             const res = await fetch('http://localhost:3001/api/tests', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({...activityForm, course_id: parseInt(activityForm.course_id)})
                             });
                             const data = await res.json();
                             if (data.success) {
                               alert("Тест успішно створено!");
                               fetch('http://localhost:3001/api/tests').then(r => r.json()).then(data => setTests(data));
                               setIsActivityModalOpen(false);
                             } else {
                               alert("Помилка! Заповніть всі поля.");
                             }
                           } else if (activityForm.type === 'pdf') {
                             if (!activityForm.pdfFile) {
                               alert("Оберіть PDF файл!");
                               return;
                             }
                             const formData = new FormData();
                             formData.append('file', activityForm.pdfFile);
                             const uploadRes = await fetch('http://localhost:3001/api/upload', {
                               method: 'POST',
                               body: formData,
                             });
                             const uploadData = await uploadRes.json();
                             if (uploadData.success) {
                               const res = await fetch('http://localhost:3001/api/activities', {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({
                                   course_id: activityForm.course_id,
                                   type: 'pdf',
                                   title: activityForm.title,
                                   description: activityForm.description,
                                   content: uploadData.filePath
                                 })
                               });
                               const data = await res.json();
                               if (data.success) {
                                 alert("Активність збережено успішно!");
                                 setIsActivityModalOpen(false);
                               }
                             }
                           } else if (activityForm.type === 'essay') {
                             const res = await fetch('http://localhost:3001/api/activities', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({
                                 course_id: activityForm.course_id,
                                 type: 'essay',
                                 title: activityForm.title,
                                 description: activityForm.description,
                                 content: activityForm.essayPrompt
                               })
                             });
                             const data = await res.json();
                             if (data.success) {
                               alert("Есе збережено успішно!");
                               setIsActivityModalOpen(false);
                             }
                           }
                         } catch (err) {
                           console.error(err);
                           alert("Внутрішня помилка сервера.");
                         }
                       }}
                       className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
                     >
                       Зберегти та опублікувати
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {currentView === 'take_test' && selectedTest && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
              <button 
                onClick={() => setCurrentView('course_details')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
              >
                <ChevronDown className="w-5 h-5 rotate-90" /> Назад до курсу
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedTest.title}</h1>
                    <p className="text-gray-500">{selectedTest.description}</p>
                  </div>
                  {selectedTest.timeLimit && (
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-bold">
                      <Clock className="w-5 h-5" />
                      <span>{selectedTest.timeLimit} хв</span>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {testQuestions.map((q, qIndex) => (
                    <div key={q.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/30">
                      <h3 className="font-bold text-lg text-gray-900 mb-4">{qIndex + 1}. {q.question_text}</h3>
                      <div className="space-y-3">
                        {q.options.map(opt => (
                          <label key={opt.id} className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${testAnswers[q.id] === opt.id ? 'border-[#1e5dd8] bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 bg-white'}`}>
                            <input 
                              type="radio" 
                              name={`question-${q.id}`} 
                              value={opt.id}
                              checked={testAnswers[q.id] === opt.id}
                              onChange={() => setTestAnswers({...testAnswers, [q.id]: opt.id})}
                              className="mt-1 w-4 h-4 text-[#1e5dd8] focus:ring-[#1e5dd8]"
                            />
                            <span className="text-gray-800 font-medium">{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={submitTest}
                    className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
                  >
                    Завершити тест
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === 'take_essay' && selectedTest && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
              <button 
                onClick={() => {
                   setCurrentView('course_details');
                   setEssayContent('');
                }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
              >
                <ChevronDown className="w-5 h-5 rotate-90" /> Назад до курсу
              </button>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedTest.title}</h1>
                    <p className="text-gray-500">{selectedTest.description}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-6 border border-gray-100 rounded-2xl bg-blue-50/50">
                    <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-[#1e5dd8]" /> Завдання:</h3>
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedTest.content}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Ваша відповідь:</h3>
                    <textarea 
                      value={essayContent}
                      onChange={e => setEssayContent(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e5dd8]/20 focus:border-[#1e5dd8] transition-colors resize-none h-64"
                      placeholder="Напишіть своє есе тут..."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button 
                    onClick={submitEssay}
                    className="bg-[#1e5dd8] hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-sm"
                  >
                    Завершити та відправити
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        {isRightSidebarOpen && (
        <aside className="w-72 bg-white border-l border-border xl:flex flex-col sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto">
          <div className="p-6 flex-1 bg-gray-50/50 overflow-y-auto">
            {role === 'student' ? (
              <>
                <h3 className="font-bold text-gray-900 text-lg mb-5">Майбутні дедлайни</h3>
                
                <div className="space-y-4">
                  <div className="flex gap-4 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="p-2 bg-orange-100 text-orange-500 rounded-lg mt-0.5 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5 font-medium">Тест: Машинне навчання</div>
                        <div className="font-bold text-gray-900 text-sm">До 25 Жовтня</div>
                      </div>
                  </div>
                  
                  <div className="flex gap-4 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="p-2 bg-red-100 text-red-500 rounded-lg mt-0.5 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5 font-medium">Фінальний проєкт</div>
                        <div className="font-bold text-gray-900 text-sm">Сьогодні до 23:59</div>
                      </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 text-lg mb-5">Сповіщення</h3>
                <div className="space-y-3">
                  {results.slice(0, 4).map((r, i) => (
                    <button 
                      key={i}
                      onClick={() => setCurrentView('checking')}
                      className="w-full text-left flex gap-3 items-start bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-[#1e5dd8]/30 hover:shadow transition-all group"
                    >
                      <div className="p-2 bg-blue-50 text-[#1e5dd8] rounded-lg mt-0.5 shrink-0 group-hover:bg-[#1e5dd8] group-hover:text-white transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-xs text-gray-500 mb-0.5 font-medium truncate">Новий тест здано</div>
                        <div className="font-bold text-gray-900 text-[13px] leading-tight mb-1">{r.test_title}</div>
                        <div className="text-xs text-gray-400">Студент Логін: {r.student_id}</div>
                      </div>
                    </button>
                  ))}
                  {results.length === 0 && (
                    <div className="text-center py-4 text-xs text-gray-500">Немає нових сповіщень.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
        )}
      </div>

      {/* Global Footer */}
      <footer className="bg-[#121c32] text-white py-12 px-8 mt-auto rounded-t-[2rem] mx-4 md:mx-0 md:rounded-none">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <BookA className="w-8 h-8 text-white" />
              <span className="text-xl font-bold tracking-tight">LearnAI<br/>Portal</span>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Навігація</h4>
            <ul className="space-y-3 text-gray-400 text-[15px]">
              <li><a href="#" className="hover:text-white transition-colors">Курси</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Тести</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Оцінки</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Налаштування</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Ресурси</h4>
            <ul className="space-y-3 text-gray-400 text-[15px]">
              <li><a href="#" className="hover:text-white transition-colors">Документація ШІ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Бібліотека</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Блог</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">ШІ-сервіси</h4>
            <ul className="space-y-3 text-gray-400 text-[15px]">
              <li><a href="#" className="hover:text-white transition-colors">Тренування моделей</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Аналітика</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Голосовий Тьютор</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-4">Контакти</h4>
            <ul className="space-y-3 text-gray-400 text-[15px]">
              <li><a href="#" className="hover:text-white transition-colors">Підтримка</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Співпраця</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Преса</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-gray-700/50 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
          <p>© 2024 LearnAI Portal. Штучний інтелект патентовано для освіти.</p>
        </div>
      </footer>

      {/* AI Voice Tutor Modal */}
      {isAiTutorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAiTutorModalOpen(false)}></div>
          
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setIsAiTutorModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                <BrainCircuit className="w-8 h-8" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ШІ Голосовий Тьютор</h2>
              <p className="text-gray-500 text-[15px] mb-10 px-4 leading-relaxed">
                Натисніть на мікрофон та почніть говорити. Я готовий пояснити будь-яку тему чи розібрати ваші помилки.
              </p>

              {/* Pulsing Microphone Button */}
              <div className="relative mb-8">
                {/* Pulse animations */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                <div className="absolute inset-[-20px] rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                
                <button className="relative w-28 h-28 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_40px_rgba(30,93,216,0.5)] hover:bg-blue-700 hover:scale-105 transition-all duration-300">
                  <Mic className="w-10 h-10" />
                </button>
              </div>

              <div className="text-sm font-bold text-primary animate-pulse">
                Слухаю...
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
              <p className="text-xs text-gray-400 font-medium">Говоріть чітко. Використовуйте українську мову для кращих результатів.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
