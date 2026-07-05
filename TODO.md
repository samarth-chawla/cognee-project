- [ ] Analyze why the interview starts twice / two agents responding
- [ ] Identify the actual double-start trigger (likely StrictMode double-mount or double connection creation)
- [ ] Fix by making `useVoiceAgent.start()` idempotent (guard against repeated starts on same hook instance)
- [ ] Fix React Strict Mode race: prevent double initialization in VoiceInterview component by using a ref guard (already exists) and/or in hook (idempotent)
- [ ] Add logs to confirm single socket + single question injection
- [ ] Run build/lint and verify: greeting -> Q1 once -> user can answer before Q2

