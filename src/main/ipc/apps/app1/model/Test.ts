import { BaseModel, Facade } from "@main/utils/model";
import SqlBricksSqlite from "@main/utils/model/sql-bricks-sqlite";

export interface TestType {

}

export class TestModel extends BaseModel {
  private tableName = 'tableName';

  constructor() {
    super();
    this.setOptions()
  }

  add(data) {
    const res = this.execute(
      SqlBricksSqlite.insert(this.tableName, data)
    )
  }

  delById(id: number) {
    const res = this.execute(
      SqlBricksSqlite.delete(this.tableName).where('id', id)
    )
  }

  updateById(id: number, data) {
    const res = this.execute(
      SqlBricksSqlite.update(this.tableName, data).where('id', id)
    )
  }

  list(query: any = {}) {
    const sql = SqlBricksSqlite.select('*').from(this.tableName).orderBy('id DESC')
    for (const key in query) {
      sql.where(key, query[key])
    }
    return this.query<TestType>(sql)
  }
  //更多方法

  getById(id: number) {
    const sql = SqlBricksSqlite.select('*').from(this.tableName).where('id', id)
    return this.query<TestType>(sql)
  }
}
export const ModelTest = Facade(TestModel);