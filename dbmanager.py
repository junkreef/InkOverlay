import sqlite3

class DbManager:

    def __init__(self, path) -> None:
        self.conn: sqlite3.Connection = self._open_(path)
        c = self.get_cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS history(id text not null primary key,  json JSON not null,  player JSON,  type TEXT CHECK(type = 'battle' or type = 'coop') not NULL DEFAULT 'battle');''')

        
    def _open_(self, path) -> sqlite3.Connection:
        return sqlite3.connect(path)


    def get_cursor(self) -> sqlite3.Cursor:
        return self.conn.cursor()


    def commit(self) -> None:
        self.conn.commit()


    def _close_(self) -> None:
        self.conn.close()


    def __del__(self) -> None:
        self._close_()

