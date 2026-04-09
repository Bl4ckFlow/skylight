# Skylight Backend Improvements TODO
Status: 0/14 COMPLETE

## Phase 1: Core Middleware & Security (4 steps)
- [ ] 1. Install deps: rate-limit, winston, vitest (execute_command)
- [ ] 2. Update app.ts: helmet + rateLimit + errorHandler
- [ ] 3. Create schemas.ts w/ Zod schemas for all modules
- [ ] 4. Update ALL routes.ts: Add validate(schema) on POST/PUT

## Phase 2: Controllers & Cleanup (4 steps)
- [ ] 5. Remove manual validation from controllers (Zod replaces)
- [ ] 6. Fix controllers empty catches → let errorHandler handle
- [ ] 7. Update .gitignore + create README.md
- [ ] 8. Remove console.log from app.ts/db.ts/mailer.ts

## Phase 3: Tests & Docs (4 steps)
- [ ] 9. Vitest config + auth.service.test.ts (basic)
- [ ] 10. docker-compose.yml (Postgres only)
- [ ] 11. npm audit fix + PDFKit update if safe
- [ ] 12. Verify: Full run + manual test endpoints

## Phase 4: Polish (2 steps)
- [ ] 13. Frontend: Consider Tanstack Query
- [ ] 14. Rate-limit tweaks + Winston prod

**Progress tracked here. Mark [x] as done.**

