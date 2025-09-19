package dev.edwin.utils;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
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
			e.printStackTrace();
			return null;
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

	private static Connection embeddedConnection() throws SQLException {
		// H2 file database inside project directory .localdb; INIT runs schema + data (idempotent for schema)
		// MODE=MariaDB for compatibility with past SQL dialect
		String url = "jdbc:h2:file:./.localdb/reimburse;MODE=MariaDB;AUTO_SERVER=TRUE;" +
				"INIT=RUNSCRIPT FROM 'classpath:db/schema.sql'\;RUNSCRIPT FROM 'classpath:db/data.sql'";
		return DriverManager.getConnection(url, "sa", "");
	}
}
