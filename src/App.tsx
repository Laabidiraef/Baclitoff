import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, ChevronDown, CircleUserRound,
  Clock3, Download, ExternalLink, Facebook, FileText, Globe2, Heart, Instagram,
  Lightbulb, Menu, MessageCircle, Search, Share2, Sparkles, Target, X, Youtube,
} from 'lucide-react';
import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const logoPath = '/baclit-logo.svg';

type Subject = { id: string; name: string; label: string; icon: string; accent: string };
type Resource = { id: string; title: string; subject: string; type: 'Résumé' | 'Méthode' | 'Quiz' | 'Sujet Bac'; description: string; date: string; file?: string };

type View = 'home' | 'resources' | 'quiz' | 'about' | 'profile' | 'subject';

const subjects: Subject[] = [
  { id: 'arabic', name: 'العربية', label: 'Arabe', icon: 'أ', accent: 'gold' },
  { id: 'french', name: 'الفرنسية', label: 'Français', icon: 'F', accent: 'brown' },
  { id: 'english', name: 'الإنجليزية', label: 'English', icon: 'E', accent: 'olive' },
  { id: 'philosophy', name: 'الفلسفة', label: 'Philosophie', icon: 'ف', accent: 'ink' },
  { id: 'history', name: 'التاريخ', label: 'Histoire', icon: 'ت', accent: 'rust' },
  { id: 'geography', name: 'الجغرافيا', label: 'Géographie', icon: 'ج', accent: 'sand' },
  { id: 'islamic', name: 'التربية الإسلامية', label: 'Éducation islamique', icon: 'ت', accent: 'sage' },
];

const resources: Resource[] = [
  { id: 'ar-method', title: 'كيفاش تبني مقال عربي مرتب؟', subject: 'arabic', type: 'Méthode', description: 'خطوات بسيطة باش تنظّم أفكارك وتكتب بإقناع.', date: 'منذ يومين' },
  { id: 'fr-summary', title: 'Les figures de style — résumé', subject: 'french', type: 'Résumé', description: 'ملخّص واضح لأهم figures de style مع أمثلة.', date: 'منذ 4 أيام' },
  { id: 'phil-quiz', title: 'مدخل للفلسفة', subject: 'philosophy', type: 'Quiz', description: 'جرّب روحك في أسئلة قصيرة ومركّزة.', date: 'منذ أسبوع' },
  { id: 'history-bac', title: 'Sujet Bac 2023 — تاريخ', subject: 'history', type: 'Sujet Bac', description: 'موضوع باك للتدرّب، مع مساحة باش تراجع إجابتك.', date: 'منذ أسبوعين', file: '#' },
  { id: 'geo-summary', title: 'التنمية والتفاوتات', subject: 'geography', type: 'Résumé', description: 'أهم المفاهيم والأفكار في ورقة مراجعة واحدة.', date: 'منذ 3 أسابيع' },
  { id: 'eng-method', title: 'Writing an argument paragraph', subject: 'english', type: 'Méthode', description: 'طريقة عملية لكتابة فقرة منظّمة بالإنجليزية.', date: 'منذ شهر' },
];

const quizQuestions = [
  { question: 'شنوة الفكرة الرئيسية من مقدّمة المقال؟', options: ['تزيين النص', 'تقديم الموضوع والإشكالية', 'ختم المقال', 'إضافة مثال'], answer: 1 },
  { question: 'أي عنصر يساعد أكثر في تنظيم فقرة؟', options: ['فكرة + شرح + مثال', 'عنوان فقط', 'جملة طويلة', 'تكرار نفس الفكرة'], answer: 0 },
  { question: 'كيفاش نراجع بفاعلية قبل الباك؟', options: ['نستنى لآخر نهار', 'نحفظ كل شيء مرة وحدة', 'نقسّم وقتي ونجرّب روحي', 'نراجع كان السهل'], answer: 2 },
];

const subjectName = (id: string) => subjects.find((subject) => subject.id === id)?.name ?? id;

function App() {
  const [view, setView] = useState<View>('home');
  const [resourceType, setResourceType] = useState<Resource['type'] | 'Tous'>('Tous');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const filteredResources = useMemo(() => resources.filter((resource) => {
    const matchesType = resourceType === 'Tous' || resource.type === resourceType;
    const matchesSubject = !selectedSubject || resource.subject === selectedSubject;
    const searchText = `${resource.title} ${resource.description} ${subjectName(resource.subject)}`.toLowerCase();
    return matchesType && matchesSubject && searchText.includes(query.toLowerCase());
  }), [query, resourceType, selectedSubject]);

  const navigate = (nextView: View, nextSubject?: string) => {
    setView(nextView);
    setMobileMenu(false);
    if (nextSubject) setSelectedSubject(nextSubject);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openResource = (resource: Resource) => {
    setHistory((current) => [resource.id, ...current.filter((id) => id !== resource.id)].slice(0, 5));
    if (session && supabase) {
      void supabase.from('baclit_history').upsert({ resource_id: resource.id, resource_title: resource.title, resource_type: resource.type, subject: resource.subject }, { onConflict: 'user_id,resource_id' });
    }
  };

  const toggleFavorite = (resource: Resource) => {
    if (!session) { setAuthOpen(true); return; }
    const isSaved = saved.includes(resource.id);
    setSaved((current) => isSaved ? current.filter((id) => id !== resource.id) : [...current, resource.id]);
    if (supabase) {
      if (isSaved) void supabase.from('baclit_favorites').delete().eq('resource_id', resource.id);
      else void supabase.from('baclit_favorites').insert({ resource_id: resource.id, resource_title: resource.title, resource_type: resource.type, subject: resource.subject });
    }
  };

  const handleAuth = async (event: FormEvent) => {
    event.preventDefault();
    setAuthMessage('');
    if (!supabase) { setAuthMessage('الحسابات باش تكون متاحة قريب.'); return; }
    const result = authMode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) { setAuthMessage('ما نجّمش نكمّل العملية. ثبّت الإيميل وكلمة السر وعاود جرّب.'); return; }
    setAuthMessage(authMode === 'signup' ? 'حسابك تخلق. مرحبا بيك في BACLIT.' : 'مرحبا بيك من جديد.');
    setTimeout(() => setAuthOpen(false), 800);
  };

  const answerQuiz = (answer: number) => {
    const answers = [...quizAnswers];
    answers[quizStep] = answer;
    setQuizAnswers(answers);
    if (quizStep === quizQuestions.length - 1) setQuizDone(true);
    else setQuizStep((step) => step + 1);
  };

  const resetQuiz = () => { setQuizStep(0); setQuizAnswers([]); setQuizDone(false); };
  const score = quizAnswers.filter((answer, index) => answer === quizQuestions[index].answer).length;

  return (
    <div className="app-shell" dir="rtl">
      <header className="site-header">
        <div className="container nav-wrap">
          <button className="brand" onClick={() => navigate('home')} aria-label="BACLIT Accueil">
            <img src={logoPath} alt="BACLIT" className="brand-logo" />
            <span className="brand-fallback">BACLIT <small>Réussir, autrement.</small></span>
          </button>
          <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="القائمة">{mobileMenu ? <X /> : <Menu />}</button>
          <nav className={`main-nav ${mobileMenu ? 'is-open' : ''}`}>
            <button className={view === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Accueil</button>
            <button onClick={() => { setResourceType('Résumé'); navigate('resources'); }}>Résumés</button>
            <button onClick={() => { setResourceType('Méthode'); navigate('resources'); }}>Méthodes & Conseils</button>
            <button onClick={() => navigate('quiz')}>Quiz</button>
            <button onClick={() => { setResourceType('Sujet Bac'); navigate('resources'); }}>Sujets Bac</button>
            <button onClick={() => navigate('about')}>À propos</button>
          </nav>
          <button className="account-link" onClick={() => session ? navigate('profile') : setAuthOpen(true)}>{session ? <CircleUserRound size={18} /> : <CircleUserRound size={18} />}<span>{session ? 'حسابي' : 'Connexion'}</span></button>
        </div>
      </header>

      <main>
        {view === 'home' && <Home navigate={navigate} setQuery={setQuery} setResourceType={setResourceType} setSelectedSubject={setSelectedSubject} />}
        {view === 'resources' && <ResourceLibrary query={query} setQuery={setQuery} resourceType={resourceType} setResourceType={setResourceType} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} resources={filteredResources} saved={saved} onOpen={openResource} onFavorite={toggleFavorite} navigate={navigate} />}
        {view === 'subject' && <SubjectPage subject={selectedSubject} navigate={navigate} setResourceType={setResourceType} />}
        {view === 'quiz' && <QuizView quizStep={quizStep} quizDone={quizDone} score={score} answers={quizAnswers} answerQuiz={answerQuiz} resetQuiz={resetQuiz} navigate={navigate} />}
        {view === 'about' && <About navigate={navigate} />}
        {view === 'profile' && <Profile session={session} saved={saved} history={history} resources={resources} navigate={navigate} onFavorite={toggleFavorite} />}
      </main>

      <footer className="site-footer"><div className="container footer-grid"><div><div className="footer-brand"><img src={logoPath} alt="BACLIT" /><span>BACLIT</span></div><p>هنا تلقى اللي تحتاجو باش تراجع للباك، من غير تعقيد.</p></div><div><h3>تواصل معانا</h3><a href="mailto:Baclit3@gmail.com">Baclit3@gmail.com</a><a href="https://www.tiktok.com/@baclit.tn" target="_blank" rel="noreferrer">TikTok @baclit.tn</a><a href="https://www.facebook.com/profile.php?id=61594206685330" target="_blank" rel="noreferrer">Facebook BACLIT</a></div><div><h3>إبدأ من هنا</h3><button onClick={() => navigate('resources')}>المواد الدراسية <ArrowLeft size={15} /></button><button onClick={() => navigate('quiz')}>جرّب Quiz <ArrowLeft size={15} /></button></div></div><div className="container footer-bottom"><span>© 2026 BACLIT — Bac Lettres Tunisie</span><span>Réussir, autrement.</span></div></footer>

      {authOpen && <div className="modal-backdrop" onMouseDown={() => setAuthOpen(false)}><div className="auth-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setAuthOpen(false)}><X /></button><div className="modal-kicker">BACLIT / espace étudiant</div><h2>{authMode === 'login' ? 'مرحبا بيك' : 'اعمل حسابك'}</h2><p>{authMode === 'login' ? 'ادخل لحسابك باش تحفظ خدمتك وتتبّع تقدّمك.' : 'حساب بسيط باش تحفظ favoris وتلقى historique متاعك.'}</p><form onSubmit={handleAuth}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Mot de passe<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label><button className="primary-button full" type="submit">{authMode === 'login' ? 'Connexion' : 'Créer mon compte'}</button></form><button className="google-button" onClick={() => supabase?.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}>Continuer avec Google</button>{authMessage && <div className="form-message">{authMessage}</div>}<button className="switch-auth" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>{authMode === 'login' ? 'ما عندكش compte؟ اعمل واحد' : 'عندك compte؟ ادخل من هنا'}</button></div></div>}
    </div>
  );
}

function Home({ navigate, setQuery, setResourceType, setSelectedSubject }: { navigate: (view: View, subject?: string) => void; setQuery: (value: string) => void; setResourceType: (value: Resource['type'] | 'Tous') => void; setSelectedSubject: (value: string | null) => void }) {
  const discover = () => { setQuery(''); setResourceType('Tous'); setSelectedSubject(null); navigate('resources'); };
  return <>
    <section className="hero"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="flag-dot" /> أول منصة تونسية مخصّصة للـBac Lettres</div><h1>كل اللي تحتاجو<br /><em>للمراجعة</em> في بلاصة وحدة.</h1><p className="hero-lede">Résumés <span>•</span> Méthodes <span>•</span> Quiz <span>•</span> Sujets Bac</p><p className="hero-description">راجع، جرّب روحك، وحضّر للباك في فضاء معمول على قياسك.</p><div className="hero-actions"><button className="primary-button" onClick={discover}>ابدأ المراجعة <ArrowLeft size={18} /></button><button className="text-button" onClick={() => navigate('about')}>اكتشف BACLIT <ArrowLeft size={17} /></button></div></div><div className="hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="book-card"><BookOpen size={46} /><span>bac<br />lettres</span><small>notes de révision</small></div><div className="art-stamp">2026<br /><small>TUNISIE</small></div></div></div></section>
    <section className="section intro-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">فضاءك للمراجعة</span><h2>شنوة تلقى في BACLIT؟</h2></div><p>كل شيء منظّم باش تلقى اللي تحتاجو بسرعة، وتراجع على طريقتك.</p></div><div className="feature-grid">{[{ icon: <BookOpen />, title: 'Résumés', text: 'راجع أهم النقاط بطريقة واضحة ومنظمة.', action: () => { setResourceType('Résumé'); navigate('resources'); } }, { icon: <Lightbulb />, title: 'Méthodes & Conseils', text: 'تعلّم كيفاش تراجع وتنظّم وقتك وتخدم خير.', action: () => { setResourceType('Méthode'); navigate('resources'); } }, { icon: <Target />, title: 'Quiz', text: 'جرّب روحك وشوف وين وصلت.', action: () => navigate('quiz') }, { icon: <FileText />, title: 'Sujets Bac', text: 'تدرّب على مواضيع الباك وحضّر روحك مليح.', action: () => { setResourceType('Sujet Bac'); navigate('resources'); } }].map((item, index) => <button className={`feature-card feature-${index + 1}`} key={item.title} onClick={item.action}><div className="icon-box">{item.icon}</div><span className="card-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p><span className="card-arrow"><ArrowLeft size={17} /></span></button>)}</div></div></section>
    <section className="section subjects-section"><div className="container"><div className="section-heading centered"><span className="section-kicker">Matières</span><h2>اختار المادة وابدأ راجع</h2><p>سبع مواد، طريق واحد: تحضير منظّم للباك.</p></div><div className="subject-grid">{subjects.map((subject) => <button key={subject.id} className={`subject-card ${subject.accent}`} onClick={() => navigate('subject', subject.id)}><span className="subject-icon">{subject.icon}</span><span><strong>{subject.name}</strong><small>{subject.label}</small></span><ArrowLeft size={18} /></button>)}</div></div></section>
    <section className="section latest-section"><div className="container"><div className="section-heading"><div><span className="section-kicker">يتجدّد ديما</span><h2>آخر الإضافات</h2></div><button className="outline-button" onClick={discover}>شوف الكل <ArrowLeft size={16} /></button></div><div className="latest-list">{resources.slice(0, 4).map((resource) => <article key={resource.id} className="latest-item"><span className="type-pill">{resource.type}</span><div><h3>{resource.title}</h3><p>{subjectName(resource.subject)} · {resource.date}</p></div><ArrowLeft size={17} /></article>)}</div></div></section>
  </>;
}

function ResourceLibrary({ query, setQuery, resourceType, setResourceType, selectedSubject, setSelectedSubject, resources: filtered, saved, onOpen, onFavorite, navigate }: { query: string; setQuery: (value: string) => void; resourceType: Resource['type'] | 'Tous'; setResourceType: (value: Resource['type'] | 'Tous') => void; selectedSubject: string | null; setSelectedSubject: (value: string | null) => void; resources: Resource[]; saved: string[]; onOpen: (resource: Resource) => void; onFavorite: (resource: Resource) => void; navigate: (view: View) => void }) {
  return <section className="page-section"><div className="container"><div className="breadcrumbs"><button onClick={() => navigate('home')}>Accueil</button><span>/</span><strong>{resourceType === 'Tous' ? 'المحتوى' : resourceType}</strong></div><div className="page-title"><div><span className="section-kicker">BACLIT library</span><h1>{resourceType === 'Tous' ? 'المحتوى الكل' : resourceType}</h1><p>لوج، فلتر، واختار اللي يناسب طريقة مراجعتك.</p></div><div className="library-stat"><strong>{filtered.length}</strong><span>موارد موجودة</span></div></div><div className="library-toolbar"><div className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="لوج على اللي تحتاجو بسرعة..." aria-label="البحث" /></div><div className="filter-row"><select value={selectedSubject ?? ''} onChange={(event) => setSelectedSubject(event.target.value || null)} aria-label="المادة"><option value="">كل المواد</option>{subjects.map((subject) => <option value={subject.id} key={subject.id}>{subject.name}</option>)}</select><select value={resourceType} onChange={(event) => setResourceType(event.target.value as Resource['type'] | 'Tous')} aria-label="نوع المحتوى"><option value="Tous">كل الأنواع</option><option value="Résumé">Résumés</option><option value="Méthode">Méthodes</option><option value="Quiz">Quiz</option><option value="Sujet Bac">Sujets Bac</option></select></div></div>{filtered.length ? <div className="resource-grid">{filtered.map((resource) => <ResourceCard key={resource.id} resource={resource} saved={saved.includes(resource.id)} onOpen={onOpen} onFavorite={onFavorite} navigate={navigate} />)}</div> : <div className="empty-state"><Search size={28} /><h2>ما لقيناش اللي تلوّج عليه</h2><p>جرّب كلمة أخرى ولا بدّل الفيلتر.</p><button className="outline-button" onClick={() => { setQuery(''); setResourceType('Tous'); setSelectedSubject(null); }}>نحّي الفيلترات</button></div>}</div></section>;
}

function ResourceCard({ resource, saved, onOpen, onFavorite, navigate }: { resource: Resource; saved: boolean; onOpen: (resource: Resource) => void; onFavorite: (resource: Resource) => void; navigate: (view: View) => void }) {
  const open = () => { onOpen(resource); if (resource.type === 'Quiz') navigate('quiz'); };
  return <article className="resource-card"><div className="resource-card-top"><span className={`type-pill ${resource.type === 'Quiz' ? 'quiz-pill' : ''}`}>{resource.type}</span><button className={`icon-button ${saved ? 'saved' : ''}`} onClick={() => onFavorite(resource)} aria-label="حفظ في المفضلة"><Bookmark size={18} fill={saved ? 'currentColor' : 'none'} /></button></div><div className="resource-icon"><FileText size={22} /></div><h3>{resource.title}</h3><p>{resource.description}</p><div className="resource-meta"><span>{subjectName(resource.subject)}</span><span><Clock3 size={13} /> {resource.date}</span></div><div className="resource-actions"><button className="card-link" onClick={open}>إبدأ المراجعة <ArrowLeft size={16} /></button><button className="share-link" onClick={() => navigator.share?.({ title: resource.title, text: resource.description, url: window.location.href })}><Share2 size={16} /> Partager</button></div></article>;
}

function SubjectPage({ subject, navigate, setResourceType }: { subject: string | null; navigate: (view: View) => void; setResourceType: (value: Resource['type'] | 'Tous') => void }) {
  const current = subjects.find((item) => item.id === subject) ?? subjects[0];
  return <section className="page-section subject-page"><div className="container"><div className="breadcrumbs"><button onClick={() => navigate('home')}>Accueil</button><span>/</span><strong>{current.name}</strong></div><div className="subject-hero"><span className={`subject-icon large ${current.accent}`}>{current.icon}</span><div><span className="section-kicker">Matière</span><h1>{current.name}</h1><p>{current.label} · اختار المحتوى وابدأ راجع على روحك.</p></div></div><div className="subject-content-grid">{(['Résumé', 'Méthode', 'Quiz', 'Sujet Bac'] as Resource['type'][]).map((type) => <button className="subject-content-card" key={type} onClick={() => { setResourceType(type); navigate(type === 'Quiz' ? 'quiz' : 'resources'); }}><span>{type === 'Résumé' ? <BookOpen /> : type === 'Méthode' ? <Lightbulb /> : type === 'Quiz' ? <Target /> : <FileText />}</span><h2>{type === 'Résumé' ? 'Résumés' : type === 'Méthode' ? 'Méthodes & Conseils' : type === 'Quiz' ? 'Quiz' : 'Sujets Bac'}</h2><p>{type === 'Quiz' ? 'جرّب روحك بأسئلة مركّزة.' : 'محتوى مرتب باش تعاونك في المراجعة.'}</p><ArrowLeft /></button>)}</div></div></section>;
}

function QuizView({ quizStep, quizDone, score, answers, answerQuiz, resetQuiz, navigate }: { quizStep: number; quizDone: boolean; score: number; answers: number[]; answerQuiz: (answer: number) => void; resetQuiz: () => void; navigate: (view: View) => void }) {
  const current = quizQuestions[quizStep];
  return <section className="page-section quiz-page"><div className="container narrow"><div className="breadcrumbs"><button onClick={() => navigate('home')}>Accueil</button><span>/</span><strong>Quiz</strong></div><div className="quiz-header"><span className="section-kicker">جرّب روحك</span><h1>Quiz سريع قبل ما تكمّل</h1><p>ثلاثة أسئلة باش تعرف وين وصلت. ما فماش ضغط، عاود جرّب قد ما تحب.</p></div>{quizDone ? <div className="result-card"><div className="result-circle"><strong>{score}</strong><span>/{quizQuestions.length}</span></div><span className="section-kicker">النتيجة متاعك</span><h2>{score === quizQuestions.length ? 'برافو عليك!' : 'مليح، أما تنجم أحسن.'}</h2><p>{score === quizQuestions.length ? 'واضح اللي تحضيرك ماشي في الثنية الصحيحة.' : 'راجع الملخّصات وعاود جرّب روحك.'}</p><div className="quiz-result-actions"><button className="primary-button" onClick={resetQuiz}>عاود الـQuiz</button><button className="outline-button" onClick={() => navigate('resources')}>شوف الموارد <ArrowLeft size={16} /></button></div></div> : <div className="quiz-card"><div className="quiz-progress"><span>سؤال {quizStep + 1} من {quizQuestions.length}</span><div><i style={{ width: `${((quizStep + 1) / quizQuestions.length) * 100}%` }} /></div></div><h2>{current.question}</h2><div className="answer-list">{current.options.map((option, index) => <button key={option} className={answers[quizStep] === index ? 'selected' : ''} onClick={() => answerQuiz(index)}><span>{String.fromCharCode(65 + index)}</span>{option}{answers[quizStep] === index && <Check size={17} />}</button>)}</div><div className="quiz-note"><Sparkles size={16} /> اختار الإجابة اللي تحسّها أصح.</div></div>}</div></section>;
}

function About({ navigate }: { navigate: (view: View) => void }) { return <section className="page-section about-page"><div className="container about-grid"><div><span className="section-kicker">علاش BACLIT؟</span><h1>المراجعة تنجم تكون<br /><em>أوضح وأسهل.</em></h1><p className="about-lede">BACLIT هي فضاء تونسي معمول مخصوص لطلبة Bac Lettres. جمعنا فيه الأساسيات باش ما تضيعش وقتك بين برشا بلايص.</p><button className="primary-button" onClick={() => navigate('resources')}>ابدأ المراجعة <ArrowLeft size={18} /></button></div><div className="about-note"><BookOpen size={28} /><p>راجع على طريقتك. تقدّم خطوة بخطوة. حضّر روحك للباك.</p><span>— BACLIT</span></div></div><div className="container contact-strip"><div><span className="section-kicker">نسمعوك</span><h2>عندك ملاحظة ولا مشكلة؟</h2><p>ابعثلنا ونحاولو نعاونك في أقرب وقت.</p></div><a className="outline-button" href="mailto:Baclit3@gmail.com">Baclit3@gmail.com <ExternalLink size={15} /></a></div></section>; }

function Profile({ session, saved, history, resources: allResources, navigate, onFavorite }: { session: Session | null; saved: string[]; history: string[]; resources: Resource[]; navigate: (view: View) => void; onFavorite: (resource: Resource) => void }) { const savedResources = allResources.filter((resource) => saved.includes(resource.id)); const historyResources = allResources.filter((resource) => history.includes(resource.id)); return <section className="page-section"><div className="container profile-page"><div className="profile-top"><div className="avatar"><CircleUserRound size={29} /></div><div><span className="section-kicker">Espace étudiant</span><h1>حسابي</h1><p>{session?.user.email ?? 'ادخل لحسابك باش تشوف خدمتك.'}</p></div>{session && supabase && <button className="outline-button" onClick={() => supabase.auth.signOut()}>خروج</button>}</div>{session ? <div className="profile-sections"><section><div className="mini-heading"><h2>Favoris</h2><span>{savedResources.length}</span></div>{savedResources.length ? <div className="profile-list">{savedResources.map((resource) => <div key={resource.id}><div><strong>{resource.title}</strong><small>{subjectName(resource.subject)} · {resource.type}</small></div><button onClick={() => onFavorite(resource)} aria-label="نحّي من المفضلة"><Heart size={18} fill="currentColor" /></button></div>)}</div> : <div className="profile-empty">ما عندك حتى حاجة محفوظة توّا. لوج على حاجة تعجبك وحطّها في Favoris.</div>}</section><section><div className="mini-heading"><h2>آخر ما تفرّجت</h2><span>{historyResources.length}</span></div>{historyResources.length ? <div className="profile-list">{historyResources.map((resource) => <div key={resource.id}><div><strong>{resource.title}</strong><small>{resource.date}</small></div><ArrowLeft size={17} /></div>)}</div> : <div className="profile-empty">التاريخ متاعك فارغ توّا. إبدأ حلّ أول مورد.</div>}</section></div> : <div className="profile-login"><CircleUserRound size={32} /><h2>اعمل حساب باش تتابع تقدّمك</h2><p>الحساب موش إجباري للمراجعة. يلزمك كان للحفظ والتاريخ والنتائج.</p><button className="primary-button" onClick={() => navigate('home')}>رجوع للصفحة الرئيسية</button></div>}</div></section>; }

export default App;
