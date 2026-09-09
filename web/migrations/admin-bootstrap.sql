-- Administration recovery depends on current roles, never on historical setup state.
DROP TRIGGER IF EXISTS auth_record_administrator ON auth_user;
DROP FUNCTION IF EXISTS auth_record_administrator();
DROP TABLE IF EXISTS auth_admin_bootstrap;
