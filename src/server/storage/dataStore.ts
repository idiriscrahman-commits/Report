/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import type {
  User,
  Report,
  Category,
  NotificationItem,
  AuditLogItem,
  ApplicationSettings,
  DashboardStats,
  ReportsFilterQuery,
} from '../../types/index.ts';
import {
  UserModel,
  CategoryModel,
  ReportModel,
  NotificationModel,
  AuditLogModel,
  SettingModel,
} from '../models/mongooseModels.ts';

const DATA_DIR = path.resolve('.data');
const DB_FILE = path.join(DATA_DIR, 'srms-db.json');

interface StoredUser extends User {
  passwordHash: string;
}

interface InMemoryDB {
  users: StoredUser[];
  categories: Category[];
  reports: Report[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  settings: ApplicationSettings;
  counter: number;
}

class DataStore {
  private db: InMemoryDB = {
    users: [],
    categories: [],
    reports: [],
    notifications: [],
    auditLogs: [],
    settings: {
      appName: 'System Report Management System',
      organizationName: 'Global Defense & Infrastructure Corp.',
      reportPrefix: 'REP',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      allowPublicRegistration: false,
      defaultVisibility: 'Internal',
      retentionDays: 365,
      updatedAt: new Date().toISOString(),
    },
    counter: 100,
  };

  private isMongoConnected = false;
  private isInitialized = false;

  async init(mongoUri?: string) {
    if (this.isInitialized) return;

    if (mongoUri && mongoUri.startsWith('mongodb')) {
      try {
        console.log('[SRMS Database] Attempting connection to MongoDB Atlas...');
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 4000,
        });
        this.isMongoConnected = true;
        console.log('[SRMS Database] Connected to MongoDB Atlas successfully.');
      } catch (err) {
        console.warn('[SRMS Database] MongoDB Atlas connection failed or timed out. Falling back to persistent local storage.', (err as Error).message);
        this.isMongoConnected = false;
      }
    } else {
      console.log('[SRMS Database] No MONGODB_URI provided. Running in persistent local store mode.');
    }

    // Load local file if exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        if (parsed.users && parsed.reports) {
          this.db = parsed;
          console.log(`[SRMS Database] Loaded ${this.db.reports.length} reports and ${this.db.users.length} users from storage.`);
        }
      } catch (e) {
        console.error('[SRMS Database] Error reading local db file, will seed fresh:', e);
      }
    }

    // If database is empty, seed deterministic sample data
    if (this.db.users.length === 0) {
      await this.seedInitialData();
    }

    this.isInitialized = true;
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('[SRMS Database] Error persisting database to file:', e);
    }
  }

  private async seedInitialData() {
    console.log('[SRMS Database] Seeding initial users, categories, and enterprise reports...');
    const now = new Date().toISOString();

    const adminHash = await bcrypt.hash('AdminPass123!', 10);
    const staffHash = await bcrypt.hash('StaffPass123!', 10);
    const viewerHash = await bcrypt.hash('ViewerPass123!', 10);

    const users: StoredUser[] = [
      {
        id: 'usr_admin_001',
        name: 'Dr. Evelyn Reed',
        email: 'admin@srms.org',
        passwordHash: adminHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: {
          department: 'Executive Operations',
          title: 'Lead Systems Director & Admin',
          phone: '+1 (555) 019-2834',
          bio: 'Oversees platform governance, audit oversight, and system-wide enterprise report compliance.',
        },
        createdAt: '2026-01-10T08:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_staff_002',
        name: 'Sarah Chen',
        email: 'sarah.engineer@srms.org',
        passwordHash: staffHash,
        role: 'STAFF',
        status: 'ACTIVE',
        profile: {
          department: 'Infrastructure & Platform',
          title: 'Senior DevOps Architect',
          phone: '+1 (555) 019-8742',
          bio: 'Manages multi-region cloud clusters, automated CI/CD deployments, and telemetry infrastructure.',
        },
        createdAt: '2026-01-15T09:30:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_staff_003',
        name: 'Marcus Vance',
        email: 'marcus.vance@srms.org',
        passwordHash: staffHash,
        role: 'STAFF',
        status: 'ACTIVE',
        profile: {
          department: 'Security & Incident Response',
          title: 'Principal Security Analyst',
          phone: '+1 (555) 019-3321',
          bio: 'Specializes in vulnerability mitigation, zero-trust perimeter auditing, and forensic investigations.',
        },
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: now,
      },
      {
        id: 'usr_viewer_004',
        name: 'Alex Mercer',
        email: 'alex.auditor@srms.org',
        passwordHash: viewerHash,
        role: 'VIEWER',
        status: 'ACTIVE',
        profile: {
          department: 'Internal Quality & Audit',
          title: 'Senior Regulatory Auditor',
          phone: '+1 (555) 019-5561',
          bio: 'Conducts read-only compliance assessments, SOX reviews, and executive reporting audits.',
        },
        createdAt: '2026-02-10T11:00:00.000Z',
        updatedAt: now,
      },
    ];

    const categories: Category[] = [
      {
        id: 'cat_tech',
        name: 'Technical & Architecture',
        description: 'Systems design, infrastructure upgrades, database migrations, and performance benchmarks.',
        color: '#2563eb',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'cat_incident',
        name: 'Incident & Outage',
        description: 'Post-mortem analyses, emergency responses, root-cause investigations, and remediation plans.',
        color: '#dc2626',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'cat_operations',
        name: 'Daily Operations',
        description: 'Daily activity briefings, shift handovers, operational checklists, and resource utilization.',
        color: '#059669',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'cat_research',
        name: 'Research & Development',
        description: 'Empirical experiments, technological feasibility studies, machine learning trials, and prototypes.',
        color: '#7c3aed',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'cat_financial',
        name: 'Business & Financial',
        description: 'Budget allocations, vendor cost evaluations, quarterly revenue reports, and fiscal audits.',
        color: '#d97706',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
      {
        id: 'cat_academic',
        name: 'Academic & University',
        description: 'Departmental curriculum reviews, lab equipment grants, student evaluations, and faculty publications.',
        color: '#0891b2',
        active: true,
        createdBy: 'usr_admin_001',
        createdAt: '2026-01-10T08:00:00.000Z',
      },
    ];

    const reports: Report[] = [
      {
        id: 'rep_001',
        referenceId: 'REP-2026-0001',
        title: 'Q3 Enterprise Distributed Database Migration & Latency Benchmark',
        categoryId: 'cat_tech',
        categoryName: 'Technical & Architecture',
        reportType: 'Technical',
        reportingDate: '2026-10-15',
        reportingPeriod: 'Q3 2026',
        department: 'Infrastructure & Platform',
        projectName: 'Project Titan Database Modernization',
        summary: 'Completed end-to-end migration of legacy transactional storage to distributed multi-region clusters with a 42% reduction in p99 read latency.',
        background: 'Legacy single-node PostgreSQL reached 88% peak I/O capacity during high-volume reporting hours, risking cascading connection pool failures.',
        objectives: '1. Migrate 18.4M records with zero downtime.\n2. Ensure zero data loss during streaming replication.\n3. Verify read replica latency remains below 15ms globally.',
        description: 'The infrastructure engineering group executed a phased blue/green cutover utilizing dual-write replication and strict CDC (Change Data Capture) validation over a 72-hour observation window.',
        activities: 'Configured automated snapshot validation, verified cross-region sync on AWS/GCP interconnects, simulated synthetic traffic spikes up to 45,000 req/sec, and validated schema integrity.',
        findings: 'Connection pool saturation dropped from 94% to 18%. p99 latency decreased from 145ms to 84ms across European and North American edge nodes.',
        results: 'Migration completed with exactly zero dropped transactions and clean data integrity checks.',
        challenges: 'Network jitter on secondary VPN link required manual MTU optimization and TCP window resizing.',
        recommendations: 'Implement automated schema migration checks in the CI/CD pipeline and enable proactive disk autoscaling.',
        conclusion: 'The new distributed database cluster is certified for general production traffic.',
        notes: 'Signed off by Infrastructure Architecture Lead.',
        status: 'Approved',
        priority: 'High',
        tags: ['Database', 'Migration', 'Infrastructure', 'Performance'],
        author: {
          id: 'usr_staff_002',
          name: 'Sarah Chen',
          email: 'sarah.engineer@srms.org',
          department: 'Infrastructure & Platform',
        },
        ownerId: 'usr_staff_002',
        visibility: 'Internal',
        attachments: [
          {
            id: 'att_01',
            name: 'benchmark_latency_graphs.pdf',
            size: 2450000,
            type: 'application/pdf',
            uploadedAt: '2026-10-15T14:20:00.000Z',
          },
        ],
        version: 2,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_staff_002',
            editedByName: 'Sarah Chen',
            editedAt: '2026-10-14T11:00:00.000Z',
            changesSummary: 'Initial draft with migration metrics.',
            status: 'Submitted',
          },
          {
            version: 2,
            editedBy: 'usr_admin_001',
            editedByName: 'Dr. Evelyn Reed',
            editedAt: '2026-10-15T16:00:00.000Z',
            changesSummary: 'Approved report with executive commentary.',
            status: 'Approved',
          },
        ],
        reviewNotes: 'Outstanding execution and comprehensive telemetry graphs. Approved.',
        createdAt: '2026-10-14T11:00:00.000Z',
        updatedAt: '2026-10-15T16:00:00.000Z',
      },
      {
        id: 'rep_002',
        referenceId: 'REP-2026-0002',
        title: 'Post-Incident Analysis: API Gateway Rate Limiter Throttling Incident',
        categoryId: 'cat_incident',
        categoryName: 'Incident & Outage',
        reportType: 'Incident',
        reportingDate: '2026-10-18',
        reportingPeriod: 'October 2026',
        department: 'Security & Incident Response',
        projectName: 'Gateway Reliability',
        summary: 'Root cause analysis and mitigation protocol following a 14-minute intermittent 429 throttling window impacting external webhooks.',
        background: 'At 10:14 UTC, our public webhook ingestion ingress began rejecting valid enterprise telemetry payloads with HTTP 429 Too Many Requests.',
        objectives: 'Diagnose Redis rate-limiter cluster partition, identify missing exponential backoff in client SDK, and restore ingress throughput.',
        description: 'A misconfigured Redis memory eviction policy triggered temporary key eviction storms, causing the token bucket algorithm to default to rejection mode.',
        activities: 'Isolated failed cluster nodes, patched Redis maxmemory-policy to volatile-lru, rolled out hotfix v4.2.1, and replayed queued webhooks.',
        findings: 'Zero data lost due to secondary dead-letter disk queues. All 34,200 delayed events reprocessed cleanly within 18 minutes of resolution.',
        results: 'Full gateway traffic normalized by 10:28 UTC. Redundant Redis replica pair established.',
        challenges: 'Simultaneous alert storm triggered notification throttling for on-call engineers.',
        recommendations: 'Decouple emergency ingress alerting from public notification channels and enforce distributed token leasing.',
        conclusion: 'Incident fully mitigated; preventative action items assigned to Platform Security.',
        notes: 'Severity: P2 Incident. SLA impact: 0.02% monthly availability drop.',
        status: 'Approved',
        priority: 'Urgent',
        tags: ['Incident', 'Gateway', 'Security', 'Post-Mortem'],
        author: {
          id: 'usr_staff_003',
          name: 'Marcus Vance',
          email: 'marcus.vance@srms.org',
          department: 'Security & Incident Response',
        },
        ownerId: 'usr_staff_003',
        visibility: 'Internal',
        attachments: [],
        version: 1,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_staff_003',
            editedByName: 'Marcus Vance',
            editedAt: '2026-10-18T12:00:00.000Z',
            changesSummary: 'Initial incident report compilation.',
            status: 'Approved',
          },
        ],
        reviewNotes: 'Verified root cause and confirmed preventative guardrails are in place.',
        createdAt: '2026-10-18T11:45:00.000Z',
        updatedAt: '2026-10-18T13:30:00.000Z',
      },
      {
        id: 'rep_003',
        referenceId: 'REP-2026-0003',
        title: 'Daily Platform Operations & Automated Cluster Health Briefing',
        categoryId: 'cat_operations',
        categoryName: 'Daily Operations',
        reportType: 'Daily Activity',
        reportingDate: '2026-10-19',
        reportingPeriod: 'Daily',
        department: 'Infrastructure & Platform',
        summary: 'Standard daily briefing covering container node health, backup verification, and SSL certificate rotation cycles.',
        description: 'All 48 Kubernetes worker nodes operated at 41% average CPU utilization and 62% memory allocation throughout the 24-hour cycle.',
        activities: 'Completed routine log rotation, executed cold storage database snapshot verifications, and rotated ingress TLS certificates.',
        findings: 'Disk space on Elasticsearch cluster node es-03 passed 75% threshold; cleanup routine freed 380GB.',
        results: '100% of automated smoke tests passed without manual intervention.',
        recommendations: 'Schedule automated purge of staging debug logs older than 14 days.',
        status: 'Submitted',
        priority: 'Low',
        tags: ['Operations', 'Daily', 'Kubernetes', 'Health'],
        author: {
          id: 'usr_staff_002',
          name: 'Sarah Chen',
          email: 'sarah.engineer@srms.org',
          department: 'Infrastructure & Platform',
        },
        ownerId: 'usr_staff_002',
        visibility: 'Public',
        attachments: [],
        version: 1,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_staff_002',
            editedByName: 'Sarah Chen',
            editedAt: '2026-10-19T17:00:00.000Z',
            changesSummary: 'Submitted daily operations briefing.',
            status: 'Submitted',
          },
        ],
        createdAt: '2026-10-19T17:00:00.000Z',
        updatedAt: '2026-10-19T17:00:00.000Z',
      },
      {
        id: 'rep_004',
        referenceId: 'REP-2026-0004',
        title: 'Deep Learning Model Compression & Quantization Feasibility Study',
        categoryId: 'cat_research',
        categoryName: 'Research & Development',
        reportType: 'Research',
        reportingDate: '2026-10-20',
        reportingPeriod: 'H2 2026',
        department: 'Research & Intelligence Lab',
        projectName: 'Edge AI Acceleration',
        summary: 'Evaluation of 4-bit and 8-bit post-training quantization on proprietary vision models with target inference on constrained edge hardware.',
        description: 'Benchmarked FP16 baseline against INT8 and INT4 quantization schemes across 12,000 real-world test images.',
        activities: 'Executed calibration runs using representative validation datasets, measured perplexity shift, and profiled GPU vRAM allocation.',
        findings: 'INT8 quantization preserved 99.4% of top-1 accuracy while reducing model memory footprint from 6.8GB to 1.7GB (75% savings).',
        results: 'Achieved sub-18ms inference per image on edge micro-processors.',
        challenges: 'Slight accuracy degradation on low-contrast nighttime captures in 4-bit mode.',
        recommendations: 'Adopt INT8 for all production edge deployments and preserve FP16 for cloud server-side verification pipelines.',
        status: 'Under Review',
        priority: 'Medium',
        tags: ['AI', 'Quantization', 'Research', 'EdgeComputing'],
        author: {
          id: 'usr_staff_003',
          name: 'Marcus Vance',
          email: 'marcus.vance@srms.org',
          department: 'Security & Incident Response',
        },
        ownerId: 'usr_staff_003',
        visibility: 'Confidential',
        attachments: [],
        version: 1,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_staff_003',
            editedByName: 'Marcus Vance',
            editedAt: '2026-10-20T03:00:00.000Z',
            changesSummary: 'Submitted for peer and admin review.',
            status: 'Under Review',
          },
        ],
        createdAt: '2026-10-20T02:30:00.000Z',
        updatedAt: '2026-10-20T03:00:00.000Z',
      },
      {
        id: 'rep_005',
        referenceId: 'REP-2026-0005',
        title: 'Annual Cloud Infrastructure Budget & Multi-Cloud Cost Optimization Draft',
        categoryId: 'cat_financial',
        categoryName: 'Business & Financial',
        reportType: 'Business',
        reportingDate: '2026-10-12',
        reportingPeriod: 'FY 2026-2027',
        department: 'Executive Operations',
        projectName: 'FinOps Efficiency Project',
        summary: 'Comprehensive analysis of multi-cloud compute, egress traffic, and reserved instance utilization projecting $480,000 annual savings.',
        description: 'Detailed financial modeling of existing cloud expenditures with recommendations for 3-year compute savings plans.',
        status: 'Draft',
        priority: 'High',
        tags: ['Finance', 'Budget', 'FinOps', 'CostSaving'],
        author: {
          id: 'usr_admin_001',
          name: 'Dr. Evelyn Reed',
          email: 'admin@srms.org',
          department: 'Executive Operations',
        },
        ownerId: 'usr_admin_001',
        visibility: 'Confidential',
        attachments: [],
        version: 1,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_admin_001',
            editedByName: 'Dr. Evelyn Reed',
            editedAt: '2026-10-12T09:00:00.000Z',
            changesSummary: 'Initial draft calculation.',
            status: 'Draft',
          },
        ],
        createdAt: '2026-10-12T09:00:00.000Z',
        updatedAt: '2026-10-12T09:00:00.000Z',
      },
      {
        id: 'rep_006',
        referenceId: 'REP-2026-0006',
        title: 'Legacy Monolith Deprecation: Deprecated Subsystem Decommissioning',
        categoryId: 'cat_tech',
        categoryName: 'Technical & Architecture',
        reportType: 'Technical',
        reportingDate: '2026-09-28',
        reportingPeriod: 'Q3 2026',
        department: 'Infrastructure & Platform',
        summary: 'Formal documentation archiving the retirement of legacy billing monolith v1 and redirecting all legacy endpoints to modern microservices.',
        description: 'Decommissioned 6 bare-metal server chassis, revoked obsolete API keys, and archived cold database backups to write-once WORM storage.',
        status: 'Archived',
        priority: 'Low',
        tags: ['Deprecation', 'Legacy', 'Architecture'],
        author: {
          id: 'usr_staff_002',
          name: 'Sarah Chen',
          email: 'sarah.engineer@srms.org',
          department: 'Infrastructure & Platform',
        },
        ownerId: 'usr_staff_002',
        visibility: 'Internal',
        attachments: [],
        version: 2,
        revisionHistory: [
          {
            version: 1,
            editedBy: 'usr_staff_002',
            editedByName: 'Sarah Chen',
            editedAt: '2026-09-28T10:00:00.000Z',
            changesSummary: 'Created archive record.',
            status: 'Approved',
          },
          {
            version: 2,
            editedBy: 'usr_admin_001',
            editedByName: 'Dr. Evelyn Reed',
            editedAt: '2026-09-30T15:00:00.000Z',
            changesSummary: 'Moved to permanent archive.',
            status: 'Archived',
          },
        ],
        createdAt: '2026-09-28T10:00:00.000Z',
        updatedAt: '2026-09-30T15:00:00.000Z',
      },
    ];

    const auditLogs: AuditLogItem[] = [
      {
        id: 'log_001',
        actor: {
          id: 'usr_admin_001',
          name: 'Dr. Evelyn Reed',
          email: 'admin@srms.org',
          role: 'ADMIN',
        },
        action: 'REPORT_APPROVED',
        targetType: 'REPORT',
        targetId: 'rep_001',
        targetName: 'Q3 Enterprise Distributed Database Migration',
        metadata: { referenceId: 'REP-2026-0001', previousStatus: 'Submitted' },
        timestamp: '2026-10-15T16:00:00.000Z',
      },
      {
        id: 'log_002',
        actor: {
          id: 'usr_staff_003',
          name: 'Marcus Vance',
          email: 'marcus.vance@srms.org',
          role: 'STAFF',
        },
        action: 'REPORT_SUBMITTED',
        targetType: 'REPORT',
        targetId: 'rep_002',
        targetName: 'Post-Incident Analysis: API Gateway Rate Limiter',
        metadata: { referenceId: 'REP-2026-0002' },
        timestamp: '2026-10-18T12:00:00.000Z',
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif_001',
        recipientId: 'usr_staff_002',
        type: 'APPROVAL',
        title: 'Report Approved: REP-2026-0001',
        message: 'Dr. Evelyn Reed approved your report "Q3 Enterprise Distributed Database Migration & Latency Benchmark".',
        reportId: 'rep_001',
        reportTitle: 'Q3 Enterprise Distributed Database Migration & Latency Benchmark',
        read: false,
        createdAt: '2026-10-15T16:00:00.000Z',
      },
      {
        id: 'notif_002',
        recipientId: 'usr_admin_001',
        type: 'SUBMISSION',
        title: 'New Report Submitted for Review',
        message: 'Marcus Vance submitted report "Deep Learning Model Compression & Quantization Feasibility Study" (REP-2026-0004).',
        reportId: 'rep_004',
        reportTitle: 'Deep Learning Model Compression & Quantization Feasibility Study',
        read: false,
        createdAt: '2026-10-20T03:00:00.000Z',
      },
    ];

    this.db = {
      users,
      categories,
      reports,
      notifications,
      auditLogs,
      settings: this.db.settings,
      counter: 10,
    };

    this.persist();
  }

  // User queries
  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const clean = email.toLowerCase().trim();
    const user = this.db.users.find((u) => u.email.toLowerCase() === clean);
    return user ? { ...user } : null;
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    const user = this.db.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.db.users.map(({ passwordHash, ...rest }) => rest);
  }

  async countAdmins(): Promise<number> {
    return this.db.users.filter((u) => u.role === 'ADMIN' && u.status === 'ACTIVE').length;
  }

  async createUser(data: Omit<StoredUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: StoredUser = {
      ...data,
      id,
      email: data.email.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    };
    this.db.users.push(newUser);
    this.persist();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  async updateUser(id: string, updates: Partial<StoredUser>): Promise<User | null> {
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    const now = new Date().toISOString();
    this.db.users[index] = {
      ...this.db.users[index],
      ...updates,
      updatedAt: now,
    };
    this.persist();
    const { passwordHash, ...safeUser } = this.db.users[index];
    return safeUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.db.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.db.users.splice(index, 1);
    this.persist();
    return true;
  }

  // Category queries
  async getAllCategories(): Promise<Category[]> {
    return [...this.db.categories];
  }

  async findCategoryById(id: string): Promise<Category | null> {
    const cat = this.db.categories.find((c) => c.id === id);
    return cat ? { ...cat } : null;
  }

  async createCategory(data: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const category: Category = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.db.categories.push(category);
    this.persist();
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    const index = this.db.categories.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.db.categories[index] = {
      ...this.db.categories[index],
      ...updates,
    };
    this.persist();
    return { ...this.db.categories[index] };
  }

  async deleteCategory(id: string): Promise<boolean> {
    const index = this.db.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.db.categories.splice(index, 1);
    this.persist();
    return true;
  }

  // Report Queries
  async getReports(query: ReportsFilterQuery, currentUserRole: string, currentUserId: string): Promise<{ reports: Report[]; total: number; page: number; totalPages: number }> {
    let filtered = [...this.db.reports];

    // Filter by visibility / role
    filtered = filtered.filter((r) => {
      if (currentUserRole === 'ADMIN') return true;
      if (r.author.id === currentUserId || r.ownerId === currentUserId) return true;
      if (r.status === 'Draft') return false;
      if (r.status === 'Archived') return false;
      if (r.visibility === 'Confidential') return false;
      return true;
    });

    // Apply query filters
    if (query.status && query.status !== 'All') {
      filtered = filtered.filter((r) => r.status === query.status);
    }

    if (query.category) {
      filtered = filtered.filter((r) => r.categoryId === query.category || r.categoryName.toLowerCase() === query.category?.toLowerCase());
    }

    if (query.priority && query.priority !== 'All') {
      filtered = filtered.filter((r) => r.priority === query.priority);
    }

    if (query.department) {
      filtered = filtered.filter((r) => r.department.toLowerCase().includes(query.department!.toLowerCase()));
    }

    if (query.authorId) {
      filtered = filtered.filter((r) => r.author.id === query.authorId);
    }

    if (query.dateFrom) {
      filtered = filtered.filter((r) => r.reportingDate >= query.dateFrom!);
    }

    if (query.dateTo) {
      filtered = filtered.filter((r) => r.reportingDate <= query.dateTo!);
    }

    if (query.search) {
      const s = query.search.toLowerCase().trim();
      filtered = filtered.filter((r) =>
        r.referenceId.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.summary.toLowerCase().includes(s) ||
        r.author.name.toLowerCase().includes(s) ||
        r.department.toLowerCase().includes(s) ||
        r.tags.some((t) => t.toLowerCase().includes(s))
      );
    }

    // Sort
    const sortField = query.sort || 'reportingDate';
    const order = query.order === 'asc' ? 1 : -1;

    filtered.sort((a, b) => {
      let valA = a[sortField as keyof Report] ?? '';
      let valB = b[sortField as keyof Report] ?? '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });

    const total = filtered.length;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const reports = filtered.slice(offset, offset + limit);

    return {
      reports,
      total,
      page,
      totalPages,
    };
  }

  async findReportById(id: string): Promise<Report | null> {
    const report = this.db.reports.find((r) => r.id === id || r.referenceId === id);
    return report ? { ...report } : null;
  }

  async getNextSequence(): Promise<number> {
    this.db.counter += 1;
    this.persist();
    return this.db.counter;
  }

  async createReport(data: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Report> {
    const now = new Date().toISOString();
    const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const report: Report = {
      ...data,
      id,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.db.reports.unshift(report);
    this.persist();
    return report;
  }

  async updateReport(id: string, updates: Partial<Report>, newVersion = true): Promise<Report | null> {
    const index = this.db.reports.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const current = this.db.reports[index];
    const updated: Report = {
      ...current,
      ...updates,
      version: newVersion ? current.version + 1 : current.version,
      updatedAt: new Date().toISOString(),
    };

    this.db.reports[index] = updated;
    this.persist();
    return updated;
  }

  async deleteReport(id: string): Promise<boolean> {
    const index = this.db.reports.findIndex((r) => r.id === id);
    if (index === -1) return false;
    this.db.reports.splice(index, 1);
    this.persist();
    return true;
  }

  // Dashboard Stats
  async getDashboardStats(currentUserRole: string, currentUserId: string): Promise<DashboardStats> {
    // Only count reports visible to user
    const reports = this.db.reports.filter((r) => {
      if (currentUserRole === 'ADMIN') return true;
      if (r.author.id === currentUserId || r.ownerId === currentUserId) return true;
      if (r.status === 'Draft' || r.status === 'Archived' || r.visibility === 'Confidential') return false;
      return true;
    });

    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalReports = reports.length;
    const draftReports = reports.filter((r) => r.status === 'Draft').length;
    const submittedReports = reports.filter((r) => r.status === 'Submitted').length;
    const underReviewReports = reports.filter((r) => r.status === 'Under Review').length;
    const approvedReports = reports.filter((r) => r.status === 'Approved').length;
    const rejectedReports = reports.filter((r) => r.status === 'Rejected').length;
    const archivedReports = reports.filter((r) => r.status === 'Archived').length;
    const reportsThisMonth = reports.filter((r) => r.reportingDate.startsWith(currentMonthPrefix)).length;

    // By category
    const catCounts = new Map<string, number>();
    reports.forEach((r) => {
      const name = r.categoryName || 'General';
      catCounts.set(name, (catCounts.get(name) || 0) + 1);
    });
    const reportsByCategory = Array.from(catCounts.entries()).map(([category, count]) => {
      const catObj = this.db.categories.find((c) => c.name === category);
      return { category, count, color: catObj?.color || '#3b82f6' };
    });

    // By status
    const statuses: Report['status'][] = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Archived'];
    const reportsByStatus = statuses.map((status) => ({
      status,
      count: reports.filter((r) => r.status === status).length,
    }));

    // By priority
    const priorities: Report['priority'][] = ['Low', 'Medium', 'High', 'Urgent'];
    const reportsByPriority = priorities.map((priority) => ({
      priority,
      count: reports.filter((r) => r.priority === priority).length,
    }));

    // Reports over last 6 months
    const monthlyMap = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, 0);
    }
    reports.forEach((r) => {
      const monthKey = r.reportingDate.substring(0, 7);
      if (monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      }
    });
    const reportsOverTime = Array.from(monthlyMap.entries()).map(([month, count]) => {
      const [y, m] = month.split('-');
      const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'short' });
      return { month: `${monthName} '${y.slice(2)}`, count };
    });

    return {
      totalReports,
      draftReports,
      submittedReports,
      underReviewReports,
      approvedReports,
      rejectedReports,
      archivedReports,
      reportsThisMonth,
      reportsByCategory,
      reportsByStatus,
      reportsByPriority,
      reportsOverTime,
    };
  }

  // Notifications
  async getNotifications(userId: string): Promise<NotificationItem[]> {
    return this.db.notifications
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markNotificationRead(id: string, userId: string): Promise<boolean> {
    const notif = this.db.notifications.find((n) => n.id === id && n.recipientId === userId);
    if (!notif) return false;
    notif.read = true;
    this.persist();
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    this.db.notifications.forEach((n) => {
      if (n.recipientId === userId) n.read = true;
    });
    this.persist();
  }

  async createNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): Promise<NotificationItem> {
    const item: NotificationItem = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.db.notifications.unshift(item);
    this.persist();
    return item;
  }

  // Audit Logs
  async getAuditLogs(limit = 100): Promise<AuditLogItem[]> {
    return this.db.auditLogs.slice(0, limit);
  }

  async createAuditLog(log: Omit<AuditLogItem, 'id' | 'timestamp'>): Promise<AuditLogItem> {
    const item: AuditLogItem = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(item);
    // Keep max 1000 logs
    if (this.db.auditLogs.length > 1000) {
      this.db.auditLogs = this.db.auditLogs.slice(0, 1000);
    }
    this.persist();
    return item;
  }

  // Settings
  async getSettings(): Promise<ApplicationSettings> {
    return { ...this.db.settings };
  }

  async updateSettings(updates: Partial<ApplicationSettings>): Promise<ApplicationSettings> {
    this.db.settings = {
      ...this.db.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return { ...this.db.settings };
  }
}

export const dataStore = new DataStore();
