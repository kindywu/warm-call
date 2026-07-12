// utils/format.js — 暖心通话 · 格式化工具

/**
 * 格式化日期为 MM-DD
 * @param {Date|string|number} date
 * @returns {string}
 */
function formatDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
function formatFullDate(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 格式化为 YYYY-MM-DD HH:mm
 */
function formatDateTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${formatFullDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 格式化通话时长
 * @param {number} min - 分钟数
 * @returns {string}
 */
function formatDuration(min) {
  if (!min && min !== 0) return '';
  if (min < 60) return `${min}分钟`;
  const hours = Math.floor(min / 60);
  const mins = min % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

/**
 * 格式化通话时长(紧凑)
 * @param {number} min
 * @returns {string}
 */
function formatDurationCompact(min) {
  if (!min && min !== 0) return '0m';
  if (min < 60) return `${min}m`;
  return `${(min / 60).toFixed(1)}h`;
}

/**
 * 相对时间（多久以前）
 * @param {Date|string|number} date
 * @returns {string}
 */
function formatRelative(date) {
  if (!date) return '未联系';
  const d = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (isNaN(d)) return '';
  const now = Date.now();
  const diff = now - d;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return formatDate(date);
}

/**
 * 今天零点（本地时区）
 * 全小程序统一使用此函数界定「自然日」，避免各页面口径不一。
 * @returns {Date}
 */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 判断给定时间是否为今天（本地自然日）
 * @param {Date|string|number} date
 * @returns {boolean}
 */
function isToday(date) {
  if (!date) return false;
  const t = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (isNaN(t)) return false;
  return t >= startOfToday().getTime();
}

/**
 * 计算距今天数（自然日口径，与 startOfToday 一致）
 * @param {Date|string|number} lastCallAt
 * @returns {number} 距今天数，无记录返回 Infinity；今天返回 0
 */
function getOverdueDays(lastCallAt) {
  if (!lastCallAt) return Infinity;
  const last = lastCallAt instanceof Date ? lastCallAt.getTime() : new Date(lastCallAt).getTime();
  if (isNaN(last)) return Infinity;
  const today = startOfToday();
  if (last >= today.getTime()) return 0;
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);
  // 用日期差而非纯毫秒，规避时区/夏令时导致的边界误差（中国无夏令时，仍保持稳健）
  return Math.round((today.getTime() - lastDay.getTime()) / 86400000);
}

/**
 * 格式化手机号（隐藏中间四位）
 */
function formatPhone(phone) {
  if (!phone) return '';
  const s = String(phone);
  if (s.length === 11) return s.slice(0, 3) + '****' + s.slice(7);
  return s;
}

module.exports = {
  formatDate,
  formatFullDate,
  formatDateTime,
  formatDuration,
  formatDurationCompact,
  formatRelative,
  startOfToday,
  isToday,
  getOverdueDays,
  formatPhone,
};
