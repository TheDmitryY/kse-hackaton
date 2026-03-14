import { useState } from 'react'
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
  BookA
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
  const chartData = [
    { name: 'Mon', score: 20 },
    { name: 'Tue', score: 45 },
    { name: 'Wed', score: 40 },
    { name: 'Thu', score: 65 },
    { name: 'Fri', score: 55 },
    { name: 'Sat', score: 90 },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-sm text-text-secondary">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-border shadow-sm z-10">
        <div className="flex items-center gap-2">
          <BookA className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold text-text-primary tracking-tight">LearnAI Portal</span>
        </div>
        <nav className="hidden md:flex items-center gap-6 font-medium text-base">
          <a href="#" className="hover:text-primary transition-colors hover:bg-gray-50 px-2 py-1 rounded">Home</a>
          <a href="#" className="hover:text-primary transition-colors hover:bg-gray-50 px-2 py-1 rounded">Courses</a>
          <a href="#" className="text-primary border-b-2 border-primary pb-1 font-semibold">Tests</a>
          <a href="#" className="hover:text-primary transition-colors hover:bg-gray-50 px-2 py-1 rounded">Grades</a>
          <a href="#" className="hover:text-primary transition-colors hover:bg-gray-50 px-2 py-1 rounded">Profile</a>
        </nav>
        <div className="flex items-center gap-3">
          <img src="https://i.pravatar.cc/150?u=123" alt="User Avatar" className="w-9 h-9 rounded-full border border-gray-200" />
          <span className="font-medium text-text-primary hidden sm:block">Олексій П.</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-border flex flex-col hidden lg:flex">
          <div className="p-4 py-6 text-xs uppercase font-bold text-gray-400 tracking-wider">Teacher</div>
          <nav className="flex-1 px-3 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <BookOpen className="w-5 h-5" />
              <span className="font-medium">Курси</span>
            </a>
            <a href="#" className="flex items-start gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <BrainCircuit className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium block">Тренування ШІ</span>
                <span className="text-xs text-gray-400">Materials, set kritepia</span>
              </div>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-primary font-medium">
              <FileText className="w-5 h-5" />
              <span>Тести</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">Студенти</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              <BarChart className="w-5 h-5" />
              <span className="font-medium">Звіти</span>
            </a>
          </nav>
        </aside>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6 md:p-8 bg-[#f4f7fe]">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Тести та Аналіз LearnAI</h1>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Left Column: Current Tests */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Поточні тести</h2>
              
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg text-primary">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">Основи Машинного<br/>Навчання</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-4">Тест #4: Нейромережі</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-medium">
                    <span>Progress</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-accent h-1.5 rounded-full w-3/4"></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-medium">
                  <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> 2 дні</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4"/> 60 хв</div>
                  <div className="flex items-center gap-1.5"><Hourglass className="w-4 h-4"/> 20 завдань</div>
                </div>
                
                <button className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 rounded-xl transition-colors">
                  ПОЧАТИ ТЕСТ
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                 <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 rounded-lg text-orange-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-gray-900 text-base">Історія України</span>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Тест #2</h3>
              </div>
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
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-white border-l border-border hidden xl:flex flex-col">
          <div className="p-4 py-5 bg-blue-50/50 border-b border-border">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Teacher's view
            </span>
          </div>
          
          <div className="p-6 border-b border-border">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Ваш Прогрес</h3>
            <div className="h-40 w-full -ml-4">
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
          
          <div className="p-6 flex-1 bg-gray-50/50">
            <h3 className="font-bold text-gray-900 text-lg mb-5">Upcoming deadlines</h3>
            
            <div className="space-y-4">
               <div className="flex gap-4 items-start">
                  <div className="p-2 bg-orange-100 text-orange-500 rounded-lg mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5 font-medium">Завдання</div>
                    <div className="font-bold text-gray-900">2 сентябег 2</div>
                  </div>
               </div>
               
               <div className="flex gap-4 items-start">
                  <div className="p-2 bg-gray-100 text-gray-500 rounded-lg mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5 font-medium">Початок</div>
                    <div className="font-bold text-gray-900">20 завдань</div>
                  </div>
               </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
