// components/dial-overlay/dial-overlay.js — 拨号覆盖层组件

Component({
  properties: {
    /** 是否显示 */
    show: {
      type: Boolean,
      value: false,
    },
    /** 老人姓名 */
    elderlyName: {
      type: String,
      value: '',
    },
    /** 老人性别（决定头像颜色） */
    gender: {
      type: String,
      value: '男',
    },
    /** 老人姓（显示在头像） */
    surname: {
      type: String,
      value: '',
    },
  },

  data: {
    /** 动画点 */
    dots: [1, 2, 3],
  },

  methods: {
    /** 关闭覆盖层 */
    onHangup() {
      this.triggerEvent('close');
    },
  },
});
