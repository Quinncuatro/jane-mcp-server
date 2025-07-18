-- SQLite schema for Jane document index
-- This schema defines the structure for storing and searching documents

-- Main documents table to store document metadata and content
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  path TEXT NOT NULL,             -- File path relative to the Jane directory
  type TEXT NOT NULL,             -- Document type (stdlib or spec)
  content TEXT,                   -- Document content (markdown)
  title TEXT NOT NULL,            -- Document title (from metadata)
  description TEXT,               -- Document description (from metadata)
  author TEXT,                    -- Document author (from metadata)
  created_at TEXT,                -- Creation timestamp (ISO 8601 string)
  updated_at TEXT,                -- Last update timestamp (ISO 8601 string)
  language_or_project TEXT,       -- Language for stdlib, project for spec
  
  -- Enforce uniqueness of document path and type combination
  UNIQUE(path, type)
);

-- Document tags table for many-to-many relationship between documents and tags
CREATE TABLE IF NOT EXISTS document_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,   -- References documents.id
  tag TEXT NOT NULL,              -- Tag value
  
  -- Enforce uniqueness of document_id and tag combination to avoid duplicates
  UNIQUE(document_id, tag),
  
  -- Add foreign key constraint
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Full-text search virtual table for efficient content searching
-- Contains the document content and metadata for search
CREATE VIRTUAL TABLE IF NOT EXISTS document_fts USING fts5(
  path,                  -- File path for identification
  title,                 -- Document title
  description,           -- Document description
  content,               -- Document content
  author,                -- Document author
  tags,                  -- Space-separated tags for search
  type,                  -- Document type (stdlib or spec)
  language_or_project,   -- Language/project value for filtering
  
  -- Reference to the documents table
  content_rowid=id,
  content=documents
);

-- Create triggers to keep the FTS table in sync with the documents table
-- Trigger for document insertion
CREATE TRIGGER IF NOT EXISTS documents_after_insert AFTER INSERT ON documents BEGIN
  INSERT INTO document_fts(
    rowid, path, title, description, content, author, tags, type, language_or_project
  ) VALUES (
    new.id, new.path, new.title, new.description, new.content, new.author,
    (SELECT GROUP_CONCAT(tag, ' ') FROM document_tags WHERE document_id = new.id),
    new.type, new.language_or_project
  );
END;

-- Trigger for document update
CREATE TRIGGER IF NOT EXISTS documents_after_update AFTER UPDATE ON documents BEGIN
  UPDATE document_fts SET
    path = new.path,
    title = new.title,
    description = new.description,
    content = new.content,
    author = new.author,
    tags = (SELECT GROUP_CONCAT(tag, ' ') FROM document_tags WHERE document_id = new.id),
    type = new.type,
    language_or_project = new.language_or_project
  WHERE rowid = new.id;
END;

-- Trigger for document deletion
CREATE TRIGGER IF NOT EXISTS documents_after_delete AFTER DELETE ON documents BEGIN
  DELETE FROM document_fts WHERE rowid = old.id;
END;

-- Trigger to update FTS tags after document_tags insert
CREATE TRIGGER IF NOT EXISTS document_tags_after_insert AFTER INSERT ON document_tags BEGIN
  UPDATE document_fts SET
    tags = (SELECT GROUP_CONCAT(tag, ' ') FROM document_tags WHERE document_id = new.document_id)
  WHERE rowid = new.document_id;
END;

-- Trigger to update FTS tags after document_tags delete
CREATE TRIGGER IF NOT EXISTS document_tags_after_delete AFTER DELETE ON document_tags BEGIN
  UPDATE document_fts SET
    tags = (SELECT GROUP_CONCAT(tag, ' ') FROM document_tags WHERE document_id = old.document_id)
  WHERE rowid = old.document_id;
END;

-- Create indexes for efficient querying
-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- Index for language/project filtering
CREATE INDEX IF NOT EXISTS idx_documents_language_or_project ON documents(language_or_project);

-- Index for tags
CREATE INDEX IF NOT EXISTS idx_document_tags_tag ON document_tags(tag);

-- Index for document_id in document_tags for faster joins
CREATE INDEX IF NOT EXISTS idx_document_tags_document_id ON document_tags(document_id);

-- Index for path
CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);

-- Index for updated_at timestamp for sorting by recency
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);