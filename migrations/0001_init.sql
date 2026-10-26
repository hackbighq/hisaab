CREATE TABLE members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  upi TEXT NOT NULL
);

CREATE TABLE expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payer_id INTEGER NOT NULL REFERENCES members(id),
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE shares (
  expense_id INTEGER NOT NULL REFERENCES expenses(id),
  member_id INTEGER NOT NULL REFERENCES members(id),
  share_paise INTEGER NOT NULL,
  PRIMARY KEY (expense_id, member_id)
);
