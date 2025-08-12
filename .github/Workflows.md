# 🚀 GitHub Workflows for SmartFix API

This directory contains comprehensive GitHub Actions workflows for the SmartFix Service Providers Platform, providing automated testing, security scanning, performance testing, and deployment.

## 📋 Workflow Overview

### 🧪 Continuous Integration (`ci.yml`)
**Triggers:** Push to main/develop, Pull Requests
**Purpose:** Comprehensive testing and quality assurance

**Jobs:**
- **🔍 Lint & Format Check** - ESLint, Prettier, TypeScript validation
- **🔒 Security Scan** - NPM audit, Snyk, TruffleHog secrets scanning
- **🧪 Unit Tests** - Cross-platform testing (Node.js 16.x, 18.x, 20.x)
- **🔗 Integration Tests** - Database integration with MongoDB & Redis
- **🎭 E2E Tests** - End-to-end application testing
- **⚡ Performance Tests** - Load testing with K6
- **🏗️ Build & Docker** - Application build and Docker image creation
- **🚪 Quality Gate** - Final validation before deployment

### 🚀 Continuous Deployment (`cd.yml`)
**Triggers:** Successful CI on main branch, Tags
**Purpose:** Automated deployment to staging and production

**Jobs:**
- **🎯 Prepare Deployment** - Version determination and environment setup
- **🐳 Build Production Image** - Multi-arch Docker image creation
- **🎭 Deploy to Staging** - Kubernetes deployment with smoke tests
- **🏭 Deploy to Production** - Blue-Green deployment strategy
- **🗄️ Database Migration** - Automated schema updates
- **📊 Setup Monitoring** - Datadog integration and alerting
- **📢 Notify Team** - Slack and email notifications

### 🔒 Security Scanning (`security.yml`)
**Triggers:** Daily schedule, Push, Pull Requests, Manual
**Purpose:** Comprehensive security analysis

**Jobs:**
- **🔍 Dependency Vulnerability Scan** - NPM audit, Snyk analysis
- **🔐 Secret Scanning** - TruffleHog, GitLeaks detection
- **🛡️ Static Application Security Testing** - ESLint security, Semgrep, CodeQL
- **🐳 Docker Image Security Scan** - Trivy, Snyk container analysis
- **🏗️ Infrastructure Security Scan** - Checkov IaC analysis
- **✅ Security Compliance Check** - Automated compliance reporting
- **🚨 Security Notification** - Alert security team of issues

### ⚡ Performance Testing (`performance.yml`)
**Triggers:** Push, Pull Requests, Daily schedule, Manual
**Purpose:** Performance validation and monitoring

**Jobs:**
- **🏋️ Load Testing** - Normal load simulation with K6
- **💪 Stress Testing** - Breaking point analysis
- **📈 Spike Testing** - Traffic spike handling
- **🏃 Endurance Testing** - Long-term stability (60 minutes)
- **📊 Performance Analysis** - Comprehensive reporting and trends
- **📢 Performance Notification** - Team alerts and summaries

## 🔧 Required Secrets

### Authentication & Access
```bash
# Docker Registry
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# AWS (for Kubernetes deployment)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID_PROD=your-prod-aws-access-key
AWS_SECRET_ACCESS_KEY_PROD=your-prod-aws-secret-key
AWS_REGION_PROD=us-east-1
```

### Security & Monitoring
```bash
# Security Scanning
SNYK_TOKEN=your-snyk-token
GITLEAKS_LICENSE=your-gitleaks-license

# Monitoring
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
```

### Database & Environment
```bash
# Database
MONGODB_URI=mongodb://user:pass@host:port/database
MONGODB_URI_STAGING=mongodb://user:pass@staging-host:port/database

# API Keys
STAGING_API_KEY=your-staging-api-key
PRODUCTION_API_KEY=your-production-api-key
```

### Notifications
```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SECURITY_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
PERFORMANCE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Email
EMAIL_USERNAME=notifications@smartfix.com
EMAIL_PASSWORD=your-email-password
TEAM_EMAIL=team@smartfix.com
SECURITY_TEAM_EMAIL=security@smartfix.com
```

## 🏗️ Infrastructure Requirements

### Kubernetes Clusters
- **Staging:** `smartfix-staging` EKS cluster
- **Production:** `smartfix-production` EKS cluster

### Required Kubernetes Resources
```yaml
# Namespace
apiVersion: v1
kind: Namespace
metadata:
  name: smartfix-staging
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartfix-api-staging
  namespace: smartfix-staging
spec:
  replicas: 2
  selector:
    matchLabels:
      app: smartfix-api
  template:
    metadata:
      labels:
        app: smartfix-api
    spec:
      containers:
      - name: smartfix-api
        image: ghcr.io/abdoElHodaky/smartfixapi:latest
        ports:
        - containerPort: 3000
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: smartfix-api-service
  namespace: smartfix-staging
spec:
  selector:
    app: smartfix-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 📊 Monitoring & Alerting

### Datadog Integration
- **Deployment Markers** - Track deployments across environments
- **Custom Metrics** - Application performance monitoring
- **Error Tracking** - Automated error detection and alerting
- **Performance Monitoring** - Response time and throughput tracking

### Slack Notifications
- **#deployments** - Deployment status updates
- **#security-alerts** - Security scan results and alerts
- **#performance** - Performance test results and trends

### Email Alerts
- **Deployment Failures** - Critical deployment issues
- **Security Alerts** - High-priority security findings
- **Performance Degradation** - Performance threshold violations

## 🎯 Quality Gates

### CI Quality Requirements
- ✅ Lint checks must pass
- ✅ All unit tests must pass
- ✅ Integration tests must pass
- ✅ E2E tests must pass
- ✅ Security scans must not find critical issues
- ✅ Build must complete successfully

### Performance Thresholds
- **Response Time:** P95 < 500ms
- **Error Rate:** < 10%
- **Throughput:** > 100 RPS
- **Memory Usage:** < 512MB per instance

### Security Requirements
- **Vulnerability Scan:** No critical or high vulnerabilities
- **Secret Scan:** No exposed secrets
- **SAST:** No high-severity security issues
- **Container Scan:** No critical container vulnerabilities

## 🚀 Deployment Strategy

### Blue-Green Deployment
1. **Deploy Green** - New version deployed alongside current (blue)
2. **Health Check** - Verify green deployment health
3. **Traffic Switch** - Route traffic from blue to green
4. **Smoke Tests** - Validate production functionality
5. **Cleanup** - Remove old blue deployment

### Rollback Strategy
- **Automatic Rollback** - On health check failures
- **Manual Rollback** - Via GitHub Actions workflow dispatch
- **Database Rollback** - Separate migration rollback process

## 📈 Performance Testing

### Test Types
- **Load Testing** - Normal expected load (50 users, 5 minutes)
- **Stress Testing** - Beyond normal capacity to find breaking point
- **Spike Testing** - Sudden traffic increases
- **Endurance Testing** - Extended duration (60 minutes) for memory leaks

### K6 Test Scenarios
- **30%** Health checks and basic endpoints
- **30%** User operations (profile, search)
- **20%** Provider operations (dashboard, requests)
- **20%** Service request operations (create, manage)

## 🔧 Customization

### Workflow Triggers
Modify triggers in workflow files:
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Environment Variables
Update environment variables in workflow files:
```yaml
env:
  NODE_VERSION: '18.x'
  MONGODB_VERSION: '6.0'
  PERFORMANCE_DURATION: '10m'
  PERFORMANCE_USERS: '100'
```

### Notification Channels
Customize notification settings:
```yaml
- name: 📢 Custom notification
  uses: 8398a7/action-slack@v3
  with:
    channel: '#your-channel'
    webhook_url: ${{ secrets.YOUR_WEBHOOK_URL }}
```

## 🐛 Troubleshooting

### Common Issues

**1. Docker Build Failures**
- Check Dockerfile.prod syntax
- Verify base image availability
- Ensure all dependencies are listed

**2. Kubernetes Deployment Failures**
- Verify cluster connectivity
- Check resource quotas
- Validate YAML manifests

**3. Test Failures**
- Review test logs in GitHub Actions
- Check database connectivity
- Verify environment variables

**4. Security Scan Failures**
- Review vulnerability reports
- Update dependencies
- Fix identified security issues

### Debug Commands
```bash
# Local testing
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:performance

# Docker testing
npm run docker:build
npm run docker:run

# Security testing
npm audit
npm audit fix
```

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [K6 Performance Testing](https://k6.io/docs/)
- [Snyk Security Scanning](https://docs.snyk.io/)
- [Datadog Monitoring](https://docs.datadoghq.com/)
- [Kubernetes Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)

---

**🎯 Need Help?** Contact the DevOps team or create an issue in the repository for workflow-related questions.

