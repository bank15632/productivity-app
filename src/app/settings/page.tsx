'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { dataApi } from '@/lib/api';
import { Download, Upload, Database, Trash2, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';
import type { StorageStats } from '@/types';

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<StorageStats>({
    projects: 0,
    tasks: 0,
    attachments: 0,
    total_file_size: 0,
    total_file_size_mb: '0',
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await dataApi.getStorageStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);

    try {
      const result = await dataApi.exportAllData();

      if (result.success && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        toast.success('Export successful! Download started.');
      } else {
        toast.error('Export failed');
      }
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const result = await dataApi.importData(text);

      if (result.success) {
        toast.success('Import successful!');
        loadStats();
      } else {
        toast.error(result.error || 'Import failed');
      }
    } catch {
      toast.error('Failed to import data');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleBackup = async () => {
    try {
      const result = await dataApi.createBackup();

      if (result.success) {
        toast.success('Backup created successfully!');
      } else {
        toast.error('Backup failed');
      }
    } catch {
      toast.error('Failed to create backup');
    }
  };

  return (
    <div>
      <Header title="Settings" showSearch={false} />

      <div className="mx-auto max-w-4xl p-6">
        {/* Storage Stats */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <HardDrive className="h-5 w-5" />
            Storage Statistics
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Projects</p>
              <p className="text-2xl font-bold text-blue-900">{stats.projects}</p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-600">Tasks</p>
              <p className="text-2xl font-bold text-green-900">{stats.tasks}</p>
            </div>

            <div className="rounded-lg bg-purple-50 p-4">
              <p className="text-sm text-purple-600">Attachments</p>
              <p className="text-2xl font-bold text-purple-900">{stats.attachments}</p>
            </div>

            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-sm text-orange-600">File Size</p>
              <p className="text-2xl font-bold text-orange-900">{stats.total_file_size_mb} MB</p>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Database className="h-5 w-5" />
            Data Management
          </h2>

          <div className="space-y-4">
            {/* Export */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-semibold">Export All Data</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Download all your data as JSON file for backup
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            {/* Import */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-semibold">Import Data</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Restore data from a previously exported JSON file
                </p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                <Upload className="h-4 w-4" />
                {importing ? 'Importing...' : 'Import'}
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>

            {/* Manual Backup */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
              <div>
                <h3 className="font-semibold">Create Backup</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Manually create a backup in Google Drive
                </p>
              </div>
              <button
                onClick={handleBackup}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                <Database className="h-4 w-4" />
                Backup Now
              </button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">API Configuration</h2>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              API URL: <code className="rounded bg-gray-200 px-2 py-1 text-xs">{process.env.NEXT_PUBLIC_API_URL || 'Not configured'}</code>
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Configure your Google Apps Script URL in the <code>.env.local</code> file.
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-red-900">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900">Clear All Completed Tasks</h3>
                <p className="mt-1 text-sm text-red-700">
                  Permanently delete all tasks marked as done
                </p>
              </div>
              <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Clear
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-red-900">Delete All Data</h3>
                <p className="mt-1 text-sm text-red-700">
                  ⚠️ This action cannot be undone
                </p>
              </div>
              <button className="rounded-lg bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-950">
                Delete All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
