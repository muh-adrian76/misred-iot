export interface Types {
  json():
    | {
        name: any;
        description: any;
      }
    | PromiseLike<{
        name: any;
        description: any;
      }>;
  body: {
    code:string;
    name?: string;
    board?: string;
    protocol?: string;
    device_id?: number;
    topic?: string;
    qos?: number;
    lora_profile?: string;
    ph?: number;
    cod?: number;
    tss?: number;
    nh3n?: number;
    flow?: number;
    server_time?: string;
    operator?: string;
    threshold?: number;
    sensor?: string;
    password: string;
    email?: string;
    otp?: string;
    refresh_token?: string;
    description?: string;
    sensor_type?: string;
    last_login?: string;
  };
  params: {
    id: string;
    device_id: string;
    sensor: string;
    sub: string;
    iat: number;
    type: string;
  };
  cookie: {
    auth: any;
  }
  headers: {
    [x: string]: any;
    authorization: string;
  };
  jwt: {
    sign(arg0: { sub: string; iat: number; type: string }): any;
    verify: (arg0: any) => any;
  };
  authorization: string;
  user: any;
  error: any;
}

// Device Command types
export type CommandStatus = "pending" | "sent" | "acknowledged" | "failed";

export interface DeviceCommand {
  id: number;
  device_id: number;
  datastream_id: number;
  command_type: "set_value" | "toggle" | "reset";
  value: number;
  status: CommandStatus;
  sent_at: string;
  acknowledged_at?: string;
  user_id: number;
  
  // Joined fields from datastreams
  pin?: string;
  datastream_type?: string;
  datastream_name?: string;
  
  // Joined fields from users/devices
  user_name?: string;
  device_name?: string;
}

// WebSocket command payload
export interface WSCommand {
  command_id: string;
  device_id: string;
  datastream_id: string;
  command_type: "set_value" | "toggle" | "reset";
  value: number;
  pin: string;
  timestamp: number;
}
