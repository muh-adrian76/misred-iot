import { Pool, ResultSetHeader } from "mysql2/promise";

export class WidgetService {
  private db: Pool;

  constructor(db: Pool) {
    this.db = db;
  }

  async createWidget({
    description,
    dashboard_id,
    device_id,
    datastream_id,
    datastream_ids,
    inputs,
    type,
  }: any) {
    try {
      // Convert to new inputs format
      let finalInputs: any[];
      
      if (inputs && Array.isArray(inputs)) {
        // Direct inputs format (preferred)
        finalInputs = inputs;
      } else if (datastream_ids && Array.isArray(datastream_ids)) {
        // datastream_ids format (compatibility)
        finalInputs = datastream_ids;
      } else if (device_id && datastream_id) {
        // Old single format (compatibility)
        finalInputs = [{ device_id: parseInt(device_id), datastream_id: parseInt(datastream_id) }];
      } else {
        throw new Error("Either inputs, datastream_ids, or device_id+datastream_id must be provided");
      }
      
      const query = `INSERT INTO widgets (description, dashboard_id, inputs, type) VALUES (?, ?, ?, ?)`;
      const params = [
        description,
        dashboard_id,
        JSON.stringify(finalInputs),
        type,
      ];
      
      const [result] = await this.db.query<ResultSetHeader>(query, params);
      return result.insertId;
    } catch (error) {
      console.error("Error creating widget:", error);
      throw new Error("Failed to create widget");
    }
  }

  async getWidgetsByDashboardId(dashboardId: string) {
    try {
      const [rows] = await this.db.query(
        "SELECT * FROM widgets WHERE dashboard_id = ?",
        [dashboardId]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching widgets by dashboard ID:", error);
      throw new Error("Failed to fetch widgets");
    }
  }

  async getWidgetsByDeviceId(device_id: string) {
    try {
      // Search for widgets that contain this device_id in their inputs JSON
      const [rows] = await this.db.query(
        "SELECT * FROM widgets WHERE JSON_SEARCH(inputs, 'one', ?, NULL, '$[*].device_id') IS NOT NULL",
        [device_id]
      );
      return rows;
    } catch (error) {
      console.error("Error fetching widgets by device ID:", error);
      throw new Error("Failed to fetch widgets");
    }
  }

  async updateWidget(
    id: string,
    {
      description,
      dashboard_id,
      device_id,
      datastream_id,
      datastream_ids,
      inputs,
      type,
    }: any
  ) {
    try {
      // Convert to new inputs format
      let finalInputs: any[];
      
      if (inputs && Array.isArray(inputs)) {
        // Direct inputs format (preferred)
        finalInputs = inputs;
      } else if (datastream_ids && Array.isArray(datastream_ids)) {
        // datastream_ids format (compatibility)
        finalInputs = datastream_ids;
      } else if (device_id && datastream_id) {
        // Old single format (compatibility)
        finalInputs = [{ device_id: parseInt(device_id), datastream_id: parseInt(datastream_id) }];
      } else {
        throw new Error("Either inputs, datastream_ids, or device_id+datastream_id must be provided");
      }
      
      const query = `UPDATE widgets SET description = ?, dashboard_id = ?, inputs = ?, type = ? WHERE id = ?`;
      const params = [
        description,
        dashboard_id,
        JSON.stringify(finalInputs),
        type,
        id,
      ];
      
      const [result] = await this.db.query<ResultSetHeader>(query, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error updating widget:", error);
      throw new Error("Failed to update widget");
    }
  }

  async deleteWidget(id: string) {
    try {
      const [result] = await this.db.query<ResultSetHeader>(
        "DELETE FROM widgets WHERE id = ?",
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting widget:", error);
      throw new Error("Failed to delete widget");
    }
  }
}