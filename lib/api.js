const API_BASE_URL = "/api";

export const api = {
  // Auth
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, user: data.user };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || "Login failed" };
    }
  },

  // Faults
  async getFaults(patientId) {
    const url = patientId
      ? `${API_BASE_URL}/faults?patientId=${patientId}`
      : `${API_BASE_URL}/faults`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch faults");
    return response.json();
  },

  async createFault(faultData) {
    const response = await fetch(`${API_BASE_URL}/faults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(faultData),
    });
    if (!response.ok) throw new Error("Failed to create fault");
    return response.json();
  },

  // Alerts
  async getAlerts() {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    if (!response.ok) throw new Error("Failed to fetch alerts");
    return response.json();
  },

  async updateAlertStatus(alertId, status) {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alertId, status }),
    });
    if (!response.ok) throw new Error("Failed to update alert status");
    return response.json();
  },

  async createAlert(alertData) {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData),
    });
    if (!response.ok) throw new Error("Failed to create alert");
    return response.json();
  },

  // Interventions
  async getInterventions() {
    const response = await fetch(`${API_BASE_URL}/interventions`);
    if (!response.ok) throw new Error("Failed to fetch interventions");
    return response.json();
  },

  async getIntervention(id) {
    const response = await fetch(`${API_BASE_URL}/interventions/${id}`);
    if (!response.ok) throw new Error("Failed to fetch intervention");
    return response.json();
  },

  async createIntervention(intervention) {
    const response = await fetch(`${API_BASE_URL}/interventions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intervention),
    });
    if (!response.ok) throw new Error("Failed to create intervention");
    const data = await response.json();
    return { success: true, id: data.id };
  },

  async updateIntervention(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/interventions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) throw new Error("Failed to update intervention");
    return response.json();
  },

  async deleteIntervention(id) {
    const response = await fetch(`${API_BASE_URL}/interventions/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete intervention");
    return response.json();
  },

  // Machines
  async getMachines() {
    const response = await fetch(`${API_BASE_URL}/machines`);
    if (!response.ok) throw new Error("Failed to fetch machines");
    return response.json();
  },

  async createMachine(machine) {
    const response = await fetch(`${API_BASE_URL}/machines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(machine),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create machine");
    }
    
    const data = await response.json();
    return { success: true, id: data.id };
  },

  async updateMachine(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update machine");
    }
    
    return response.json();
  },

  async deleteMachine(id, forceDelete = false) {
    try {
      const url = forceDelete 
        ? `${API_BASE_URL}/machines/${id}?force=true`
        : `${API_BASE_URL}/machines/${id}`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete machine');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting machine:', error);
      throw error;
    }
  },

  // Maintenance
  async getMaintenanceSchedule() {
    const response = await fetch(`${API_BASE_URL}/maintenance`);
    if (!response.ok) throw new Error("Failed to fetch maintenance schedule");
    return response.json();
  },

  async createMaintenanceTask(maintenanceData) {
    const response = await fetch(`${API_BASE_URL}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maintenanceData),
    });
    if (!response.ok) throw new Error("Failed to create maintenance task");
    return response.json();
  },

  async updateMaintenanceStatus(id, status) {
    const response = await fetch(`${API_BASE_URL}/maintenance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!response.ok) throw new Error("Failed to update maintenance status");
    return response.json();
  },

  // Users
  async getUsers() {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  async getUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  },

  async createUser(user) {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create user");
    }
    
    const data = await response.json();
    return { success: true, id: data.id };
  },

  async updateUser(id, updateData) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update user");
    }
    
    return response.json();
  },

  async deleteUser(id) {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: "DELETE",
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete user");
    }
    
    return response.json();
  },

  // Maintenance Controls
  async getMaintenanceControls() {
    const response = await fetch(`${API_BASE_URL}/maintenance-controls`);
    if (!response.ok) throw new Error("Failed to fetch maintenance controls");
    return response.json();
  },

  async createMaintenanceControl(controlData) {
    const response = await fetch(`${API_BASE_URL}/maintenance-controls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(controlData),
    });
    if (!response.ok) throw new Error("Failed to create maintenance control");
    return response.json();
  },

  async sendMaintenanceNotifications() {
    const response = await fetch(`${API_BASE_URL}/maintenance-notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to send maintenance notifications");
    return response.json();
  },

  async checkMaintenanceNotifications() {
    const response = await fetch(`${API_BASE_URL}/maintenance-notifications`);
    if (!response.ok) throw new Error("Failed to check maintenance notifications");
    return response.json();
  }
};
