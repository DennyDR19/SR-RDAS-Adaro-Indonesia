import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  X,
  ShieldCheck,
  Terminal,
  Download,
  Info,
  LogOut,
  User as UserIcon,
  Folder,
  Layers,
  Sparkles,
  Database,
  CheckSquare,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  GoogleSheetsBackend,
  GOOGLE_APPS_SCRIPT_CODE,
} from '../services/googleSheetsBackend';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getCurrentUser,
  findOrCreateSpreadsheet,
  fetchPUsFromGoogleSheet,
  syncAllPUsToGoogleSheet,
  getSavedSpreadsheetUrl,
  getSavedSpreadsheetId,
  findOrCreateDriveFolder,
  getSavedDriveFolderUrl,
  initializeRealGoogleDriveAndSheets,
} from '../services/googleSheetsDirectService';
import { PetakUkur } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  puList: PetakUkur[];
  onDataLoaded: (newList: PetakUkur[]) => void;
  onShowToast: (title: string, desc: string, type: 'success' | 'alert' | 'info') => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  puList,
  onDataLoaded,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'webhook'>('direct');

  // Direct Google Account State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<{
    type: 'popup_closed' | 'popup_blocked' | 'generic';
    message: string;
  } | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [driveFolderUrl, setDriveFolderUrl] = useState<string | null>(null);
  const [isSettingUpSheet, setIsSettingUpSheet] = useState<boolean>(false);
  const [isInitializingRealData, setIsInitializingRealData] = useState<boolean>(false);
  const [isDirectSyncing, setIsDirectSyncing] = useState<boolean>(false);
  const [isDirectPulling, setIsDirectPulling] = useState<boolean>(false);

  // Webhook State
  const [urlInput, setUrlInput] = useState<string>('');
  const [isWebhookConnected, setIsWebhookConnected] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showCodeGuide, setShowCodeGuide] = useState<boolean>(false);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        setSpreadsheetUrl(getSavedSpreadsheetUrl());
        setDriveFolderUrl(getSavedDriveFolderUrl());
      },
      () => {
        setUser(getCurrentUser());
        setToken(getAccessToken());
        setSpreadsheetUrl(getSavedSpreadsheetUrl());
        setDriveFolderUrl(getSavedDriveFolderUrl());
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      const savedUrl = GoogleSheetsBackend.getUrl() || '';
      setUrlInput(savedUrl);
      setIsWebhookConnected(GoogleSheetsBackend.isConnected());
      setLastSync(GoogleSheetsBackend.getLastSync());
      setTestResult(null);

      const curUser = getCurrentUser();
      const curToken = getAccessToken();
      setUser(curUser);
      setToken(curToken);
      setSpreadsheetUrl(getSavedSpreadsheetUrl());
      setDriveFolderUrl(getSavedDriveFolderUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // =========================================================================
  // DIRECT GOOGLE ACCOUNT HANDLERS
  // =========================================================================

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setAuthError(null);
        onShowToast(
          'Otentikasi Berhasil',
          `Masuk sebagai ${result.user.displayName || result.user.email}. Menyiapkan Google Drive & Sheets...`,
          'success'
        );

        // Auto initialize real Drive Folder and Google Sheet with executive summary
        setIsInitializingRealData(true);
        try {
          const initRes = await initializeRealGoogleDriveAndSheets(result.accessToken, puList);
          setDriveFolderUrl(initRes.folderUrl);
          setSpreadsheetUrl(initRes.spreadsheetUrl);
          onShowToast(
            'Google Drive & Sheets Siap',
            `Folder "${initRes.folderName}" dan database PU lengkap (${initRes.puCount} PU) telah aktif di Google Drive Anda.`,
            'success'
          );
        } catch (sheetErr: any) {
          console.error('Initialization error:', sheetErr);
          // Fallback to basic spreadsheet
          try {
            const sheetInfo = await findOrCreateSpreadsheet(result.accessToken);
            setSpreadsheetUrl(sheetInfo.webViewLink);
          } catch {}
          onShowToast(
            'Inisialisasi Parsial',
            sheetErr.message || 'Klik tombol "Inisialisasi Data Real" untuk mencoba kembali.',
            'info'
          );
        } finally {
          setIsInitializingRealData(false);
        }
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      const errStr = `${err?.code || ''} ${err?.message || ''}`.toLowerCase();
      
      if (errStr.includes('popup-closed-by-user')) {
        setAuthError({
          type: 'popup_closed',
          message:
            'Jendela pop-up Google ditutup sebelum selesai, atau diblokir otomatis oleh pembatasan cookie/keamanan browser.',
        });
        onShowToast(
          'Login Google Dibatalkan',
          'Jendela otentikasi ditutup sebelum selesai. Anda juga dapat menggunakan tab "Webhook Apps Script" yang tidak memerlukan pop-up.',
          'alert'
        );
      } else if (errStr.includes('popup-blocked')) {
        setAuthError({
          type: 'popup_blocked',
          message:
            'Browser memblokir jendela pop-up. Izinkan pop-up di bilah alamat browser, atau beralih ke tab "Webhook Apps Script".',
        });
        onShowToast(
          'Pop-up Diblokir Browser',
          'Silakan izinkan pop-up atau beralih ke tab Webhook Apps Script.',
          'alert'
        );
      } else {
        setAuthError({
          type: 'generic',
          message: err?.message || 'Terjadi kesalahan saat otentikasi Google.',
        });
        onShowToast(
          'Gagal Masuk Google',
          err?.message || 'Otentikasi Google dibatalkan atau terkendala koneksi.',
          'alert'
        );
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleInitializeRealData = async () => {
    let currentToken = token;
    if (!currentToken) {
      handleGoogleSignIn();
      return;
    }

    setIsInitializingRealData(true);
    try {
      const res = await initializeRealGoogleDriveAndSheets(currentToken, puList);
      setDriveFolderUrl(res.folderUrl);
      setSpreadsheetUrl(res.spreadsheetUrl);
      onShowToast(
        'Sinkronisasi Real Selesai',
        `Data ${res.puCount} Petak Ukur (26 Kolom) dan Ringkasan Eksekutif tersimpan rapi di Google Drive.`,
        'success'
      );
    } catch (err: any) {
      console.error('Inisialisasi gagal:', err);
      onShowToast('Gagal Inisialisasi', err.message || 'Terjadi kesalahan.', 'alert');
    } finally {
      setIsInitializingRealData(false);
    }
  };

  const handleDirectCreateOrOpenSheet = async () => {
    if (!token) {
      handleGoogleSignIn();
      return;
    }

    setIsSettingUpSheet(true);
    try {
      const sheetInfo = await findOrCreateSpreadsheet(token);
      setSpreadsheetUrl(sheetInfo.webViewLink);
      onShowToast(
        'Spreadsheet Siap',
        'Database Google Sheets aktif dan terhubung ke akun Anda.',
        'success'
      );
    } catch (err: any) {
      onShowToast('Gagal Menghubungkan Sheet', err.message || 'Terjadi kesalahan.', 'alert');
    } finally {
      setIsSettingUpSheet(false);
    }
  };

  const handleDirectPushAll = async () => {
    if (!token) {
      alert('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    const id = getSavedSpreadsheetId();
    if (!id) {
      await handleInitializeRealData();
      return;
    }

    const confirmed = window.confirm(
      `Konfirmasi: Kirim dan perbarui seluruh ${puList.length} Petak Ukur (PU) serta Ringkasan Eksekutif ke Google Drive Anda?`
    );
    if (!confirmed) return;

    setIsDirectSyncing(true);
    try {
      await syncAllPUsToGoogleSheet(token, id, puList);
      onShowToast(
        'Sinkronisasi Berhasil',
        `${puList.length} data Petak Ukur dan Ringkasan Eksekutif berhasil diperbarui di Google Sheets.`,
        'success'
      );
    } catch (err: any) {
      onShowToast('Gagal Sinkronisasi', err.message || 'Terjadi kesalahan.', 'alert');
    } finally {
      setIsDirectSyncing(false);
    }
  };

  const handleDirectPullAll = async () => {
    if (!token) {
      alert('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    const id = getSavedSpreadsheetId();
    if (!id) {
      alert('Spreadsheet belum dibuat.');
      return;
    }

    const confirmed = window.confirm(
      'Konfirmasi: Ambil data terbaru dari Google Sheets dan perbarui tampilan aplikasi?'
    );
    if (!confirmed) return;

    setIsDirectPulling(true);
    try {
      const data = await fetchPUsFromGoogleSheet(token, id);
      if (data && data.length > 0) {
        onDataLoaded(data);
        onShowToast(
          'Data Berhasil Dimuat',
          `Berhasil mengambil ${data.length} data Petak Ukur dari Google Sheets.`,
          'success'
        );
      } else {
        onShowToast(
          'Sheet Kosong',
          'Belum ada baris data di spreadsheet Google Drive Anda.',
          'info'
        );
      }
    } catch (err: any) {
      onShowToast('Gagal Mengambil Data', err.message || 'Periksa izin spreadsheet.', 'alert');
    } finally {
      setIsDirectPulling(false);
    }
  };

  const handleGoogleLogout = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin keluar dari Akun Google di aplikasi ini?'
    );
    if (!confirmed) return;

    await logoutGoogle();
    setUser(null);
    setToken(null);
    onShowToast('Keluar Berhasil', 'Akun Google telah diputuskan dari aplikasi.', 'info');
  };

  // =========================================================================
  // WEBHOOK APPS SCRIPT HANDLERS
  // =========================================================================

  const handleTestAndSave = async () => {
    if (!urlInput.trim()) {
      setTestResult({
        success: false,
        message: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await GoogleSheetsBackend.testConnection(urlInput.trim());
    setIsTesting(false);
    setTestResult(result);

    if (result.success) {
      GoogleSheetsBackend.setUrl(urlInput.trim());
      setIsWebhookConnected(true);
      setLastSync(GoogleSheetsBackend.getLastSync());
      onShowToast(
        'Webhook Google Sheets Terhubung',
        'Aplikasi kini tersinkronisasi dengan spreadsheet Anda.',
        'success'
      );
    }
  };

  const handleDisconnectWebhook = () => {
    if (confirm('Putuskan sambungan URL Webhook? Data lokal tetap aman.')) {
      GoogleSheetsBackend.setUrl(null);
      setUrlInput('');
      setIsWebhookConnected(false);
      setLastSync(null);
      setTestResult(null);
      onShowToast('Koneksi Webhook Diputuskan', 'Aplikasi menggunakan penyimpanan lokal.', 'info');
    }
  };

  const handlePushAllWebhook = async () => {
    if (!isWebhookConnected) {
      alert('Hubungkan URL Google Sheets terlebih dahulu.');
      return;
    }

    const confirmed = window.confirm(
      `Konfirmasi: Kirim dan perbarui seluruh ${puList.length} Petak Ukur ke Google Sheet?`
    );
    if (!confirmed) return;

    setIsSyncing(true);
    const res = await GoogleSheetsBackend.syncAllToSheet(puList);
    setIsSyncing(false);

    if (res.success) {
      setLastSync(GoogleSheetsBackend.getLastSync());
      onShowToast('Sinkronisasi Berhasil', res.message, 'success');
    } else {
      onShowToast('Sinkronisasi Gagal', res.message, 'alert');
    }
  };

  const handlePullAllWebhook = async () => {
    if (!isWebhookConnected) {
      alert('Hubungkan URL Google Sheets terlebih dahulu.');
      return;
    }

    setIsPulling(true);
    const data = await GoogleSheetsBackend.fetchFromSheet();
    setIsPulling(false);

    if (data && data.length > 0) {
      onDataLoaded(data);
      setLastSync(GoogleSheetsBackend.getLastSync());
      onShowToast(
        'Data Dimuat dari Google Sheet',
        `Berhasil memuat ${data.length} Petak Ukur dari spreadsheet.`,
        'success'
      );
    } else {
      onShowToast('Data Kosong atau Gagal', 'Periksa izin skrip Web App.', 'alert');
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
    onShowToast('Skrip Disalin', 'Kode Google Apps Script siap ditempel di editor.', 'info');
  };

  const handleDownloadScript = () => {
    const blob = new Blob([GOOGLE_APPS_SCRIPT_CODE], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GoogleAppsScript_RehabilitasiDAS.gs';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Backend Database Google Sheets
                {(token || isWebhookConnected) && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Penyimpanan & sinkronisasi data Petak Ukur (PU) langsung ke Google Drive Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6">
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'direct'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Akun Google Langsung (Otomatis)</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-normal">
              Rekomendasi
            </span>
          </button>

          <button
            onClick={() => setActiveTab('webhook')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'webhook'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Webhook Apps Script (Alternatif)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-300">
          {activeTab === 'direct' ? (
            /* ========================================================================= */
            /* TAB 1: DIRECT GOOGLE ACCOUNT OAUTH INTEGRATION                            */
            /* ========================================================================= */
            <div className="space-y-5">
              {/* Account Status Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-emerald-400" />
                      Status Akun Google Anda
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Menghubungkan langsung ke Google Drive & Google Sheets menggunakan izin resmi Google.
                    </p>
                  </div>

                  {user && (
                    <button
                      onClick={handleGoogleLogout}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar Akun</span>
                    </button>
                  )}
                </div>

                {user && token ? (
                  /* User Profile Logged In */
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full border border-emerald-500/40"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                          {user.displayName || 'Pengguna Google'}
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[11px] font-semibold">
                      Otentikasi Aktif
                    </span>
                  </div>
                ) : (
                  /* Official Sign in with Google Button (GSI Style) */
                  <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-900/60 border border-slate-800 rounded-xl text-center space-y-3">
                    <p className="text-xs text-slate-300 max-w-md">
                      Masuk dengan akun Google Anda untuk membuat spreadsheet secara otomatis di Google Drive dan menyinkronkan data Petak Ukur (PU).
                    </p>

                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-semibold text-xs flex items-center gap-3 shadow-md hover:shadow-lg transition-all border border-slate-300 disabled:opacity-50"
                    >
                      {/* Official Google Vector Logo */}
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>{isSigningIn ? 'Menghubungkan ke Google...' : 'Sign in with Google'}</span>
                    </button>

                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Aman & terenkripsi: Token disimpan dalam memori sesi (in-memory token caching).
                    </div>

                    {/* Troubleshooting Guidance Banner for Popup Issues */}
                    {authError && (
                      <div className="w-full max-w-lg mt-3 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-left text-amber-200 space-y-2.5 animate-fade-in">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="font-bold text-xs text-amber-300">
                              {authError.type === 'popup_closed'
                                ? 'Penyebab: Jendela Pop-up Google Tertutup Sebelum Selesai'
                                : authError.type === 'popup_blocked'
                                ? 'Penyebab: Pop-up Diblokir oleh Browser'
                                : 'Penyebab Kendala Koneksi Google'}
                            </h5>
                            <p className="text-[11px] text-amber-200/90 leading-relaxed">
                              {authError.type === 'popup_closed' ? (
                                <>
                                  Jendela otentikasi ditutup sebelum proses izin akun selesai, atau sistem keamanan browser membatasi komunikasi pop-up di dalam mode pratinjau (iframe / third-party cookies).
                                </>
                              ) : (
                                authError.message
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('webhook')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow transition-all hover:scale-[1.02]"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Gunakan Webhook Apps Script (Bebas Pop-up & 100% Lancar)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={isSigningIn}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-colors"
                          >
                            Coba Masuk Lagi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Spreadsheet & Drive Folder Target Card */}
              {user && token && (
                <div className="space-y-4">
                  {/* Storage Location & Spreadsheet Overview */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Folder className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100">
                              Tempat Penyimpanan: Google Drive
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Folder khusus: <span className="text-emerald-400 font-semibold font-mono">Rehabilitasi DAS - Data & Peta Kinerja (BPDAS)</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {driveFolderUrl && (
                        <a
                          href={driveFolderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-sm"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>Buka Folder Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* Google Spreadsheet File Card */}
                    <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            Peta Kinerja Rehabilitasi DAS (Database PU)
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>Google Sheets Real-time Backend</span>
                          </div>
                        </div>
                      </div>

                      {spreadsheetUrl ? (
                        <a
                          href={spreadsheetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Buka Google Sheet</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          onClick={handleDirectCreateOrOpenSheet}
                          disabled={isSettingUpSheet}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {isSettingUpSheet ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Memproses...</span>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Buat / Cari Spreadsheet</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Real Data Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                          <Database className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tab 1: Petak_Ukur</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Memuat <b className="text-slate-200">{puList.length} titik Petak Ukur</b> dengan <b>26 kolom data sensus lapangan lengkap</b> (Kode PU, Sub-DAS, Koordinat, Luas Ha, Tanaman Awal & Hidup, Survival Rate %, Kategori BPDAS, Rekomendasi Teknis, & Surveyor).
                        </p>
                      </div>

                      <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Tab 2: Ringkasan_Eksekutif</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Dashboard rekapitulasi otomatis: <b className="text-slate-200">Indikator Kinerja Utama (IKU) Kehutanan</b>, distribusi kelas kinerja (Hijau/Kuning/Merah/Hitam), dan performa per Sub-DAS (Citarum, Cikapundung, Cisangkuy, dll.).
                        </p>
                      </div>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2.5 items-center">
                      <button
                        onClick={handleInitializeRealData}
                        disabled={isInitializingRealData || isDirectSyncing}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md hover:shadow-emerald-900/30 disabled:opacity-50"
                      >
                        {isInitializingRealData ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Menyiapkan Folder & Data Real...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-200" />
                            <span>Inisialisasi Data Real ke Google Drive</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDirectPushAll}
                        disabled={isDirectSyncing || isInitializingRealData}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                      >
                        <UploadCloud className={`w-3.5 h-3.5 text-emerald-400 ${isDirectSyncing ? 'animate-bounce' : ''}`} />
                        <span>{isDirectSyncing ? 'Mengirim Data...' : `Kirim & Perbarui (${puList.length} PU)`}</span>
                      </button>

                      <button
                        onClick={handleDirectPullAll}
                        disabled={isDirectPulling || isInitializingRealData}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
                      >
                        <DownloadCloud className={`w-3.5 h-3.5 text-cyan-400 ${isDirectPulling ? 'animate-bounce' : ''}`} />
                        <span>{isDirectPulling ? 'Menarik Data...' : 'Tarik Data dari Sheet'}</span>
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Sistem bekerja dua arah: Setiap kali Petak Ukur (PU) diubah atau dievaluasi di peta web, perubahan langsung ter-update secara otomatis ke Google Sheets di Google Drive Anda.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* TAB 2: WEBHOOK APPS SCRIPT INTEGRATION (FALLBACK)                         */
            /* ========================================================================= */
            <div className="space-y-6">
              {/* Status & Input Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-200 block mb-1">
                      URL Web App Google Apps Script
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Tempel URL Web App dari skrip Google Sheets Anda di sini.
                    </p>
                  </div>
                  {isWebhookConnected && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Terakhir Disinkronkan:</span>
                      <span className="text-[11px] font-mono text-emerald-400 font-medium">
                        {lastSync || 'Baru saja terhubung'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    onClick={handleTestAndSave}
                    disabled={isTesting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    {isTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Menguji...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Uji & Hubungkan</span>
                      </>
                    )}
                  </button>

                  {isWebhookConnected && (
                    <button
                      onClick={handleDisconnectWebhook}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-medium shrink-0 transition-colors"
                    >
                      Putuskan
                    </button>
                  )}
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      testResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <div className="font-semibold">{testResult.message}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons when Connected */}
                {isWebhookConnected && (
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2.5">
                    <button
                      onClick={handlePushAllWebhook}
                      disabled={isSyncing}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <UploadCloud className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                      <span>{isSyncing ? 'Mengirim Data...' : `Kirim Semua ke Sheet (${puList.length} PU)`}</span>
                    </button>

                    <button
                      onClick={handlePullAllWebhook}
                      disabled={isPulling}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      <DownloadCloud className={`w-3.5 h-3.5 text-cyan-400 ${isPulling ? 'animate-bounce' : ''}`} />
                      <span>{isPulling ? 'Menarik Data...' : 'Tarik Data dari Sheet'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Guide & Code Section */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowCodeGuide(!showCodeGuide)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200">
                      Panduan Pemasangan Skrip Webhook
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {showCodeGuide ? 'Sembunyikan' : 'Buka Panduan'}
                  </span>
                </button>

                {showCodeGuide && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-800/80 pt-4">
                    {/* Code Actions */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Kode Skrip Backend Otomatis (Code.gs)
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownloadScript}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Unduh File .gs</span>
                        </button>
                        <button
                          onClick={handleCopyScript}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Seluruh Kode</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Code Snippet Viewer */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <pre className="p-4 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-52 leading-relaxed select-all">
                        {GOOGLE_APPS_SCRIPT_CODE}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {token || isWebhookConnected ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Terhubung ke Google Sheets
              </span>
            ) : (
              <span>Masuk dengan akun Google untuk sinkronisasi otomatis.</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
