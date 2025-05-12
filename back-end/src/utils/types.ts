export interface JWT {
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
      name?: string;
      board?: string;
      protocol?: string;
      device_id?: number;
      ph?: number;
      cod?: number;
      tss?: number;
      nh3n?: number;
      flow?: number;
      server_time?: string;
      operator?: string;
      threshold?: number;
      sensor?: string;
      username?: string,
      password: string, 
      email?: string, 
      otp?: string, 
      refresh_token?: string,
      description?: string,
      sensor_type?: string,
      last_login?: string,
    };
    params: {
      id: number;
      device_id: number;
      sensor: string;
    };
    headers: {
      [x: string]: any;
    };
    jwt: {
      sign(arg0: { sub: string; iat: number; type: string }): any;
      verify: (arg0: any) => any;
    };
    user: any;
    error: any;
  }
  
export interface Auth {
    params: { sub: string; iat: number; type: string; };
    body: {
      username?: string;
      password: string;
      email?: string;
    };
    jwt: {
      sign(arg0: { sub: string; iat: number; type: string }): any;
    };
  }