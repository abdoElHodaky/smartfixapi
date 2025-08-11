# Rollback Guide - Codebase Cleanup

## Overview
This guide provides instructions for rolling back the codebase cleanup performed on August 11, 2025. Use this guide if issues arise after the cleanup or if you need to restore removed files.

## Quick Rollback Options

### Option 1: Git Revert (Recommended)
If you need to completely undo the cleanup:

```bash
# Find the cleanup commit
git log --oneline | grep -i cleanup

# Revert the cleanup commit (replace COMMIT_HASH with actual hash)
git revert COMMIT_HASH

# Push the revert
git push origin your-branch-name
```

### Option 2: Selective File Restoration
If you only need specific files back:

```bash
# Restore specific files from the previous commit
git checkout HEAD~1 -- path/to/file.ts

# Or restore from a specific commit
git checkout COMMIT_HASH -- path/to/file.ts
```

## Detailed File Restoration

### Restore App Files
If you need the intermediate app implementations:

```bash
# Restore all app files
git checkout HEAD~1 -- src/app.decorator.ts
git checkout HEAD~1 -- src/app.server.ts
git checkout HEAD~1 -- src/app.modular.ts
```

### Restore Legacy Services
If external dependencies require the old service files:

```bash
# Restore all legacy service files
git checkout HEAD~1 -- src/services/auth/AuthService.ts
git checkout HEAD~1 -- src/services/user/UserService.ts
git checkout HEAD~1 -- src/services/provider/ProviderService.ts
git checkout HEAD~1 -- src/services/request/RequestService.ts
git checkout HEAD~1 -- src/services/request/ServiceRequestService.ts
git checkout HEAD~1 -- src/services/review/ReviewService.ts
git checkout HEAD~1 -- src/services/admin/AdminService.ts
git checkout HEAD~1 -- src/services/chat/ChatService.ts

# Restore service index files
git checkout HEAD~1 -- src/services/auth/index.ts
git checkout HEAD~1 -- src/services/user/index.ts
git checkout HEAD~1 -- src/services/provider/index.ts
git checkout HEAD~1 -- src/services/request/index.ts
git checkout HEAD~1 -- src/services/review/index.ts
git checkout HEAD~1 -- src/services/admin/index.ts
git checkout HEAD~1 -- src/services/chat/index.ts
```

### Restore Controllers
If you need the traditional controller files:

```bash
# Restore controller files
git checkout HEAD~1 -- src/controllers/AdminController.ts
git checkout HEAD~1 -- src/controllers/AuthController.ts
git checkout HEAD~1 -- src/controllers/BaseController.ts
git checkout HEAD~1 -- src/controllers/ChatController.ts
git checkout HEAD~1 -- src/controllers/index.ts
```

### Restore Routes
If external systems depend on traditional routes:

```bash
# Restore route files
git checkout HEAD~1 -- src/routes/admin.ts
git checkout HEAD~1 -- src/routes/chat.ts

# Restore route directories
git checkout HEAD~1 -- src/routes/auth/
git checkout HEAD~1 -- src/routes/user/
git checkout HEAD~1 -- src/routes/provider/
git checkout HEAD~1 -- src/routes/request/
git checkout HEAD~1 -- src/routes/review/
git checkout HEAD~1 -- src/routes/admin/
git checkout HEAD~1 -- src/routes/chat/
```

### Restore Container Files
If legacy DI containers are needed:

```bash
# Restore container files
git checkout HEAD~1 -- src/container/DIContainer.ts
git checkout HEAD~1 -- src/container/ServiceContainer.ts
git checkout HEAD~1 -- src/container/ServiceRegistry.ts
```

### Restore Test Files
If you need the old test files:

```bash
# Restore test files
git checkout HEAD~1 -- src/tests/routes.test.ts
```

## Partial Rollback Scenarios

### Scenario 1: Keep Modular, Restore Legacy Services
If you want to keep the modular architecture but need legacy services for compatibility:

```bash
# Restore only legacy service files
git checkout HEAD~1 -- src/services/*/[A-Z]*.ts
git checkout HEAD~1 -- src/services/*/index.ts

# Update services/index.ts to export both legacy and decorator services
```

### Scenario 2: Keep Cleanup, Restore Specific Components
If the cleanup is mostly good but you need specific components:

```bash
# Example: Restore only auth-related files
git checkout HEAD~1 -- src/services/auth/AuthService.ts
git checkout HEAD~1 -- src/services/auth/index.ts
git checkout HEAD~1 -- src/controllers/AuthController.ts
git checkout HEAD~1 -- src/routes/auth/
```

### Scenario 3: Gradual Rollback
If you want to rollback incrementally:

1. **Start with critical services**:
   ```bash
   git checkout HEAD~1 -- src/services/auth/
   git checkout HEAD~1 -- src/services/user/
   ```

2. **Test the application**:
   ```bash
   npm run dev
   ```

3. **Continue with other components if needed**:
   ```bash
   git checkout HEAD~1 -- src/controllers/
   git checkout HEAD~1 -- src/routes/
   ```

## Post-Rollback Actions

### 1. Update Package.json Scripts
If you restored legacy files, you may need to update scripts:

```json
{
  "scripts": {
    "dev": "ts-node src/server.ts",
    "dev:legacy": "ts-node src/server.ts",
    "dev:modular": "ts-node src/app.ts"
  }
}
```

### 2. Update Service Exports
If you restored legacy services, update `src/services/index.ts`:

```typescript
// Export both legacy and decorator services
export * from './auth/AuthService';
export * from './auth/AuthService.decorator';
// ... other services
```

### 3. Update Container Configuration
If you restored container files, update `src/container/index.ts`:

```typescript
// Re-export restored containers
export { DIContainer } from './DIContainer';
export { ServiceContainer } from './ServiceContainer';
export { ServiceRegistry } from './ServiceRegistry';
```

### 4. Verify Application Functionality
After any rollback:

```bash
# Test modular architecture
npm run dev

# Test legacy fallback (if applicable)
npm run dev:legacy

# Check all endpoints
curl http://localhost:3000/health
curl http://localhost:3000/modules
curl http://localhost:3000/services
```

## Troubleshooting

### Import Errors After Rollback
If you get import errors after restoring files:

1. **Check file paths**: Ensure restored files are in correct locations
2. **Update imports**: Some imports may need to be updated
3. **Clear cache**: Clear TypeScript and Node.js caches:
   ```bash
   rm -rf node_modules/.cache
   rm -rf dist/
   npm run build
   ```

### Service Registration Issues
If services aren't registering properly:

1. **Check service exports**: Ensure services are properly exported
2. **Verify container configuration**: Check DI container setup
3. **Review module imports**: Ensure modules import correct services

### Route Not Found Errors
If API endpoints return 404 after rollback:

1. **Verify route registration**: Check if routes are properly registered
2. **Check middleware order**: Ensure middleware is in correct order
3. **Review controller bindings**: Verify controllers are bound to routes

## Prevention for Future Cleanups

### 1. Create Feature Branches
Always perform cleanups in feature branches:

```bash
git checkout -b cleanup/remove-legacy-files
# Perform cleanup
git push origin cleanup/remove-legacy-files
# Create PR for review
```

### 2. Incremental Cleanup
Remove files in small batches:

1. Remove one category at a time (e.g., just app files)
2. Test thoroughly after each batch
3. Commit each batch separately for easier rollback

### 3. Backup Strategy
Before major cleanups:

```bash
# Create a backup branch
git checkout -b backup/pre-cleanup-$(date +%Y%m%d)
git push origin backup/pre-cleanup-$(date +%Y%m%d)

# Return to main branch for cleanup
git checkout main
```

### 4. Documentation First
Always document what will be removed and why before removal.

## Emergency Contacts

If you need help with rollback:
- Check project documentation
- Review git history: `git log --oneline`
- Contact the development team
- Create an issue in the repository

## Verification Checklist

After any rollback, verify:

- [ ] Application starts without errors
- [ ] All required endpoints respond
- [ ] Database connections work
- [ ] Authentication functions properly
- [ ] Service discovery works
- [ ] Health checks pass
- [ ] Legacy compatibility (if needed)
- [ ] No import/export errors in logs

---

**Remember**: The goal is to maintain system stability while preserving the benefits of the modular architecture. Choose the minimal rollback necessary to resolve any issues.

