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
