// src/constants/statusCodes.ts

/**
 * 業務狀態碼定義
 * 
 * 格式: XYNNN
 * X: 類別 (1=通用, 2=使用者, 3=排班, 4=報表, 5=假日)
 * Y: HTTP狀態類型 (0=2xx成功, 1=201, 4=4xx客戶端錯誤, 5=5xx伺服器錯誤)
 * NNN: 流水號
 */

export enum StatusCode {
    // ===== 1xxxx: 通用事件 =====

    // 10xxx: 成功事件
    SUCCESS = 10000,                    // 通用成功
    OPERATION_SUCCESS = 10001,          // 操作成功

    // 14xxx: 客戶端錯誤
    INVALID_REQUEST = 14000,            // 無效的請求
    MISSING_PARAMETERS = 14001,         // 缺少必要參數
    INVALID_PARAMETERS = 14002,         // 參數格式或型別錯誤
    INVALID_DATE_FORMAT = 14003,        // 日期格式錯誤
    INVALID_MONTH_RANGE = 14004,        // 月份範圍錯誤

    // 15xxx: 伺服器錯誤
    INTERNAL_ERROR = 15000,             // 伺服器內部錯誤
    DATABASE_ERROR = 15001,             // 資料庫錯誤

    // ===== 2xxxx: 使用者相關 =====

    // 20xxx: 成功事件
    LOGIN_SUCCESS = 20000,              // 登入成功
    LOGOUT_SUCCESS = 20001,             // 登出成功
    SIGNUP_SUCCESS = 21002,             // 註冊成功
    VALID_TOKEN = 21003,                // Token 有效

    // 24xxx: 客戶端錯誤
    INVALID_CREDENTIALS = 24000,        // 帳號或密碼錯誤
    UNAUTHORIZED = 24001,               // 未認證
    INVALID_TOKEN = 24002,              // Token 無效
    TOKEN_EXPIRED = 24003,              // Token 過期
    INSUFFICIENT_PERMISSIONS = 24004,   // 權限不足
    USER_NOT_FOUND = 24005,             // 使用者不存在
    ACCOUNT_DISABLED = 24006,           // 帳號已停用
    SIGNUP_FAILED = 24007,              // 註冊失敗

    // ===== 3xxxx: 排班相關 =====

    // 30xxx: 成功事件
    SHIFT_ADDED = 31000,                // 排班成功
    SHIFT_REMOVED = 30001,              // 取消排班成功

    // 34xxx: 客戶端錯誤
    SHIFT_NOT_FOUND = 34000,            // 查無排班紀錄
    SHIFT_ALREADY_EXISTS = 34001,       // 已排過該日的班
    SHIFT_DATE_OUT_OF_RANGE = 34002,    // 只能排下個月的班
    SHIFT_ON_HOLIDAY = 34003,           // 假日不可排班
    SHIFT_DATE_FULL = 34004,            // 該日已有2位員工排班
    SHIFT_MONTH_MIN_NOT_MET = 34005,    // 未達每月最低6天
    SHIFT_MONTH_MAX_EXCEEDED = 34006,   // 超過每月最多15天
    SHIFT_CONCURRENT_CONFLICT = 34007,  // 並發衝突,請重試

    // ===== 4xxxx: 報表相關 =====

    // 40xxx: 成功事件
    REPORT_GENERATED = 40000,           // 報表產生成功

    // 44xxx: 客戶端錯誤
    REPORT_NO_DATA = 44000,             // 查無資料
    REPORT_INVALID_PERIOD = 44001,      // 無效的查詢期間

    // ===== 5xxxx: 假日相關 =====

    // 50xxx: 成功事件
    HOLIDAYS_FETCHED = 50000,           // 假日資料取得成功
    HOLIDAYS_SYNCED = 50001,            // 假日資料同步成功

    // 54xxx: 客戶端錯誤
    HOLIDAYS_NOT_FOUND = 54000,         // 查無假日資料

    // 55xxx: 伺服器錯誤
    HOLIDAYS_SYNC_FAILED = 55000,       // 假日同步失敗
}

/**
 * 狀態碼訊息對照表
 */
export const StatusMessages: Record<StatusCode, string> = {
    // 通用
    [StatusCode.SUCCESS]: '操作成功',
    [StatusCode.OPERATION_SUCCESS]: '操作成功',
    [StatusCode.INVALID_REQUEST]: '無效的請求',
    [StatusCode.MISSING_PARAMETERS]: '缺少必要參數',
    [StatusCode.INVALID_PARAMETERS]: '參數格式或型別錯誤',
    [StatusCode.INVALID_DATE_FORMAT]: '日期格式錯誤',
    [StatusCode.INVALID_MONTH_RANGE]: '月份必須在 1-12 之間',
    [StatusCode.INTERNAL_ERROR]: '伺服器內部錯誤',
    [StatusCode.DATABASE_ERROR]: '資料庫錯誤',

    // 使用者
    [StatusCode.LOGIN_SUCCESS]: '登入成功',
    [StatusCode.LOGOUT_SUCCESS]: '登出成功',
    [StatusCode.SIGNUP_SUCCESS]: '註冊成功',
    [StatusCode.VALID_TOKEN]: '有效Token',
    [StatusCode.SIGNUP_FAILED]: '註冊失敗',
    [StatusCode.INVALID_CREDENTIALS]: '帳號或密碼錯誤',
    [StatusCode.UNAUTHORIZED]: '未提供認證token',
    [StatusCode.INVALID_TOKEN]: '無效的token',
    [StatusCode.TOKEN_EXPIRED]: 'Token已過期',
    [StatusCode.INSUFFICIENT_PERMISSIONS]: '權限不足',
    [StatusCode.USER_NOT_FOUND]: '使用者不存在',
    [StatusCode.ACCOUNT_DISABLED]: '帳號已停用',

    // 排班
    [StatusCode.SHIFT_ADDED]: '排班成功',
    [StatusCode.SHIFT_REMOVED]: '取消排班成功',
    [StatusCode.SHIFT_NOT_FOUND]: '查無此排班紀錄',
    [StatusCode.SHIFT_ALREADY_EXISTS]: '您已排過該日的班',
    [StatusCode.SHIFT_DATE_OUT_OF_RANGE]: '只能排下個月的班',
    [StatusCode.SHIFT_ON_HOLIDAY]: '週六、週日、國定假日不可排班',
    [StatusCode.SHIFT_DATE_FULL]: '該日已有2位員工排班',
    [StatusCode.SHIFT_MONTH_MIN_NOT_MET]: '每月必須至少排6天班',
    [StatusCode.SHIFT_MONTH_MAX_EXCEEDED]: '每月最多只能排15天班',
    [StatusCode.SHIFT_CONCURRENT_CONFLICT]: '資料衝突，請重新操作',

    // 報表
    [StatusCode.REPORT_GENERATED]: '報表產生成功',
    [StatusCode.REPORT_NO_DATA]: '查無資料',
    [StatusCode.REPORT_INVALID_PERIOD]: '無效的查詢期間',

    // 假日
    [StatusCode.HOLIDAYS_FETCHED]: '假日資料取得成功',
    [StatusCode.HOLIDAYS_SYNCED]: '假日資料同步成功',
    [StatusCode.HOLIDAYS_NOT_FOUND]: '查無假日資料',
    [StatusCode.HOLIDAYS_SYNC_FAILED]: '假日同步失敗',
}

/**
 * 根據狀態碼取得訊息
 */
export function getStatusMessage(code: StatusCode): string {
    return StatusMessages[code] || '未知錯誤'
}

/**
 * 判斷是否為成功狀態碼
 */
export function isSuccessCode(code: StatusCode): boolean {
    const codeStr = code.toString()
    return codeStr.endsWith('0xxx') || codeStr[2] === '0'
}

/**
 * 判斷是否為錯誤狀態碼
 */
export function isErrorCode(code: StatusCode): boolean {
    const codeStr = code.toString()
    return codeStr[2] === '4' || codeStr[2] === '5'
}
