# Hisaab: split trip / flat expenses, settle with UPI

## 1. One user story (v1)
Friends add what each paid. The app shows who owes whom,
and the fewest payments to settle, as UPI links.

## 2. Pages (just one)
- Members: name + UPI id
- Add expense: who paid, amount, note (split equally)
- Expense list + balances + "settle up" payments

## 3. Data (money in paise, never floats)
members(id, name, upi)
expenses(id, payer_id, amount_paise, note, created_at)
shares(expense_id, member_id, share_paise)

## 4. API
GET  /api/state      members, expenses, balances, settle plan
POST /api/members    {name, upi}
POST /api/expenses   {payer_id, amount, note}

## 5. Core logic (unit tested)
splitEqual(paise, n)  remainder paise go to the first people
settle(balances)      greedy: biggest debtor pays biggest creditor
upiLink(...)          upi://pay?pa=..&pn=..&am=..&cu=INR

## 6. Out of scope for v1
login, many groups, unequal splits, real payments

## 7. Stack
Cloudflare Worker + Hono + D1 (SQLite), one HTML page, Vitest
