// components/call-btn/call-btn.js — 脉冲拨号按钮组件
const app = getApp();

Component({
  properties: {
    /** 老人 ID */
    elderlyId: {
      type: String,
      value: '',
    },
    /** 老人手机号 */
    phoneNumber: {
      type: String,
      value: '',
    },
    /** 按钮尺寸: normal | large */
    size: {
      type: String,
      value: 'normal',
    },
    /** 老人姓名（用于 overlay 显示） */
    elderlyName: {
      type: String,
      value: '',
    },
  },

  data: {
    isCalling: false,
  },

  methods: {
    /** 点击拨号 */
    onTap() {
      const { phoneNumber, elderlyId, elderlyName } = this.properties;

      if (!phoneNumber) {
        wx.showToast({ title: '暂无手机号', icon: 'none' });
        return;
      }

      if (this.data.isCalling) return;
      this.setData({ isCalling: true });

      wx.makePhoneCall({
        phoneNumber,
        success: () => {
          // 拨号成功，设置 pendingDial 标记
          const pendingDial = {
            elderlyId,
            elderlyName,
            startTime: Date.now(),
            volunteerId: app.globalData.volunteer?._id || '',
          };
          app.globalData.pendingDial = pendingDial;
          wx.setStorageSync('pendingDial', pendingDial);

          this.triggerEvent('dialsuccess', { elderlyId, phoneNumber });
        },
        fail: (err) => {
          console.error('拨号失败:', err);
          wx.showToast({ title: '拨号失败，请重试', icon: 'none' });
          this.triggerEvent('dialfail', { err });
        },
        complete: () => {
          this.setData({ isCalling: false });
        },
      });
    },
  },
});
