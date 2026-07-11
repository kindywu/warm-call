// custom-tab-bar/index.js — 暖心通话 · 自定义底部导航
const app = getApp();

Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: '/pages/contacts/contacts',
        text: '联系人',
        icon: 'contacts',
      },
      {
        pagePath: '/pages/stats/stats',
        text: '统计',
        icon: 'stats',
      },
      {
        pagePath: '/pages/volunteer/volunteer',
        text: '我的',
        icon: 'me',
      },
    ],
  },

  methods: {
    /** Tab 点击切换 */
    switchTab(e) {
      const { index, path } = e.currentTarget.dataset;
      if (this.data.selected === index) return;

      wx.switchTab({
        url: path,
        success: () => {
          this.setData({ selected: index });
        },
      });
    },

    /** 外部更新选中状态 */
    setSelected(index) {
      this.setData({ selected: index });
    },
  },
});
