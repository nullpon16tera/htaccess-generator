import React, { useState, useEffect, useRef } from 'react';
import {
  Copy, Check, Lock, Globe, Shield, AlertCircle,
  ArrowRightLeft, Terminal, FileCode, CheckCircle2,
  Settings, UserLock, ExternalLink,
  ChevronRight, Menu, X, Hash
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeSection, setActiveSection] = useState('https');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const scrollContainerRef = useRef(null);

  // State for Basic Auth
  const [enableAuth, setEnableAuth] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authName, setAuthName] = useState('Restricted Area');
  const [authFile, setAuthFile] = useState('/var/www/html/.htpasswd');
  const [htpasswdLine, setHtpasswdLine] = useState('');

  // State for HTTPS Redirect
  const [enableHttps, setEnableHttps] = useState(true);
  // 'none' | 'force-www' | 'force-non-www'
  const [wwwOption, setWwwOption] = useState('none');

  // State for UI Feedback
  const [copiedRedirect, setCopiedRedirect] = useState(false);
  const [copiedAuthHtaccess, setCopiedAuthHtaccess] = useState(false);
  const [copiedHtpasswd, setCopiedHtpasswd] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  // Intersection Observer to track active section
  useEffect(() => {
    const observerOptions = {
      root: scrollContainerRef.current,
      rootMargin: '-10% 0px -80% 0px',
      threshold: 0
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    const sections = ['https', 'auth', 'output'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Generate SHA-1 Hash for .htpasswd
  useEffect(() => {
    const generateHash = async () => {
      if (!password) {
        setHtpasswdLine('');
        return;
      }
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        let binaryString = '';
        for (let i = 0; i < hashArray.length; i++) {
          binaryString += String.fromCharCode(hashArray[i]);
        }
        const base64Hash = btoa(binaryString);
        setHtpasswdLine(`${username}:{SHA}${base64Hash}`);
      } catch (e) {
        console.error("Hashing failed", e);
        setHtpasswdLine('ハッシュの生成に失敗しました');
      }
    };

    generateHash();
  }, [username, password]);

  const getRedirectCode = () => {
    if (!enableHttps) return '';
    let lines = [
      '# --- HTTPS & WWW Redirect ---',
      '<IfModule mod_rewrite.c>',
      'RewriteEngine On'
    ];
    if (wwwOption === 'force-non-www') {
      lines.push('');
      lines.push('# WWWなしに統一 (例: www.example.com -> example.com)');
      lines.push('RewriteCond %{HTTP_HOST} ^www\\.(.*)$ [NC]');
      lines.push('RewriteRule ^(.*)$ https://%1%{REQUEST_URI} [R=301,L]');
    } else if (wwwOption === 'force-www') {
      lines.push('');
      lines.push('# WWWありに統一 (例: example.com -> www.example.com)');
      lines.push('RewriteCond %{HTTP_HOST} !^www\\. [NC]');
      lines.push('RewriteRule ^(.*)$ https://www.%{HTTP_HOST}%{REQUEST_URI} [R=301,L]');
    }
    lines.push('');
    lines.push('# HTTPSへ強制リダイレクト');
    lines.push('RewriteCond %{HTTPS} off');
    lines.push('RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]');
    lines.push('</IfModule>');
    return lines.join('\n');
  };

  const getAuthHtaccessCode = () => {
    if (!enableAuth) return '';
    const lines = [
      '# --- Basic Authentication ---',
      'AuthType Basic',
      `AuthName "${authName}"`,
      `AuthUserFile ${authFile}`,
      'Require valid-user'
    ];
    return lines.join('\n');
  };

  const getFullCode = () => {
    const redirect = getRedirectCode();
    const auth = getAuthHtaccessCode();
    if (redirect && auth) return `${redirect}\n\n${auth}`;
    return redirect || auth || '# 設定を有効にしてください';
  };

  const copyToClipboard = async (text, setCopied) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Unable to copy', err);
    }
  };

  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.pushState(null, null, `#${id}`);
      setActiveSection(id);
    }
  };

  const NavigationItem = ({ id, label, icon: Icon }) => (
    <a
      href={`#${id}`}
      onClick={(e) => scrollToSection(e, id)}
      className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold transition-all duration-200 border-r-4 ${
        activeSection === id
          ? 'bg-indigo-50 text-indigo-600 border-indigo-600'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-transparent'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {activeSection === id && <ChevronRight size={14} className="ml-auto" />}
    </a>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 xl:relative xl:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-indigo-200 shadow-lg">
                <Terminal size={24} />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-800 block">.htaccess</span>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Generator</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 mt-6 overflow-y-auto">
            <div className="px-6 py-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">設定項目</span>
            </div>
            <NavigationItem id="https" label="HTTPS・正規化" icon={Globe} />
            <NavigationItem id="auth" label="Basic認証" icon={UserLock} />

            <div className="px-6 py-2 mt-6">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">出力出力</span>
            </div>
            <NavigationItem id="output" label="全コード表示" icon={FileCode} />
          </nav>

          <div className="p-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Apache 2.4+ Ready</span>
              </div>
            </div>
            <p className="mt-6 text-[10px] text-center text-slate-400 font-medium">
              © 2026 .htaccess Generator
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header */}
        <header className="xl:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="font-bold text-slate-800">.htaccess Gen</span>
          <div className="w-10"></div>
        </header>

        {/* Scrollable Content */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-6 xl:p-12 bg-slate-50/50"
        >
          <div className="max-w-4xl mx-auto space-y-24 pb-32">

            {/* --- HTTPS SECTION --- */}
            <section id="https" className="space-y-8 scroll-mt-12">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">HTTPS・正規化設定</h2>
                  <p className="text-slate-500 mt-1 font-medium text-sm">SSL化の強制とドメインの最適化</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${enableHttps ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">HTTPS強制リダイレクト</h3>
                      <p className="text-sm text-slate-500">HTTPアクセスをHTTPSへ転送します</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableHttps(!enableHttps)}
                    className={`w-14 h-8 rounded-full relative transition-colors duration-200 ${enableHttps ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${enableHttps ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {enableHttps && (
                  <div className="p-8 space-y-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] block ml-1">WWWの扱い (URL正規化)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'none', label: '変更しない', desc: '現状維持' },
                          { id: 'force-www', label: 'WWWあり', desc: 'www. に統一' },
                          { id: 'force-non-www', label: 'WWWなし', desc: 'なしに統一' }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setWwwOption(opt.id)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                              wwwOption === opt.id
                                ? 'border-blue-600 bg-blue-50/50'
                                : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 mb-3 flex items-center justify-center ${wwwOption === opt.id ? 'border-blue-600' : 'border-slate-300'}`}>
                              {wwwOption === opt.id && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                            </div>
                            <span className="block font-bold text-slate-800 text-sm">{opt.label}</span>
                            <span className="block text-[11px] text-slate-500 mt-1 leading-tight">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner font-mono">
                      <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">redirect snippet</span>
                        <button onClick={() => copyToClipboard(getRedirectCode(), setCopiedRedirect)} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase">
                          {copiedRedirect ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-6 text-xs text-indigo-100 overflow-x-auto min-h-[100px] bg-slate-900">
                        <pre>{getRedirectCode()}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* --- BASIC AUTH SECTION --- */}
            <section id="auth" className="space-y-8 scroll-mt-12">
              <div className="flex items-end justify-between border-t border-slate-200 pt-16">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Basic 認証設定</h2>
                  <p className="text-slate-500 mt-1 font-medium text-sm">ディレクトリへのパスワード保護</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${enableAuth ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                      <UserLock size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">ディレクトリ保護</h3>
                      <p className="text-sm text-slate-500">.htpasswdを利用したログイン制限</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEnableAuth(!enableAuth)}
                    className={`w-14 h-8 rounded-full relative transition-colors duration-200 ${enableAuth ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${enableAuth ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                </div>

                {enableAuth && (
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">ユーザーID</label>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm"
                          placeholder="admin"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">パスワード</label>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm"
                          placeholder="パスワードを入力"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">認証名 (AuthName)</label>
                        <input
                          type="text"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:bg-white outline-none transition-all font-medium text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">.htpasswd サーバーパス</label>
                        <input
                          type="text"
                          value={authFile}
                          onChange={(e) => setAuthFile(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-orange-50 focus:border-orange-500 focus:bg-white outline-none transition-all font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4">
                      <AlertCircle className="text-amber-600 shrink-0" size={18} />
                      <div className="text-[11px] text-amber-900 leading-normal font-medium">
                        AuthUserFileには必ず <strong>絶対パス</strong> を指定してください。間違っていると500エラーが発生します。
                        ※ パスワードはApacheの &#123;SHA&#125; 形式でハッシュ化されます。
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                        <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">.htaccess snippet</span>
                          <button onClick={() => copyToClipboard(getAuthHtaccessCode(), setCopiedAuthHtaccess)} className="text-[9px] font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase">
                            {copiedAuthHtaccess ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="p-6 font-mono text-xs text-orange-100 overflow-x-auto min-h-[100px] bg-slate-900 font-mono">
                          <pre>{getAuthHtaccessCode()}</pre>
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-inner">
                        <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">.htpasswd content</span>
                          <button onClick={() => copyToClipboard(htpasswdLine, setCopiedHtpasswd)} disabled={!htpasswdLine} className="text-[9px] font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase disabled:text-slate-700">
                            {copiedHtpasswd ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="p-6 font-mono text-xs text-amber-100 overflow-x-auto flex items-center min-h-[100px] bg-slate-900 font-mono">
                          <pre>{htpasswdLine || '# ユーザー情報生成待ち...'}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* --- OUTPUT SECTION --- */}
            <section id="output" className="space-y-8 scroll-mt-y-12">
              <div className="flex items-end justify-between border-t border-slate-200 pt-16">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">全コード表示</h2>
                  <p className="text-slate-500 mt-1 font-medium text-sm">全ての設定を統合した出力結果</p>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden relative group">
                <div className="px-8 py-5 flex items-center justify-between border-b border-slate-800/50 bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 mr-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-mono">full .htaccess output</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(getFullCode(), setCopiedFull)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      copiedFull ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400'
                    }`}
                  >
                    {copiedFull ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copiedFull ? 'COPIED' : 'COPY ALL'}
                  </button>
                </div>
                <div className="p-10 font-mono text-sm leading-relaxed overflow-x-auto text-indigo-50 min-h-[300px] bg-slate-900/80 backdrop-blur-sm custom-scrollbar">
                  <pre>
                    <code>{getFullCode()}</code>
                  </pre>
                </div>
                <div className="px-8 py-4 bg-slate-950/50 text-[10px] text-slate-500 font-medium italic text-right border-t border-slate-800/30">
                  Apache 2.4+ configuration format
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
