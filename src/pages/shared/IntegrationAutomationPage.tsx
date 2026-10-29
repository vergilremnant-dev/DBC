import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutButton } from '../../components/auth/LogoutButton';
import { BrandLogo } from '../../components/common/BrandLogo';

type IntegrationTab = 'dashboard' | 'workflows' | 'apikeys' | 'developer' | 'logs';

interface ConnectedService {
  id: string;
  name: string;
  category: 'Storage' | 'Calendar' | 'Payment' | 'Messaging';
  status: 'Connected' | 'Disconnected';
  authType: 'OAuth 2.0' | 'API Key';
}

interface AutomationRule {
  id: string;
  triggerEvent: string;
  actionService: string;
  actionDetails: string;
  status: 'Active' | 'Paused';
}

interface ApiKeyRecord {
  id: string;
  name: string;
  prefix: string;
  scope: 'Read-Only' | 'Read-Write' | 'Admin';
  createdAt: string;
}

interface IntegrationLog {
  id: string;
  timestamp: string;
  type: 'Webhook outgoing' | 'OAuth sync' | 'API Request';
  service: string;
  status: 'Success' | 'Failed' | 'Retrying';
  details: string;
}

const INITIAL_SERVICES: ConnectedService[] = [
  { id: 'srv-1', name: 'Google Drive', category: 'Storage', status: 'Connected', authType: 'OAuth 2.0' },
  { id: 'srv-2', name: 'Microsoft Outlook Calendar', category: 'Calendar', status: 'Connected', authType: 'OAuth 2.0' },
  { id: 'srv-3', name: 'Stripe Gateway', category: 'Payment', status: 'Connected', authType: 'API Key' },
  { id: 'srv-4', name: 'Twilio SMS Gateway', category: 'Messaging', status: 'Disconnected', authType: 'API Key' },
];

const INITIAL_RULES: AutomationRule[] = [
  { id: 'rule-1', triggerEvent: 'Invoice Overdue', actionService: 'Twilio SMS', actionDetails: 'Send payment reminder template', status: 'Active' },
  { id: 'rule-2', triggerEvent: 'Booking Confirmed', actionService: 'Outlook Calendar', actionDetails: 'Schedule site visit invite', status: 'Active' },
  { id: 'rule-3', triggerEvent: 'Project Completed', actionService: 'Google Drive', actionDetails: 'Create archive folder hierarchy', status: 'Paused' },
];

const INITIAL_KEYS: ApiKeyRecord[] = [
  { id: 'key-101', name: 'ERP Sync Token', prefix: 'dbc_live_8a...', scope: 'Read-Write', createdAt: '24 Jun 2026' },
  { id: 'key-102', name: 'BI Read Only Key', prefix: 'dbc_live_2b...', scope: 'Read-Only', createdAt: '15 Jul 2026' },
];

const INITIAL_LOGS: IntegrationLog[] = [
  { id: 'log-901', timestamp: '10 mins ago', type: 'Webhook outgoing', service: 'Stripe webhook', status: 'Success', details: 'Delivered payment confirmation payload for inv-301.' },
  { id: 'log-902', timestamp: '1 hour ago', type: 'API Request', service: 'Google Drive API', status: 'Success', details: 'Uploaded blueprint: Architectural Ground Plan v1.2.pdf.' },
  { id: 'log-903', timestamp: '2 hours ago', type: 'Webhook outgoing', service: 'ERP Endpoint', status: 'Failed', details: 'Network timeout (code 504) targeting erp.enterprise-builder.com.' },
];

export function IntegrationAutomationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<IntegrationTab>('dashboard');

  // Interactive configurations
  const [services, setServices] = useState<ConnectedService[]>(INITIAL_SERVICES);
  const [rules, setRules] = useState<AutomationRule[]>(INITIAL_RULES);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>(INITIAL_KEYS);
  const [integrationLogs] = useState<IntegrationLog[]>(INITIAL_LOGS);

  // Automation Rule composer
  const [ruleTrigger, setRuleTrigger] = useState('Invoice Overdue');
  const [ruleService, setRuleService] = useState('Twilio SMS');
  const [ruleAction, setRuleAction] = useState('');

  // API Key composer
  const [keyName, setKeyName] = useState('');
  const [keyScope, setKeyScope] = useState<'Read-Only' | 'Read-Write' | 'Admin'>('Read-Only');

  // Webhook Configuration
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['Project Created']);

  // Context Role
  const token = localStorage.getItem('token') || globalThis.__accessToken;
  let currentUserRole = 'CUSTOMER';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role === 'PROVIDER' ? 'PROVIDER' : 'CUSTOMER';
    } catch (e) {
      console.error(e);
    }
  }

  // Toggle connection state
  const handleToggleService = (id: string) => {
    setServices(prev =>
      prev.map(srv =>
        srv.id === id
          ? { ...srv, status: srv.status === 'Connected' ? 'Disconnected' : 'Connected' }
          : srv
      )
    );
    alert('Connected service authorization status updated.');
  };

  // Add automation rule
  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleAction.trim()) return;

    const newRule: AutomationRule = {
      id: `rule-${Date.now()}`,
      triggerEvent: ruleTrigger,
      actionService: ruleService,
      actionDetails: ruleAction.trim(),
      status: 'Active',
    };

    setRules([...rules, newRule]);
    setRuleAction('');
    alert('Automation rule compiled and activated.');
  };

  // Generate API Key
  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const prefixVal = `dbc_live_${Math.random().toString(36).substring(2, 6)}...`;
    const newKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      name: keyName.trim(),
      prefix: prefixVal,
      scope: keyScope,
      createdAt: new Date().toLocaleDateString('en-IN'),
    };

    setApiKeys([...apiKeys, newKey]);
    setKeyName('');
    alert(`Token generated: ${prefixVal} Scope: ${keyScope}. Store it securely.`);
  };

  // Configure Webhook Target
  const handleConfigureWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    alert(`Webhook endpoint target mapped to ${webhookUrl}. Trigger events: ${webhookEvents.join(', ')}.`);
    setWebhookUrl('');
  };

  // Toggle rule status
  const handleToggleRuleStatus = (id: string) => {
    setRules(prev =>
      prev.map(r => (r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r))
    );
  };

  return (
    <div className="min-h-screen bg-warm-cream text-stone-900 font-sans flex flex-col pb-10">
      
      {/* 1. Header Shell */}
      <header className="sticky top-0 z-30 border-b border-light-border bg-white shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="header" />
            <span className="rounded bg-stone-900 px-2.5 py-0.5 text-3xs font-black text-white uppercase tracking-wider">
              Integrations Desk
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-xs font-bold text-stone-600 hover:text-stone-900 transition bg-light-stone/30 px-3 py-1.5 rounded-xl border border-light-border"
            >
              Exit Workspace
            </button>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* 2. Sub-Tab Switcher Row */}
      <main className="mx-auto max-w-6xl w-full px-4 py-8 sm:px-6 space-y-6 flex-1 text-left">
        
        <section className="flex gap-2 border-b border-stone-200 overflow-x-auto pb-1 text-3xs font-black uppercase tracking-wider no-scrollbar">
          {([
            { id: 'dashboard', label: 'Connected Services', icon: '🔌' },
            { id: 'workflows', label: 'Automation Rules', icon: '⚡' },
            { id: 'apikeys', label: 'REST API & Webhooks', icon: '🔑' },
            { id: 'developer', label: 'Developer Portal', icon: '📖' },
            { id: 'logs', label: 'Integration Logs', icon: '📋' },
          ] as const).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 border-b-2 font-bold transition whitespace-nowrap cursor-pointer select-none
                  ${isActive 
                    ? 'border-emerald-600 text-emerald-800 font-extrabold' 
                    : 'border-transparent text-stone-500 hover:text-stone-900'
                  }
                `}
              >
                <span>{t.icon}</span>
                <span className="ml-1.5">{t.label}</span>
              </button>
            );
          })}
        </section>

        {/* 3. Tab Contents Layout */}

        {/* CONNECTED SERVICES */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="dbc-card p-5">
                <span className="text-3xs font-black uppercase tracking-wider text-stone-gray">API requests</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">45,820 <span className="text-3xs text-stone-gray">/ day</span></h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-3xs font-black uppercase tracking-wider text-stone-gray">Webhooks Dispatched</span>
                <h4 className="text-xl font-extrabold text-stone-black mt-1">1,240 events</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-3xs font-black uppercase tracking-wider text-stone-gray">Average API Latency</span>
                <h4 className="text-xl font-extrabold text-brand-emerald mt-1">~14ms</h4>
              </div>
              <div className="dbc-card p-5">
                <span className="text-3xs font-black uppercase tracking-wider text-stone-gray">Webhook success rate</span>
                <h4 className="text-xl font-extrabold text-brand-emerald mt-1">99.8%</h4>
              </div>
            </div>

            {/* Services Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Integrations Directory</h3>
              <div className="grid gap-6 sm:grid-cols-2">
                {services.map((srv) => (
                  <div key={srv.id} className="dbc-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="bg-light-stone text-stone-gray text-3xs font-black px-1.5 py-0.5 rounded border border-light-border uppercase">
                        {srv.category}
                      </span>
                      <h4 className="text-xs font-black text-stone-black mt-1.5">{srv.name}</h4>
                      <span className="block text-3xs text-stone-gray font-bold mt-0.5">Auth Mode: {srv.authType}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`dbc-badge text-3xs py-0.5 uppercase ${
                        srv.status === 'Connected' ? 'dbc-badge-completed' : 'dbc-badge-priority'
                      }`}>{srv.status}</span>
                      
                      <button
                        onClick={() => handleToggleService(srv.id)}
                        className={`font-black text-3xs hover:underline uppercase focus:outline-none ${
                          srv.status === 'Connected' ? 'text-rose-600' : 'text-brand-emerald'
                        }`}
                      >
                        {srv.status === 'Connected' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* AUTOMATION RULES */}
        {activeTab === 'workflows' && (
          <div className="grid gap-6 sm:grid-cols-2 text-left">
            
            {/* Rules list */}
            <div className="space-y-4">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Active Workflow Rules</h3>
                
                {rules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-light-stone/20 border border-light-border rounded-2xl flex justify-between items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-brand-emerald text-white text-3xs font-black px-1.5 py-0.5 rounded">IF</span>
                        <strong className="text-stone-black font-extrabold">{rule.triggerEvent}</strong>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-stone-500 text-white text-3xs font-black px-1.5 py-0.5 rounded">THEN</span>
                        <span className="text-stone-gray font-semibold">{rule.actionService} &bull; {rule.actionDetails}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`dbc-badge text-3xs py-0.5 uppercase ${
                        rule.status === 'Active' ? 'dbc-badge-completed' : 'dbc-badge-planning'
                      }`}>{rule.status}</span>
                      
                      <button
                        onClick={() => handleToggleRuleStatus(rule.id)}
                        className="text-3xs font-black text-stone-gray hover:underline focus:outline-none"
                      >
                        {rule.status === 'Active' ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create rule form */}
            {(currentUserRole === 'PROVIDER' || currentUserRole === 'ADMIN') && (
              <form onSubmit={handleAddRule} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Formulate Automation Rule</h3>
                
                <div className="grid gap-4 grid-cols-2 text-xs font-semibold text-stone-gray">
                  <div>
                    <label className="block mb-1">Trigger Event (IF)</label>
                    <select aria-label="Trigger Event (IF)" value={ruleTrigger} onChange={(e) => setRuleTrigger(e.target.value)} className="dbc-input bg-white">
                      <option value="Invoice Overdue">Invoice is Overdue</option>
                      <option value="Booking Confirmed">Booking is Confirmed</option>
                      <option value="Project Completed">Project is Completed</option>
                      <option value="Requirement Created">Requirement is Submitted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1">Target Service (THEN)</label>
                    <select aria-label="Target Service (THEN)" value={ruleService} onChange={(e) => setRuleService(e.target.value)} className="dbc-input bg-white">
                      <option value="Twilio SMS">Twilio SMS Gateway</option>
                      <option value="Outlook Calendar">Outlook Calendar Sync</option>
                      <option value="Google Drive">Google Drive storage</option>
                      <option value="Stripe payment">Stripe invoice release</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Action instructions details (e.g. Send WhatsApp payment reminder template)"
                  value={ruleAction}
                  onChange={(e) => setRuleAction(e.target.value)}
                  className="dbc-input"
                  required
                />

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Activate Rule
                </button>
              </form>
            )}

          </div>
        )}

        {/* REST API & WEBHOOKS */}
        {activeTab === 'apikeys' && (
          <div className="grid gap-6 sm:grid-cols-3">
            
            {/* API Keys list */}
            <div className="sm:col-span-2 space-y-6 text-left">
              <div className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">REST API Tokens</h3>
                
                <div className="dbc-table-container">
                  <table className="dbc-table" aria-label="REST API Tokens">
                    <thead>
                      <tr>
                        <th>Token Name</th>
                        <th>Prefix</th>
                        <th>Scope</th>
                        <th>Created</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiKeys.map((k) => (
                        <tr key={k.id}>
                          <td className="font-semibold text-stone-black">{k.name}</td>
                          <td><code>{k.prefix}</code></td>
                          <td>
                            <span className="dbc-badge text-3xs py-0.5">{k.scope}</span>
                          </td>
                          <td>{k.createdAt}</td>
                          <td className="text-right">
                            <button
                              onClick={() => {
                                setApiKeys(prev => prev.filter(x => x.id !== k.id));
                                alert('API Key revoked successfully.');
                              }}
                              className="text-rose-600 hover:underline font-black text-3xs uppercase focus:outline-none"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Configure Webhooks URL target */}
              <form onSubmit={handleConfigureWebhook} className="dbc-card space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Outgoing Webhooks Settings</h3>
                
                <input
                  type="url"
                  placeholder="https://erp.your-company.com/webhooks/dbc"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="dbc-input"
                  required
                />
                
                <div className="space-y-2">
                  <span className="block text-3xs font-black uppercase tracking-widest text-stone-gray">Trigger Events Checklist</span>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-gray">
                    {['Project Created', 'Payment Completed', 'Invoice Paid', 'Booking Confirmed'].map((evt) => (
                      <label key={evt} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(evt)}
                          onChange={() => {
                            setWebhookEvents(prev =>
                              prev.includes(evt) ? prev.filter(x => x !== evt) : [...prev, evt]
                            );
                          }}
                          className="w-4 h-4 rounded text-brand-emerald focus:ring-brand-emerald"
                        />
                        <span>{evt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="dbc-btn dbc-btn-primary py-2 px-6 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Update Endpoint configuration
                </button>
              </form>
            </div>

            {/* Create API Key form */}
            {(currentUserRole === 'PROVIDER' || currentUserRole === 'ADMIN') && (
              <form onSubmit={handleGenerateKey} className="dbc-card space-y-4 h-fit">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Generate Access Key</h3>
                
                <input
                  type="text"
                  placeholder="Key description (e.g. CRM Sync)"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  className="dbc-input"
                  required
                />
                
                <div className="space-y-1.5">
                  <label className="block text-3xs font-black uppercase tracking-widest text-stone-gray">Permission Scope</label>
                  <select aria-label="Permission Scope"
                    value={keyScope}
                    onChange={(e) => setKeyScope(e.target.value as 'Read-Only' | 'Read-Write' | 'Admin')}
                    className="dbc-input bg-white"
                  >
                    <option value="Read-Only">Read-Only (GET requests)</option>
                    <option value="Read-Write">Read-Write (GET & POST)</option>
                    <option value="Admin">Full Admin clearance</option>
                  </select>
                </div>

                <button type="submit" className="w-full dbc-btn dbc-btn-primary py-2 text-xs font-bold uppercase tracking-wider cursor-pointer">
                  Generate Key
                </button>
              </form>
            )}

          </div>
        )}

        {/* DEVELOPER PORTAL */}
        {activeTab === 'developer' && (
          <div className="dbc-card space-y-6 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black border-b border-light-border/40 pb-2">Public REST API References</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-stone-black">🔑 Authorization Model</h4>
                <p className="text-xs text-stone-gray leading-relaxed font-semibold mt-1">
                  Authenticate your scripts by sending the generated API Key inside the HTTP Request Header:
                </p>
                <pre className="p-3 bg-light-stone/30 border border-light-border rounded-xl text-2xs font-mono text-stone-black mt-2">
                  Authorization: Bearer dbc_live_8a221f4bdc802
                </pre>
              </div>

              <div>
                <h4 className="text-xs font-black text-stone-black">⚡ API Rate Limits</h4>
                <p className="text-xs text-stone-gray leading-relaxed font-semibold mt-1">
                  Enterprise limits are capped at <strong>60 requests per minute</strong> per token. Responses exceed rate thresholds will output standard HTTP 429 warnings.
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-black text-stone-black">📁 OpenAPI v3 Spec & SDK Downloads</h4>
                <p className="text-xs text-stone-gray leading-relaxed font-semibold mt-1">
                  Download SDK libraries to bootstrap integrations in Node.js, Python, or Go.
                </p>
                <div className="flex gap-2 pt-2 text-3xs font-black uppercase tracking-wider">
                  <button onClick={() => alert('Downloading Node.js SDK...')} className="dbc-btn dbc-btn-outline bg-white py-1.5 px-4 cursor-pointer">
                    Node.js SDK
                  </button>
                  <button onClick={() => alert('Downloading Python SDK...')} className="dbc-btn dbc-btn-outline bg-white py-1.5 px-4 cursor-pointer">
                    Python SDK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATION LOGS */}
        {activeTab === 'logs' && (
          <div className="dbc-card space-y-4 text-left">
            <h3 className="text-xs font-black uppercase tracking-wider text-stone-black">Webhooks & API Call History</h3>
            <div className="divide-y divide-light-border/40">
              {integrationLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex justify-between items-center text-2xs text-stone-gray font-semibold">
                  <div>
                    <span className={`dbc-badge text-3xs py-0.5 uppercase mr-2.5 ${
                      log.status === 'Success' ? 'dbc-badge-completed' : 'dbc-badge-priority'
                    }`}>{log.status}</span>
                    <strong className="text-stone-black">{log.type}</strong>: {log.details}
                  </div>
                  <span className="text-3xs text-stone-gray font-bold">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
export default IntegrationAutomationPage;
