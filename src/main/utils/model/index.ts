import SqlBricks from "sql-bricks";
import dayjs from "dayjs";
import { DbArrayResult, DbPageResult, } from "./DbResult";
import Database from "better-sqlite3-multiple-ciphers";
import * as NodePath from "path";
import Logger from "../Logger";
import DBManager from "../DBManager";

const logger = new Logger()
logger.setOptions({ filename: 'sql.log', console: false })
const dbManager = new DBManager()
function SqlLog(
  stm:
    | SqlBricks.InsertStatement
    | SqlBricks.UpdateStatement
    | SqlBricks.DeleteStatement
    | SqlBricks.SelectStatement,
  result?: any,
  tiemConsumed?: number
) {
  if (global.config.NODE_ENV === 'pro') return
  const err = new Error();
  const stack = err.stack?.split("\n");
  // 第3行一般是调用者
  const rawCaller = stack?.[3]?.trim();
  // 用正则提取 () 里的路径部分
  const match = rawCaller?.match(/\((.*)\)/);
  const caller = match ? match[1] : rawCaller?.replace(/^at\s+/, "");
  const log = "耗时=> " + tiemConsumed + " ms\nSQL => " + stm.toString() + "\nFROM => " + caller

  console.log(log + '\n---------------------------------------------------------');
  logger.info(log + '\nResult=> ', result)
  //   console.log(
  //     `SQL => ${stm.toString()}
  // FROM => ${caller}
  // Result => ${JSON.stringify(result)}
  // ---------------------------------------------------------`
  //   )
  // console.table([
  //   {
  //     SQL: stm.toString(),
  //     FROM: caller
  //   }
  // ])
  // if (result) {
  //   console.log(result);
  // }
}
function insertTime(
  stmt: any
): SqlBricks.InsertStatement {
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  stmt._values = stmt._values.map((row: any) => {
    if (!row.create_time) row.create_time = now;
    if (!row.update_time) row.update_time = now;
    return row
  })
  return stmt;
}

function updateTime(
  stmt: any
): SqlBricks.UpdateStatement {
  const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
  if (!stmt._values.update_time) {
    stmt._values = {
      ...stmt._values,
      update_time: now
    }
  }
  return stmt;
}

interface optionsType {
  dbPath?: string,
  pwd?: string | null
  createTime?: boolean
  updateTime?: boolean
  showSql?: { sql: boolean, result: boolean }
  dataScope?: boolean,
  ruleScope?: boolean,
  allField?: string,
  createBy?: boolean
}

export interface IDB {
  run(sql: string, data?: any[]): any;
  query<T>(sql: string, params?: any[]): {
    total: number;
    count: number;
    rows: T[];
  } | {
    rows: T[];
    total?: number;
    count?: number;
  };
  exec(command: string): void;
  close(): void;
  all(sql: string, params?: any[]): any[];
}


// 抽象基类，支持类的继承模式
export abstract class BaseModel {
  static instanceMap: Map<any, any> = new Map();
  private dbPath: string = '';
  private pwd: string | null = '';
  private createTime: boolean = false;
  private updateTime: boolean = false;
  private showSql: { sql: boolean, result: boolean } = { sql: false, result: false }
  private allField: string = ''

  constructor() {
    // 子类需要在构造函数中调用 this.setOptions()
    this.setOptions()
  }

  public setOptions(options?: optionsType) {
    const defaut = {
      dbPath: 'Database.db',
      pwd: null,
      createTime: true,
      updateTime: true,
      showSql: { sql: true, result: false },
      dataScope: false,
      ruleScope: false,
      allField: 'id',
      createBy: false
    }
    const { dbPath, pwd: password, createTime, updateTime, showSql, allField } = { ...defaut, ...options }
    this.dbPath = dbPath.includes('/') ? dbPath : NodePath.resolve(global.config.database.dir, dbPath);
    this.pwd = password || (global.config.database.sqlite.find(i => i.filename == options?.dbPath)?.pwd || null);
    this.createTime = createTime;
    this.updateTime = updateTime;
    this.showSql = showSql
    this.allField = allField
    return this;
  }
  // 函数重载声明
  public query<T = any>(
    stmt: SqlBricks.SelectStatement,
  ): DbArrayResult<T>;
  public query<T = any>(
    stmt: SqlBricks.SelectStatement,
    pageIndex: number,
    pageSize: number,
  ): DbPageResult<T>;

  public query<T>(
    stmt: SqlBricks.SelectStatement,
    pageIndex?: number,
    pageSize?: number,
  ): DbPageResult<T> | DbArrayResult<T> {
    if (!this.dbPath) {
      throw new Error("未设置数据库路径")
    }
    let sqlParams = stmt.toParams({ placeholder: "?" });
    if (pageIndex && pageSize) {
      const limit = pageSize;
      const offset = (pageIndex - 1) * pageSize;
      sqlParams.text += ` limit ${limit} offset ${offset}`;
    }
    try {
      let time = Date.now()
      const result = dbManager.open(this.dbPath, this.pwd).query<T>(sqlParams.text, sqlParams.values);
      const tiemConsumed = Date.now() - time
      SqlLog(stmt, result || null, tiemConsumed);
      if (pageIndex && pageSize) {
        return result as DbPageResult<T>;
      } else {
        return result as DbArrayResult<T>;
      }
    } catch (e) {
      SqlLog(stmt, null, 9999);
      throw e;
    }
  }

  execute(stmt: | SqlBricks.InsertStatement | SqlBricks.UpdateStatement | SqlBricks.DeleteStatement,): Database.RunResult {
    if (!this.dbPath) {
      throw new Error("未设置数据库路径")
    }
    const sql = stmt.toString().toLowerCase();
    if (sql.startsWith("select")) {
      throw new Error("不支持 SELECT 语句");
    }

    // 只有 Insert 或 Update 类型，才拦截添加时间戳
    if (this.createTime && sql.startsWith("insert")) {
      stmt = insertTime(stmt);
    }
    if (this.updateTime && sql.startsWith("update")) {
      stmt = updateTime(stmt);
    }

    try {
      const sqlParams = stmt.toParams({ placeholder: "?" });
      let result: {
        lastInsertRowid: number | bigint
        changes: number
        ids: (number | bigint)[]
      }
      let time = Date.now()
      if (sql.startsWith("insert") && (stmt as any)?._values?.length > 1) {
        const res = dbManager.open(this.dbPath, this.pwd).all(sqlParams.text + ` RETURNING ${this.allField}`, sqlParams.values) as any;
        result = {
          lastInsertRowid: res.at(-1)[this.allField],
          changes: res.length,
          ids: res.map((item: any) => item[this.allField])
        }
      } else {
        const res = dbManager.open(this.dbPath, this.pwd).run(sqlParams.text, sqlParams.values);
        result = {
          lastInsertRowid: res.lastInsertRowid,
          changes: res.changes,
          ids: [res.lastInsertRowid]
        }
      }
      const tiemConsumed = Date.now() - time
      SqlLog(stmt, this.showSql.result ? result : null, tiemConsumed);
      return result;
    } catch (e) {
      SqlLog(stmt, null, 9999);
      throw e;
    }
  };

  run(sql: string, data: any[] = []) {
    if (!this.dbPath) {
      throw new Error("未设置数据库路径")
    }
    return dbManager.open(this.dbPath, this.pwd).run(sql, data);
  };

  db() {
    if (!this.dbPath) {
      throw new Error("未设置数据库路径")
    }
    return dbManager.open(this.dbPath, this.pwd) as IDB
  }

  insertOrIgnore(table: string, data: any) {
    const insertQuery = SqlBricks.insert(table, data);
    return insertQuery
      .toString()
      .replace(/^INSERT INTO/i, "INSERT OR IGNORE INTO");
  };

}

// Facade 代理类，实现静态调用实例方法
export function Facade<T extends BaseModel>(ModelClass: new (...args: any[]) => T): Omit<T, keyof BaseModel> & Pick<typeof ModelClass, keyof typeof ModelClass> {
  return new Proxy(ModelClass, {
    get(target, prop: string) {
      // 如果是类本身的静态方法，直接返回
      if (prop in target) {
        return (target as any)[prop];
      }

      // 否则创建或获取实例，并调用实例方法
      return (...args: any[]) => {
        let instance = BaseModel.instanceMap.get(target);

        if (!instance) {
          instance = new target();
          BaseModel.instanceMap.set(target, instance);
        }

        return (instance as any)[prop](...args);
      };
    }
  }) as any;
}
