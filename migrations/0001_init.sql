-- Money is stored as INTEGER paise (1 rupee = 100 paise), never REAL/float.
-- A balance is just: what you paid (expenses) minus your share of everything (shares).

CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  upi TEXT NOT NULL                -- UPI id, e.g. riya@okicici; used to build the settle-up link
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payer_id INTEGER NOT NULL REFERENCES members(id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per person per expense: who owes how much of it. splitEqual() fills this,
-- and the shares of an expense always add up to its amount_paise exactly.
CREATE TABLE shares (
  expense_id INTEGER NOT NULL REFERENCES expenses(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  share_paise INTEGER NOT NULL,
  PRIMARY KEY (expense_id, member_id)
);
