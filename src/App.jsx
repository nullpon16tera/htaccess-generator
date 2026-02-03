import React, { useState, useEffect } from 'react';
import { Copy, Check, Lock, Globe, Shield, AlertCircle, ArrowRightLeft, Terminal, FileCode, CheckCircle2 } from 'lucide-react';

export default function App() {
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

  // Generate SHA-1 Hash for .htpasswd (Apache specific format: {SHA}base64-digest)
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

  const copyToClipboard = async (text, setCopied) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch (err) {
      console.error('Unable to copy', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 pb-20">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pt-16">
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">.htaccess</span> 生成ツール
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            Basic認証、HTTPSリダイレクト、URL正規化（WWWの有無）のコードを瞬時に作成。コピーしてサーバーに貼り付けるだけで使えます。
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-5 space-y-8">

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${enableHttps ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Globe size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">HTTPS リダイレクト</h2>
                    <p className="text-xs text-slate-500 font-medium">ドメインとプロトコルの管理</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableHttps(!enableHttps)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${enableHttps ? 'bg-blue-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${enableHttps ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className={`p-6 space-y-6 transition-all duration-300 ${enableHttps ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ArrowRightLeft size={16} />
                    WWWの扱い (URL正規化)
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { id: 'none', label: '変更しない（そのまま）', desc: 'ホスト名の修正を行いません' },
                      { id: 'force-www', label: 'WWWありに統一', desc: 'example.com を www.example.com に転送' },
                      { id: 'force-non-www', label: 'WWWなしに統一', desc: 'www.example.com を example.com に転送' }
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`relative flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          wwwOption === opt.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="wwwOption"
                          value={opt.id}
                          checked={wwwOption === opt.id}
                          onChange={(e) => setWwwOption(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${wwwOption === opt.id ? 'border-blue-600' : 'border-slate-300'}`}>
                          {wwwOption === opt.id && <div className="w-2 h-2 rounded-full bg-blue-600"></div>}
                        </div>
                        <div>
                          <span className="block text-sm font-bold text-slate-800">{opt.label}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{opt.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${enableAuth ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Basic 認証</h2>
                    <p className="text-xs text-slate-500 font-medium">特定ディレクトリをパスワードで保護</p>
                  </div>
                </div>
                <button
                  onClick={() => setEnableAuth(!enableAuth)}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${enableAuth ? 'bg-orange-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${enableAuth ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>

              <div className={`p-6 space-y-5 transition-all duration-300 ${enableAuth ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">ユーザーID</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="admin"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">パスワード</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="パスワードを入力"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">認証領域名 (AuthName)</label>
                  <input
                    type="text"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">.htpasswd サーバーパス (AuthUserFile)</label>
                  <input
                    type="text"
                    value={authFile}
                    onChange={(e) => setAuthFile(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-200 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium font-mono"
                    placeholder="/var/www/html/.htpasswd"
                  />
                  <div className="flex items-start gap-2 bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 leading-tight">サーバー上の <strong>絶対パス</strong> を指定してください。間違っていると「500 Internal Server Error」になります。</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-1">※ Apacheの <code>&#123;SHA&#125;</code> 形式でハッシュ化されます。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 space-y-8">
            <div className="sticky top-28 space-y-6">

              {enableHttps && (
                <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800 group relative">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                      <span className="ml-2 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <FileCode size={12} className="text-blue-400" />
                        .htaccess (リダイレクト用)
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getRedirectCode(), setCopiedRedirect)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                        copiedRedirect ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {copiedRedirect ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copiedRedirect ? 'コピー完了' : 'コードをコピー'}
                    </button>
                  </div>
                  <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto custom-scrollbar min-h-[140px]">
                    <pre className="text-blue-100 whitespace-pre">
                      <code className="block">{getRedirectCode()}</code>
                    </pre>
                  </div>
                  <div className="px-6 py-3 bg-slate-800/30 text-[10px] text-slate-500 border-t border-slate-800/50 italic">
                    .htaccessファイルの上部に追加してください
                  </div>
                </div>
              )}

              {enableAuth && (
                <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800 group relative">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                       <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                       <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                      <span className="ml-2 font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Shield size={12} className="text-orange-400" />
                        .htaccess (Basic認証用)
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(getAuthHtaccessCode(), setCopiedAuthHtaccess)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                        copiedAuthHtaccess ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {copiedAuthHtaccess ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copiedAuthHtaccess ? 'コピー完了' : 'コードをコピー'}
                    </button>
                  </div>
                  <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto custom-scrollbar min-h-[140px]">
                    <pre className="text-orange-100 whitespace-pre">
                      <code>{getAuthHtaccessCode()}</code>
                    </pre>
                  </div>
                  <div className="px-6 py-3 bg-slate-800/30 text-[10px] text-slate-500 border-t border-slate-800/50 italic">
                    .htaccessファイルの任意の場所に追加してください
                  </div>
                </div>
              )}

              {enableAuth && (
                <div className="bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-800 group relative">
                  <div className="px-6 py-4 flex justify-between items-center border-b border-slate-800/50 bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Lock size={12} className="text-amber-400" />
                        .htpasswd (パスワードファイル)
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(htpasswdLine, setCopiedHtpasswd)}
                      disabled={!htpasswdLine}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 font-medium ${
                        copiedHtpasswd
                          ? 'bg-emerald-500 text-white'
                          : !htpasswdLine
                            ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {copiedHtpasswd ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                      {copiedHtpasswd ? 'コピー完了' : 'コードをコピー'}
                    </button>
                  </div>
                  <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed min-h-[80px] flex items-center">
                    {htpasswdLine ? (
                      <code className="text-amber-100 break-all">{htpasswdLine}</code>
                    ) : (
                      <span className="text-slate-600 font-italic"># パスワードを入力すると生成されます</span>
                    )}
                  </div>
                  <div className="px-6 py-3 bg-slate-800/30 text-[10px] text-slate-500 border-t border-slate-800/50 italic">
                    このテキストをコピーして .htpasswd というファイル名で保存してください
                  </div>
                </div>
              )}

              {!enableHttps && !enableAuth && (
                 <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 bg-white/50 backdrop-blur-sm">
                   <div className="bg-slate-100 p-4 rounded-full mb-4">
                     <Terminal size={32} className="text-slate-300" />
                   </div>
                   <p className="font-medium">設定を有効にするとコードが表示されます</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-10 text-center">
          <p className="text-sm text-slate-400 font-medium">
            © 2026 .htaccess Generator
          </p>
        </div>
      </footer>
    </div>
  );
}
