# SRMS Database Backup & Disaster Recovery Guide

## 1. MongoDB Atlas Automated Backups
When connected to MongoDB Atlas:
- **Cloud Backups**: Enable continuous Cloud Backups with Point-in-Time Restore (PITR) in Atlas cluster settings.
- **Snapshot Frequency**: Recommended snapshot schedule: every 6 hours with 7-day retention for compliance.

## 2. Manual Backup with `mongodump`
To export a full snapshot of the SRMS database:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/srms" --out=/backup/srms-$(date +%Y%m%d_%H%M%S)
```

## 3. Disaster Recovery with `mongorestore`
To restore from a backup snapshot:
```bash
mongorestore --uri="mongodb+srv://<username>:<password>@cluster0.mongodb.net/srms" --drop /backup/srms-20261020_060000/srms
```
*Note: The `--drop` flag clears existing collections before restoring to avoid duplicate ID collisions.*

## 4. Local File Store Backup
When operating in local development or edge mode without an external cluster:
- Database data is stored at `.data/srms-db.json`.
- Automated backup cron can archive this JSON snapshot into cold storage or S3 bucket daily.
