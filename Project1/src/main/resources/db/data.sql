-- Seed data (idempotent pattern: only insert if tables empty)
-- H2 lacks native IF NOT EXISTS for INSERT; we rely on first-run population.

INSERT INTO MANAGER (email, password, name, image_url) VALUES
 ('manager1@example.com','password','Manager One',NULL);

INSERT INTO EMPLOYEE (email, password, name, image_url, mgid) VALUES
 ('alice@example.com','password','Alice A',NULL,1),
 ('bob@example.com','password','Bob B',NULL,1),
 ('carol@example.com','password','Carol C',NULL,1);

INSERT INTO EXPENSE_CATEGORY (title, image_url) VALUES
 ('Travel', NULL),
 ('Meals', NULL),
 ('Supplies', NULL);

-- reimbursements (pending, approved, denied)
INSERT INTO REIMBURSEMENT (amount, submit_date, status, status_date, employee_note, manager_note, cid, eid) VALUES
 (125.50,'2025-09-01',0,NULL,'Flight to client site',NULL,1,1),
 (42.10,'2025-09-02',1,'2025-09-03','Team lunch','Approved - reasonable',2,2),
 (300.00,'2025-09-05',2,'2025-09-06','New headset','Denied - exceeds allowance',3,3);
