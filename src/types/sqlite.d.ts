declare module 'sqlite' {
  export interface Database {
    exec(sql: string): Promise<void>;
    run(sql: string, ...params: any[]): Promise<any>;
    get(sql: string, ...params: any[]): Promise<any>;
    all(sql: string, ...params: any[]): Promise<any[]>;
    prepare(sql: string): Promise<any>;
    close(): Promise<void>;
  }

  export interface OpenOptions {
    filename: string;
    driver?: any;
    mode?: number;
  }

  export function open(options: OpenOptions): Promise<Database>;
} 