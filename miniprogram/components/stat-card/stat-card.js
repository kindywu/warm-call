// components/stat-card/stat-card.js — 统计数字卡片组件

Component({
  properties: {
    /** 标签文字 */
    label: {
      type: String,
      value: '',
    },
    /** 数值 */
    value: {
      type: null,
      value: 0,
    },
    /** 单位 */
    unit: {
      type: String,
      value: '',
    },
    /** 主色 */
    color: {
      type: String,
      value: 'var(--accent)',
    },
    /** 类型: normal | mini */
    type: {
      type: String,
      value: 'normal',
    },
    /** 是否激活态 */
    active: {
      type: Boolean,
      value: false,
    },
    /** 图标类型（可选用） */
    icon: {
      type: String,
      value: '',
    },
  },

  data: {
    displayValue: '',
  },

  observers: {
    'value, unit'(val, unit) {
      const v = val ?? 0;
      this.setData({
        displayValue: String(v) + (unit || ''),
      });
    },
  },
});
