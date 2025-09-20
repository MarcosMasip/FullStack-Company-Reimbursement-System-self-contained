package dev.edwin.utils;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class ConnectionUtil {

	private static final String DEFAULT_DB_MODE = "EMBEDDED"; // EMBEDDED or REMOTE

	public static Connection getConnection() {
		String mode = resolveMode();
		try {
			if ("REMOTE".equalsIgnoreCase(mode)) {
				return remoteConnection();
			}
			return embeddedConnection();
		} catch (Exception e) {
			System.err.println("[ConnectionUtil] ERROR obtaining connection (mode=" + mode + ") : " + e.getMessage());
			e.printStackTrace();
			return null; // Downstream code now guards against null; NPEs avoided.
		}
	}

	private static String resolveMode() {
		// Priority: System property > Env var > default
		String prop = System.getProperty("DB_MODE");
		if (prop != null && !prop.isEmpty()) return prop;
		String env = System.getenv("DB_MODE");
		if (env != null && !env.isEmpty()) return env;
		return DEFAULT_DB_MODE;
	}

	private static Connection remoteConnection() throws IOException, SQLException {
		Properties props = new Properties();
		try (InputStream fileInputStream = ConnectionUtil.class.getClassLoader().getResourceAsStream("connection.properties")) {
			if (fileInputStream == null) throw new FileNotFoundException("connection.properties not found in classpath");
			props.load(fileInputStream);
		}
		String details = props.getProperty("condetails");
		return DriverManager.getConnection(details);
	}

	// Ensure we only run schema + seed once per process
	private static volatile boolean embeddedInitialized = false;
	private static final Object initLock = new Object();

	private static Connection embeddedConnection() throws SQLException {
		// Simpler URL; run scripts manually for clearer error reporting.
		String url = "jdbc:h2:file:./.localdb/reimburse;MODE=MariaDB;AUTO_SERVER=TRUE";
		try {
			// Explicitly load driver (defensive for some older JVM setups)
			Class.forName("org.h2.Driver");
		} catch (ClassNotFoundException e) {
			System.err.println("[ConnectionUtil] H2 Driver class not found: " + e.getMessage());
		}
		Connection conn = DriverManager.getConnection(url, "sa", "");
		if (!embeddedInitialized) {
			synchronized (initLock) {
				if (!embeddedInitialized) {
					runScript(conn, "db/schema.sql", true);
					// Only seed if no managers exist (proxy for fresh DB)
					if (isTableEmpty(conn, "MANAGER")) {
						System.out.println("[ConnectionUtil] Seeding sample data (tables empty)");
						runScript(conn, "db/data.sql", false);
					} else {
						System.out.println("[ConnectionUtil] Seed data skipped (already present)");
					}
					embeddedInitialized = true;
				}
			}
		}
		return conn;
	}

	private static boolean isTableEmpty(Connection conn, String table) {
		try (java.sql.Statement st = conn.createStatement();
		     java.sql.ResultSet rs = st.executeQuery("SELECT COUNT(*) AS ct FROM " + table)) {
			if (rs.next()) return rs.getInt("ct") == 0;
		} catch (SQLException e) {
			System.err.println("[ConnectionUtil] Could not count table " + table + ": " + e.getMessage());
		}
		return true; // fallback treat as empty so we seed rather than miss required data
	}

	private static void runScript(Connection conn, String classpathResource, boolean stopOnError) {
		System.out.println("[ConnectionUtil] Running script: " + classpathResource);
		try (InputStream in = ConnectionUtil.class.getClassLoader().getResourceAsStream(classpathResource)) {
			if (in == null) {
				System.err.println("[ConnectionUtil] Resource not found: " + classpathResource);
				return;
			}
			try (BufferedReader br = new BufferedReader(new InputStreamReader(in))) {
				StringBuilder statement = new StringBuilder();
				try (java.sql.Statement st = conn.createStatement()) {
					String line;
					while ((line = br.readLine()) != null) {
						String trimmed = line.trim();
						if (trimmed.startsWith("--") || trimmed.isEmpty()) {
							continue; // skip comments and blank lines
						}
						statement.append(line).append('\n');
						if (trimmed.endsWith(";")) {
							String sql = statement.toString().trim();
							// remove trailing semicolon for execute()
							if (sql.endsWith(";")) sql = sql.substring(0, sql.length() - 1);
							try {
								st.execute(sql);
							} catch (SQLException ex) {
								System.err.println("[ConnectionUtil] Failed SQL: " + sql + " -> " + ex.getMessage());
								if (stopOnError) throw ex;
							}
							statement.setLength(0);
						}
					}
					// Handle trailing statement without semicolon (unlikely here)
					if (statement.length() > 0) {
						String sql = statement.toString().trim();
						if (!sql.isEmpty()) {
							try { st.execute(sql);} catch(SQLException ex){
								System.err.println("[ConnectionUtil] Failed tail SQL: " + sql + " -> " + ex.getMessage());
								if (stopOnError) throw ex;
							}
						}
					}
				}
			}
		} catch (Exception e) {
			System.err.println("[ConnectionUtil] Error running script " + classpathResource + ": " + e.getMessage());
			if (stopOnError) {
				throw new RuntimeException("Schema initialization failed: " + classpathResource, e);
			}
		}
	}
}
