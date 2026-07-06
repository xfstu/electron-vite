export interface Response<T = any> {
  /**
   * 执行代码
   */
  code: 200 | 201 | 400 | 500;

  /**
   * 执行信息
   */
  msg: string;

  /**
   * 数据
   */
  data: T;
}

export interface DbPageResult<T = any> {
  /**
   * 共几页
   */
  total: number;
  /**
   * 共几条
   */
  count: number;
  /**
   * 数据集
   */
  rows: T[];
}

export interface DbArrayResult<T = any> {
  /**
   * 数据集
   */
  rows: T[];
}

export interface DbExecAffectResult {
  /**
   * 主键ID
   */
  lastInsertRowid: number;

  /**
   * 受影响的行数
   */
  changes: number;
}
