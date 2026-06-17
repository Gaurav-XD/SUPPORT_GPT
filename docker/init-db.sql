-- Database initialization script for SupportGPT

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Log initialization
DO $$ 
BEGIN 
  RAISE NOTICE 'SupportGPT database initialized with extensions: uuid-ossp, pgcrypto, vector';
END $$;
