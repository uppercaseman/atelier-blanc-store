import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, FileText, BarChart3, Settings, RefreshCw } from 'lucide-react';

interface EmailStats {
  totalSubscribers: number;
  activeSubscribers: number;
  emailsSentToday: number;
  campaignsSent: number;
}

interface EmailLog {
  id: string;
  recipient_email: string;
  subject: string;
  template_type: string;
  sent_at: string;
  status: string;
}

export default function EmailAdmin() {
  const [stats, setStats] = useState<EmailStats>({ totalSubscribers: 0, activeSubscribers: 0, emailsSentToday: 0, campaignsSent: 0 });
  const [recentLogs, setRecentLogs] = useState<EmailLog[]>([]);
  const [testEmailType, setTestEmailType] = useState('newsletter');
  const [testRecipient, setTestRecipient] = useState('theunis.meyer@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchStats(), fetchRecentLogs()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const supabaseUrl = 'https://nskzgujplhrnzymvhzsp.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za3pndWpwbGhybnp5bXZoenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk0MjEsImV4cCI6MjA3MjQzNTQyMX0.Yyyq2-fJTYdk3iPFNy0OACrLIg0DSJJ7sJxJgfTSoKw';
      
      // Fetch total subscribers
      const subscribersResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const subscribers = await subscribersResponse.json();
      const totalSubscribers = subscribers.length || 0;
      const activeSubscribers = subscribers.filter((sub: any) => sub.is_active === true).length || 0;
      
      // Fetch today's email logs
      const today = new Date().toISOString().split('T')[0];
      const logsResponse = await fetch(`${supabaseUrl}/rest/v1/email_logs?sent_at=gte.${today}T00:00:00&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const todayLogs = await logsResponse.json();
      const emailsSentToday = todayLogs.length || 0;
      
      // Fetch campaign count
      const campaignResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_campaigns?status=eq.sent&select=*`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const campaigns = await campaignResponse.json();
      const campaignsSent = campaigns.length || 0;
      
      setStats({
        totalSubscribers,
        activeSubscribers,
        emailsSentToday,
        campaignsSent
      });
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
      // Keep default values if fetch fails
      setStats({ totalSubscribers: 0, activeSubscribers: 0, emailsSentToday: 0, campaignsSent: 0 });
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const supabaseUrl = 'https://nskzgujplhrnzymvhzsp.supabase.co';
      const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za3pndWpwbGhybnp5bXZoenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk0MjEsImV4cCI6MjA3MjQzNTQyMX0.Yyyq2-fJTYdk3iPFNy0OACrLIg0DSJJ7sJxJgfTSoKw';
      
      // Fetch recent email logs (last 20)
      const response = await fetch(`${supabaseUrl}/rest/v1/email_logs?select=*&order=sent_at.desc&limit=20`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const logs = await response.json();
      setRecentLogs(logs || []);
    } catch (error) {
      console.error('Failed to fetch email logs:', error);
      setRecentLogs([]);
    }
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const response = await fetch('https://nskzgujplhrnzymvhzsp.supabase.co/functions/v1/send-test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: testEmailType,
          recipientEmail: testRecipient
        })
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult(`✅ Test email sent successfully! Email ID: ${result.data.emailId}`);
        // Refresh logs after successful test email
        await fetchRecentLogs();
      } else {
        setTestResult(`❌ Failed to send test email: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      setTestResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendNewsletter = async () => {
    if (!confirm('Are you sure you want to send the newsletter to all active subscribers?')) {
      return;
    }
    
    try {
      const response = await fetch('https://nskzgujplhrnzymvhzsp.supabase.co/functions/v1/send-newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Newsletter sent successfully to ${result.data.sentCount} recipients!`);
        // Refresh data after successful send
        await Promise.all([fetchStats(), fetchRecentLogs()]);
      } else {
        alert(`Failed to send newsletter: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-8 h-8 text-stone-600" />
            <h1 className="text-2xl font-light text-stone-900">Email Management System</h1>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:bg-stone-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-stone-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-stone-600">Total Subscribers</span>
              </div>
              <p className="text-2xl font-light text-stone-900 mt-1">{stats.totalSubscribers}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-stone-600">Active Subscribers</span>
              </div>
              <p className="text-2xl font-light text-stone-900 mt-1">{stats.activeSubscribers}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-stone-600">Emails Today</span>
              </div>
              <p className="text-2xl font-light text-stone-900 mt-1">{stats.emailsSentToday}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-stone-600">Campaigns Sent</span>
              </div>
              <p className="text-2xl font-light text-stone-900 mt-1">{stats.campaignsSent}</p>
            </div>
          </div>

          {/* Test Email Section */}
          <div className="bg-stone-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Test Email System
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Email Type</label>
                <select
                  value={testEmailType}
                  onChange={(e) => setTestEmailType(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                >
                  <option value="newsletter">Newsletter</option>
                  <option value="welcome">Welcome Email</option>
                  <option value="purchase">Purchase Confirmation</option>
                  <option value="customer-service">Customer Service</option>
                  <option value="default">System Test</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-500"
                  placeholder="test@example.com"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={handleSendTest}
                  disabled={isSendingTest || !testRecipient}
                  className="w-full bg-stone-900 text-white py-2 px-4 rounded-lg hover:bg-stone-800 disabled:bg-stone-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isSendingTest ? 'Sending...' : 'Send Test Email'}
                </button>
              </div>
            </div>
            
            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {testResult}
              </div>
            )}
          </div>

          {/* Newsletter Campaign Section */}
          <div className="bg-stone-50 p-6 rounded-lg mb-8">
            <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Newsletter Campaign
            </h2>
            
            <p className="text-stone-600 mb-4">
              Send the default newsletter template to all active subscribers.
            </p>
            
            <button
              onClick={handleSendNewsletter}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Newsletter to All Subscribers
            </button>
          </div>

          {/* Recent Email Logs */}
          <div>
            <h2 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Email Activity
            </h2>
            
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No recent email activity</p>
                <p className="text-sm">Email logs will appear here once you start sending emails.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-stone-300">
                  <thead>
                    <tr className="bg-stone-100">
                      <th className="border border-stone-300 px-4 py-2 text-left">Recipient</th>
                      <th className="border border-stone-300 px-4 py-2 text-left">Subject</th>
                      <th className="border border-stone-300 px-4 py-2 text-left">Type</th>
                      <th className="border border-stone-300 px-4 py-2 text-left">Status</th>
                      <th className="border border-stone-300 px-4 py-2 text-left">Sent At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="border border-stone-300 px-4 py-2">{log.recipient_email}</td>
                        <td className="border border-stone-300 px-4 py-2">{log.subject}</td>
                        <td className="border border-stone-300 px-4 py-2">{log.template_type}</td>
                        <td className="border border-stone-300 px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            log.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="border border-stone-300 px-4 py-2">
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}