package dev.edwin.app;

import dev.edwin.controllers.*;
import io.javalin.Javalin;

import java.net.ServerSocket;

public class App {

	public static void main(String[] args) {
		int port = resolvePort();
		Javalin app = Javalin.create(cfg -> {
			cfg.enableCorsForAllOrigins();
			cfg.addStaticFiles("/public");
		}).start(port);

//		########################
//		EMPLOYEE
// 		########################
		app.put("/employee", EmployeeController.createEmployee);

		app.get("/employees", EmployeeController.getAllEmployees);
		app.get("/employee/:eid", EmployeeController.getEmployeeById);
		app.get("/employee-by-email", EmployeeController.getEmployeeSingleByEmail);

		app.post("/employee", EmployeeController.updateEmployee);
		app.delete("/employee", EmployeeController.deleteEmployee);
//		########################
//		EXPENSE_CATEGORY
// 		########################
		app.put("/expense-category", ExpenseCategoryController.createExpenseCategory);

		app.get("/expense-categories", ExpenseCategoryController.getAllExpenseCategories);
		app.get("/expense-category/:cid", ExpenseCategoryController.getExpenseCategoryById);

		app.post("/expense-category", ExpenseCategoryController.updateExpenseCategory);
		app.delete("/expense-category", ExpenseCategoryController.deleteExpenseCategory);
//		########################
//		MANAGERS
// 		########################
		app.put("/manager", ManagerController.createManager);

		app.get("/managers", ManagerController.getAllManagers);
		app.get("/manager/:mid", ManagerController.getManagerById);

		app.post("/manager", ManagerController.updateManager);
		app.delete("/manager", ManagerController.deleteManager);
//		########################
//		REIMBURSEMENT
// 		########################
		app.put("/reimbursement", ReimbursementController.createReimbursement);

		app.get("/reimbursements", ReimbursementController.getAllReimbursements);
		app.get("/reimbursement/:rid", ReimbursementController.getReimbursementById);

		app.post("/reimbursement", ReimbursementController.updateReimbursement);
		app.delete("/reimbursement", ReimbursementController.deleteReimbursement);

		// Health check
		app.get("/health", ctx -> {
			// Avoid invoking Javalin's object JSON mapping (Jackson not on classpath).
			ctx.contentType("application/json");
			ctx.result("{\"status\":\"UP\"}");
		});

		// Root convenience redirect (serve index.html)
		app.get("/", ctx -> ctx.redirect("/index.html"));
		System.out.println("[App] Started on port " + port);

		// Diagnostics endpoint (lightweight)
		app.get("/diag/db", ctx -> {
			try (java.sql.Connection c = dev.edwin.utils.ConnectionUtil.getConnection();
			     java.sql.Statement s = c == null ? null : c.createStatement()) {
				if (c == null) {
					ctx.status(500).result("{\"ok\":false,\"error\":\"no-connection\"}");
					return;
				}
				java.util.Map<String,Integer> counts = new java.util.LinkedHashMap<>();
				for (String table : new String[]{"MANAGER","EMPLOYEE","EXPENSE_CATEGORY","REIMBURSEMENT"}) {
					try (java.sql.ResultSet rs = s.executeQuery("SELECT COUNT(*) AS ct FROM " + table)) {
						if (rs.next()) counts.put(table, rs.getInt("ct"));
					}
				}
				StringBuilder json = new StringBuilder("{\"ok\":true");
				for (java.util.Map.Entry<String,Integer> e : counts.entrySet()) {
					json.append(",\"").append(e.getKey().toLowerCase()).append("\":").append(e.getValue());
				}
				json.append("}");
				ctx.contentType("application/json").result(json.toString());
			} catch (Exception ex) {
				ctx.status(500).result("{\"ok\":false,\"error\":\""+ex.getMessage()+"\"}");
			}
		});

 
	}

	private static int resolvePort() {
		// Priority: system property PORT, env PORT, default 7070.
		String sys = System.getProperty("PORT");
		if (sys != null) return parsePort(sys, 7070);
		String env = System.getenv("PORT");
		if (env != null) return parsePort(env, 7070);
		return findOpenPort(7070);
	}

	private static int parsePort(String val, int fallback) {
		try { return Integer.parseInt(val);} catch(NumberFormatException e){return fallback;}
	}

	private static int findOpenPort(int preferred) {
		if (isFree(preferred)) return preferred;
		for (int p = preferred + 1; p < preferred + 20; p++) {
			if (isFree(p)) {
				System.out.println("[App] Preferred port " + preferred + " in use, falling back to " + p);
				return p;
			}
		}
		return preferred; // let Javalin throw if none found
	}

	private static boolean isFree(int port) {
		try (ServerSocket socket = new ServerSocket(port)) {
			socket.setReuseAddress(true);
			return true;
		} catch (Exception e) {
			return false;
		}
	}



}
