use sqlx::{Pool, Sqlite};
use tokio::sync::Mutex;

use crate::app::app_state::AppState;

pub type DBConn = Pool<Sqlite>;
pub type MutexAppState = Mutex<AppState>;
