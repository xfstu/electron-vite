import Database from "better-sqlite3-multiple-ciphers";
import path from "path";
import fs from "fs";
import Logger from "@main/utils/Logger";

class DBInstance {
  private db: InstanceType<typeof Database>;

  constructor(filePath: string, password: string | null = null) {
    const db = new Database(filePath);
    if (password) {
      db.pragma(`cipher='sqlcipher'`)
      db.pragma(`legacy=4`)
      db.pragma(`key='${password}'`);
    }
    db.pragma('journal_mode = WAL');
    this.db = db
  }
  run(sql: string, data: any[] = []) {
    return this.db.prepare(sql).run(data);
  }
  query<T>(sql: string, params: any[] = []) {
    const rows: T[] = this.db.prepare(sql).all(params) as T[];
    if (/limit\s+\d+/i.test(sql)) {
      const baseSql = sql.replace(/limit\s+\d+/i, "").replace(/offset\s+\d+/i, "");
      const count = this.db
        .prepare(`SELECT COUNT(*) AS count FROM (${baseSql})`)
        .pluck()
        .get(...params) as number;

      const pageSize = 10;
      const total = count > 0 ? Math.ceil(count / pageSize) : 1;
      return { total, count, rows };
    }
    return { rows };
  }

  exec(command: string) {
    this.db.exec(command);
  }

  close() {
    this.db.close();
  }

  all(sql: string, params: any[] = []) {
    return this.db.prepare(sql).all(params)
  }
}

class DBManager {
  private static dbMap = new Map<string, DBInstance>();
  private Logger: Logger

  constructor() {
    const log = new Logger();
    log.setOptions({ filename: 'dbmangager.log' })
    this.Logger = log;
  }
  /**
   * 打开数据库
   * @param dbPath 绝对或相对路径
   * @returns DBInstance
   */
  open(dbPath: string, password: string | null = null): DBInstance {

    const absPath = path.resolve(dbPath);
    if (!fs.existsSync(absPath)) {
      this.Logger.error(`Database file does not exist: ${absPath}`);
      throw new Error(`Database file does not exist: ${absPath}`);
    }
    if (!DBManager.dbMap.has(absPath)) {
      try {
        const instance = new DBInstance(absPath, password);
        DBManager.dbMap.set(absPath, instance);
        this.Logger.info(`Opened DB: ${absPath}`);
      } catch (e) {
        this.Logger.error(e, `\nFailed to open DB: ${absPath}; password: ${password}`);
      }

    }
    return DBManager.dbMap.get(absPath)!;
  }

  /**
   * 关闭数据库
   * @param dbPath 可选路径，不传则关闭所有
   */
  close(dbPath?: string): void {
    try {
      if (dbPath) {
        const absPath = path.resolve(dbPath);
        const instance = DBManager.dbMap.get(absPath);
        if (instance) {
          instance.close();
          this.Logger.info(`Closed DB: ${absPath}`);
          DBManager.dbMap.delete(absPath);
        }
      } else {
        for (const [_, db] of DBManager.dbMap.entries()) {
          // db.exec("wal_checkpoint(TRUNCATE)");
          db.close();
        }
        this.Logger.info(`Closed all DBs`);
        DBManager.dbMap.clear();
      }
    } catch (err) {
      this.Logger.error('Error closing database:', err);
    }
  }

  /**
   * 判断是否已打开某数据库
   */
  isOpen(dbPath: string): boolean {
    return DBManager.dbMap.has(path.resolve(dbPath));
  }

  /**
   * 获取当前已打开的路径
   */
  getPaths(): string[] {
    return Array.from(DBManager.dbMap.keys());
  }
}

export default DBManager;
