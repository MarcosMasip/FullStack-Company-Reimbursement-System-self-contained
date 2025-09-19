package dev.edwin.daos;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import dev.edwin.utils.ConnectionUtil;

import dev.edwin.entities.Manager;

public class ManagerDAOImp implements ManagerDAO {
	private static ManagerDAO mdao;
	
	private ManagerDAOImp() {super();}
	
	public static ManagerDAO getMdao()
	{
		if (mdao == null)
			mdao = new ManagerDAOImp();
		
		return mdao;
	}


	@Override
	public Manager createManager(Manager manager)
	{
		try(Connection conn = ConnectionUtil.getConnection()){
			String sql = "INSERT INTO MANAGER (email, password, name, image_url) VALUES (?,?,?,?)";
			PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
			ps.setString(1, manager.getEmail());
			ps.setString(2, manager.getPassword());
			ps.setString(3, manager.getName());
			ps.setString(4, manager.getImage_url());
			ps.execute();

			ResultSet rs = ps.getGeneratedKeys();
			rs.next();
			int key = rs.getInt("mgid");
			manager.setMgid(key);

			return manager;

		} catch (SQLException e) {
			e.printStackTrace();
		}
		return null;
	}

	@Override
	public Manager getManagerById(int mgid)
	{
		try(Connection conn = ConnectionUtil.getConnection())
		{
			String sql = "SELECT * FROM MANAGER WHERE mgid = ?";
			PreparedStatement ps = conn.prepareStatement(sql);
			ps.setInt(1, mgid);

			ResultSet rs = ps.executeQuery();
			rs.next();

			Manager manager = new Manager();
			manager.setEmail(rs.getString("email"));
			manager.setPassword(rs.getString("password"));
			manager.setName(rs.getString("name"));
			manager.setImage_url(rs.getString("image_url"));
			manager.setMgid(rs.getInt("mgid"));

			return manager;

		} catch(SQLException e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public List<Manager> getAllManagers()
	{
		try(Connection conn = ConnectionUtil.getConnection())
		{
			String sql = "SELECT * FROM MANAGER";
			PreparedStatement ps = conn.prepareStatement(sql);

			ResultSet rs = ps.executeQuery();
			List<Manager> managers = new ArrayList<Manager>();
			Manager manager;
			while (rs.next()){
				manager = new Manager();
				manager.setEmail(rs.getString("email"));
				manager.setPassword(rs.getString("password"));
				manager.setName(rs.getString("name"));
				manager.setImage_url(rs.getString("image_url"));
				manager.setMgid(rs.getInt("mgid"));

				managers.add(manager);
			}

			return managers;

		} catch(SQLException e) {
			e.printStackTrace();
			return null;
		}
	}

	@Override
	public Manager updateManager(Manager manager)
	{
		try(Connection conn = ConnectionUtil.getConnection())
		{
			String sql = "UPDATE MANAGER SET email=?,password=?,name=?,image_url=? WHERE mgid = ?";
			PreparedStatement ps = conn.prepareStatement(sql);

			ps.setString(1, manager.getEmail());
			ps.setString(2, manager.getPassword());
			ps.setString(3, manager.getName());
			ps.setString(4, manager.getImage_url());
			ps.setInt(5, manager.getMgid());

			if(ps.executeUpdate() > 0)
			{
				return manager;
			}

		}catch (SQLException e)
		{
			e.printStackTrace();
		}
		return null;
	}

	@Override
	public boolean deleteManager(Manager manager)
	{
		try(Connection conn = ConnectionUtil.getConnection())
		{
			String sql = "DELETE FROM MANAGER WHERE mgid = ?";
			PreparedStatement ps = conn.prepareStatement(sql);
			ps.setInt(1, manager.getMgid());

			if(ps.executeUpdate() > 0)
			{
				return true;
			}

			return false;

		}catch (SQLException e)
		{
			e.printStackTrace();
			return false;
		}
	}
}
